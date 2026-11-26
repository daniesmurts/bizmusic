import "server-only";

import { parseStorageObjectRef, type StorageObjectRef } from "@/lib/storage-object-ref";
import { s3Delete, s3List, s3PresignGet, s3PresignPut, s3PutObject } from "@/lib/s3-storage";

// Yandex Object Storage (private bucket). Browsers get presigned URLs directly;
// "public" assets (covers, blog images, license PDFs) go through /api/media.

export { parseStorageObjectRef };
export type { StorageObjectRef };

export async function getUploadSignedUrl(
  fileName: string,
  folder: string = "tracks",
): Promise<{ uploadUrl: string; publicUrl: string; objectPath: string }> {
  const path = `${folder}/${fileName}`;
  const uploadUrl = await s3PresignPut(path, 3600);
  return { uploadUrl, publicUrl: getFilePublicUrl(fileName, folder), objectPath: path };
}

/** Server-side upload from a Buffer. Returns the stable /api/media URL. */
export async function uploadFileBuffer(
  buffer: Buffer,
  fileName: string,
  folder: string = "tracks",
  contentType: string = "audio/mpeg",
): Promise<string> {
  await s3PutObject(`${folder}/${fileName}`, buffer, contentType);
  invalidateSignedUrlCache(fileName, folder);
  return getFilePublicUrl(fileName, folder);
}

/**
 * Stable URL for "public" assets: /api/media presigns and redirects, so the URL
 * never expires and is safe to store in the DB or OG tags. /api/media only
 * serves the blog/, covers/ and licenses/ prefixes — audio must use
 * getDownloadSignedUrl().
 */
export function getFilePublicUrl(fileName: string, folder: string = "tracks"): string {
  return `/api/media/${folder}/${fileName}`;
}

// Presigned URLs are cached per instance and evicted 120 s before expiry, so a
// catalog load doesn't re-sign every track on every request.
interface CachedUrl {
  url: string;
  expiresAt: number;
}
const signedUrlCache = new Map<string, CachedUrl>();

function pruneCache() {
  if (signedUrlCache.size < 500) return;
  const now = Date.now();
  for (const [key, entry] of signedUrlCache) {
    if (entry.expiresAt <= now) signedUrlCache.delete(key);
  }
}

export async function getDownloadSignedUrl(
  fileName: string,
  folder: string = "tracks",
  expiresIn: number = 86400,
): Promise<string> {
  const key = `${folder}/${fileName}`;
  const cached = signedUrlCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const url = await s3PresignGet(key, expiresIn);
  pruneCache();
  signedUrlCache.set(key, { url, expiresAt: Date.now() + (expiresIn - 120) * 1000 });
  return url;
}

export function invalidateSignedUrlCache(fileName: string, folder: string = "tracks") {
  signedUrlCache.delete(`${folder}/${fileName}`);
}

export async function deleteFile(fileName: string, folder: string = "tracks"): Promise<void> {
  invalidateSignedUrlCache(fileName, folder);
  await s3Delete([`${folder}/${fileName}`]);
}

/** File names (relative to prefix) under a prefix. */
export function listTrackFiles(prefix: string = "tracks/"): Promise<string[]> {
  return s3List(prefix);
}

export function generateUniqueFileName(originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "mp3";
  const random = Math.random().toString(36).substring(2, 9);
  return `track_${Date.now()}_${random}.${ext}`;
}

export function isValidAudioFile(file: File): boolean {
  return ["audio/mpeg", "audio/mp3", "audio/wav", "audio/wave", "audio/x-wav", "audio/ogg", "audio/flac"].includes(
    file.type,
  );
}

export function isValidImageFile(file: File): boolean {
  return ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/svg+xml"].includes(file.type);
}

export function getFileSizeInMB(bytes: number): number {
  return bytes / (1024 * 1024);
}

export const MAX_FILE_SIZE = 100 * 1024 * 1024;
