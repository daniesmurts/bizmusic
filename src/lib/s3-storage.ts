import "server-only";

/**
 * Yandex Object Storage (S3-compatible) backend.
 *
 * This is the migration target that replaces Supabase Storage. Yandex Object
 * Storage is reachable from inside the Russian Federation (no carrier block),
 * supports HTTP Range requests natively, and has no 3.5 MiB response cap — so
 * audio is served DIRECTLY to the browser and the /api/storage-proxy reverse
 * proxy is no longer needed.
 *
 * Activation is controlled purely by environment variables: when S3_BUCKET +
 * credentials are present, `S3_ENABLED` is true and src/lib/supabase-storage.ts
 * delegates all storage operations here. Until then this module is dormant and
 * production keeps using Supabase. This lets the code merge safely before the
 * bucket exists.
 *
 * Required env vars:
 *   S3_ENDPOINT          (default https://storage.yandexcloud.net)
 *   S3_REGION            (default ru-central1)
 *   S3_BUCKET
 *   S3_ACCESS_KEY_ID
 *   S3_SECRET_ACCESS_KEY
 *   S3_PUBLIC_BASE_URL   (optional — override for a CDN / custom domain in front
 *                         of the bucket; defaults to <endpoint>/<bucket>)
 */

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ENDPOINT = process.env.S3_ENDPOINT ?? "https://storage.yandexcloud.net";
const REGION = process.env.S3_REGION ?? "ru-central1";
const BUCKET = process.env.S3_BUCKET ?? "";
const ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID ?? "";
const SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY ?? "";
const PUBLIC_BASE_URL =
  process.env.S3_PUBLIC_BASE_URL ??
  `${ENDPOINT.replace(/\/+$/, "")}/${BUCKET}`;

/**
 * True when the S3 backend is fully configured. src/lib/supabase-storage.ts
 * checks this to decide whether to route storage operations to Object Storage.
 */
export const S3_ENABLED = Boolean(BUCKET && ACCESS_KEY_ID && SECRET_ACCESS_KEY);

let _client: S3Client | undefined;
function client(): S3Client {
  if (!S3_ENABLED) {
    throw new Error(
      "[S3] not configured — set S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY",
    );
  }
  if (!_client) {
    _client = new S3Client({
      endpoint: ENDPOINT,
      region: REGION,
      // Yandex Object Storage works reliably with path-style addressing.
      forcePathStyle: true,
      credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      },
    });
  }
  return _client;
}

const normalizeKey = (objectPath: string) => objectPath.replace(/^\/+/, "");

/**
 * Public (unsigned) URL for an object. Only valid for objects in a bucket with
 * public-read access (e.g. cover images). For private objects use s3PresignGet.
 */
export function s3PublicUrl(objectPath: string): string {
  return `${PUBLIC_BASE_URL.replace(/\/+$/, "")}/${normalizeKey(objectPath)}`;
}

/** Presigned GET URL for streaming/downloading a private object. */
export function s3PresignGet(
  objectPath: string,
  expiresIn: number,
): Promise<string> {
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: BUCKET, Key: normalizeKey(objectPath) }),
    { expiresIn },
  );
}

/**
 * Presigned PUT URL for a browser upload. We intentionally do NOT bind
 * Content-Type into the signature: the browser still sends its own Content-Type
 * header (which Object Storage stores as the object's content type), but the
 * signature stays valid regardless of what the client sends — matching the
 * existing lenient `xhr.open("PUT", uploadUrl)` clients with zero changes.
 */
export function s3PresignPut(
  objectPath: string,
  expiresIn: number = 3600,
): Promise<string> {
  return getSignedUrl(
    client(),
    new PutObjectCommand({ Bucket: BUCKET, Key: normalizeKey(objectPath) }),
    { expiresIn },
  );
}

/** Server-side upload from a Buffer (used for generated PDFs, etc.). */
export async function s3PutObject(
  objectPath: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<void> {
  await client().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: normalizeKey(objectPath),
      Body: body,
      ContentType: contentType,
    }),
  );
}

/**
 * List object keys under a prefix, returned RELATIVE to that prefix to match
 * the existing Supabase `.list(prefix).map(f => f.name)` behaviour (basenames).
 */
export async function s3List(prefix: string): Promise<string[]> {
  const Prefix = normalizeKey(prefix).replace(/\/?$/, "/");
  const out = await client().send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix, MaxKeys: 1000 }),
  );
  return (out.Contents ?? [])
    .map((o) => o.Key ?? "")
    .filter(Boolean)
    .map((key) => (key.startsWith(Prefix) ? key.slice(Prefix.length) : key))
    .filter(Boolean);
}

/** Delete one or more objects. */
export async function s3Delete(objectPaths: string[]): Promise<void> {
  if (objectPaths.length === 0) return;
  await client().send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: objectPaths.map((p) => ({ Key: normalizeKey(p) })) },
    }),
  );
}
