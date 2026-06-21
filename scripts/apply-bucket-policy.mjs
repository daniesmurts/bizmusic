/**
 * Apply (and verify) the bucket policy from scripts/bucket-policy.json to the
 * Yandex Object Storage bucket, using the S3_* credentials in .env.local.
 *
 * Usage:  node scripts/apply-bucket-policy.mjs
 *
 * Note: setting a bucket policy may require the SA to have `storage.admin`
 * (not just storage.editor). If you get AccessDenied, apply it from the YC
 * Console instead (Object Storage → bucket → Bucket policy), which uses your
 * own account permissions.
 */

import { readFileSync } from "node:fs";
import { config } from "dotenv";
import {
  S3Client,
  PutBucketPolicyCommand,
  GetBucketPolicyCommand,
} from "@aws-sdk/client-s3";

config({ path: ".env.local" });

const ENDPOINT = process.env.S3_ENDPOINT ?? "https://storage.yandexcloud.net";
const REGION = process.env.S3_REGION ?? "ru-central1";
const BUCKET = process.env.S3_BUCKET ?? "";
const ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID ?? "";
const SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY ?? "";

const ok = (m) => console.log(`\x1b[32m✓\x1b[0m ${m}`);
const fail = (m) => console.log(`\x1b[31m✗\x1b[0m ${m}`);

if (!BUCKET || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
  fail("Missing S3_BUCKET / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY in .env.local");
  process.exit(1);
}

const policy = readFileSync(new URL("./bucket-policy.json", import.meta.url), "utf8");

const s3 = new S3Client({
  endpoint: ENDPOINT,
  region: REGION,
  forcePathStyle: true,
  credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
});

try {
  await s3.send(new PutBucketPolicyCommand({ Bucket: BUCKET, Policy: policy }));
  ok(`Policy applied to bucket "${BUCKET}"`);

  const got = await s3.send(new GetBucketPolicyCommand({ Bucket: BUCKET }));
  const resources = JSON.parse(got.Policy ?? "{}").Statement?.[0]?.Resource ?? [];
  ok("Verified — public-read prefixes:");
  for (const r of resources) console.log(`    ${r}`);
} catch (err) {
  fail(`${err?.name ?? "Error"}: ${err?.message ?? err}`);
  if (String(err?.name).includes("AccessDenied")) {
    console.log(
      "\n→ The SA lacks bucket-policy permission. Either grant it `storage.admin`,\n" +
      "  or apply scripts/bucket-policy.json from the YC Console (Bucket policy tab).",
    );
  }
  process.exit(1);
}
