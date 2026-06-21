/**
 * Apply a CORS configuration to the Yandex Object Storage bucket so the browser
 * can fetch() audio blobs for offline caching (cacheAudioTrack) and any other
 * cross-origin fetch of presigned URLs. <audio>/<img> don't need CORS, but
 * fetch() does — without this, offline caching fails with "Load failed".
 *
 * Read-only (GET/HEAD) from any origin; access is still gated by the presigned
 * URL signature, so "*" origins is safe here.
 *
 * Usage:  node scripts/apply-bucket-cors.mjs
 */

import { config } from "dotenv";
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";

config({ path: ".env.local" });

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT ?? "https://storage.yandexcloud.net",
  region: process.env.S3_REGION ?? "ru-central1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});
const Bucket = process.env.S3_BUCKET;

const CORSConfiguration = {
  CORSRules: [
    {
      AllowedOrigins: ["*"],
      AllowedMethods: ["GET", "HEAD"],
      AllowedHeaders: ["*"],
      ExposeHeaders: ["Content-Range", "Accept-Ranges", "Content-Length", "Content-Type", "ETag"],
      MaxAgeSeconds: 3600,
    },
  ],
};

try {
  await s3.send(new PutBucketCorsCommand({ Bucket, CORSConfiguration }));
  console.log(`\x1b[32m✓\x1b[0m CORS applied to "${Bucket}"`);
  const got = await s3.send(new GetBucketCorsCommand({ Bucket }));
  console.log(JSON.stringify(got.CORSRules, null, 2));
} catch (err) {
  console.log(`\x1b[31m✗\x1b[0m ${err?.name}: ${err?.message}`);
  if (String(err?.name).includes("AccessDenied")) {
    console.log("\n→ SA lacks CORS permission. Apply via YC Console → bucket → CORS tab instead.");
  }
  process.exit(1);
}
