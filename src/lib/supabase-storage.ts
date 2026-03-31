import "server-only";

import { createClient } from '@supabase/supabase-js';
import { parseStorageObjectRef, type StorageObjectRef } from "@/lib/storage-object-ref";

// Supabase Storage configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize Supabase client with service role key for server-side operations
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const BUCKET_NAME = 'bizmusic-assets';
export { parseStorageObjectRef };
export type { StorageObjectRef };

export async function getUploadSignedUrl(
  fileName: string,
  folder: string = 'tracks',
  fileType?: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  // `fileType` is currently unused in the upload flow but kept for future validation/logic.
  void fileType;
  const path = `${folder}/${fileName}`;
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(path);

  if (error) {
    throw new Error(`Failed to create upload URL: ${error.message}`);
  }

  // Generate public URL for the file
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return {
    uploadUrl: data.signedUrl,
    publicUrl: publicUrl,
  };
}

/**
 * Upload a file directly from a Buffer (server-side)
 * @param buffer - Node.js Buffer
 * @param fileName - Unique filename
 * @param folder - Destination folder
 * @param contentType - MIME type
 * @returns Public URL of the uploaded file
 */
export async function uploadFileBuffer(
  buffer: Buffer,
  fileName: string,
  folder: string = 'tracks',
  contentType: string = 'audio/mpeg'
): Promise<string> {
  const path = `${folder}/${fileName}`;
  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload buffer: ${error.message}`);
  }

  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);

  return publicUrl;
}

/**
 * Get the public URL for a track file
 * @param fileName - The name of the file
 * @param folder - The folder in the bucket (default: tracks)
 * @returns Public URL for the file
 */
export function getFilePublicUrl(fileName: string, folder: string = 'tracks'): string {
  const path = `${folder}/${fileName}`;
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path);
  
  return publicUrl;
}

/**
 * Generate a signed URL for downloading/streaming a file.
 * Includes retry logic for transient network failures (e.g. Cloudflare timeouts).
 * @param fileName - The name of the file
 * @param folder - The folder in the bucket
 * @param expiresIn - URL expiration time in seconds (default: 24 hours for streaming)
 * @returns Signed URL for download
 */
export async function getDownloadSignedUrl(
  fileName: string,
  folder: string = 'tracks',
  expiresIn: number = 86400
): Promise<string> {
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .createSignedUrl(`${folder}/${fileName}`, expiresIn);

      if (error) {
        throw new Error(`Failed to create download URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const isFetchError = lastError.message.includes('fetch failed') ||
        lastError.message.includes('ConnectTimeout') ||
        lastError.message.includes('ECONNRESET');

      if (!isFetchError || attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff: 500ms, 1000ms
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }

  throw lastError!;
}

/**
 * Delete a file from Supabase Storage
 * @param fileName - The name of the file to delete
 */
export async function deleteFile(fileName: string, folder: string = 'tracks'): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .remove([`${folder}/${fileName}`]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * List all track files in the storage
 * @param prefix - Optional prefix to filter files (e.g., "tracks/")
 * @returns List of file names
 */
export async function listTrackFiles(prefix: string = 'tracks/'): Promise<string[]> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .list(prefix, {
      limit: 1000,
      offset: 0,
    });

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return data.map((file) => file.name);
}

/**
 * Generate a unique filename for audio upload
 * @param originalName - Original filename
 * @returns Unique filename with timestamp and random string
 */
export function generateUniqueFileName(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'mp3';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `track_${timestamp}_${random}.${ext}`;
}

/**
 * Validate audio file type
 * @param file - File to validate
 * @returns True if valid audio format
 */
export function isValidAudioFile(file: File): boolean {
  const validTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/ogg',
    'audio/flac',
  ];
  return validTypes.includes(file.type);
}

/**
 * Validate image file type
 * @param file - File to validate
 * @returns True if valid image format
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ];
  return validTypes.includes(file.type);
}

/**
 * Get file size in MB
 * @param bytes - File size in bytes
 * @returns File size in MB
 */
export function getFileSizeInMB(bytes: number): number {
  return bytes / (1024 * 1024);
}

/**
 * Maximum file size for uploads (100MB)
 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
