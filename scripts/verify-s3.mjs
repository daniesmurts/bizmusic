/**
 * Standalone verification for the Yandex Object Storage setup.
 *
 * Confirms the service account role, static access key, and bucket all work by
 * doing a full round-trip: upload → list → presign GET → fetch → delete.
 * Touches nothing in production — writes one tiny object under __healthcheck/
 * and deletes it.
 *
 * Usage:
 *   1. Put the S3_* vars in .env.local (or export them), then:
 *   2. node scripts/verify-s3.mjs
 */

import { config } from "dotenv";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

config({ path: ".env.local" });

const ENDPOINT = process.env.S3_ENDPOINT ?? "https://storage.yandexcloud.net";
const REGION = process.env.S3_REGION ?? "ru-central1";
const BUCKET = process.env.S3_BUCKET ?? "";
const ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID ?? "";
const SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY ?? "";

const ok = (m) => console.log(`\x1b[32m✓\x1b[0m ${m}`);
const fail = (m) => console.log(`\x1b[31m✗\x1b[0m ${m}`);

function checkEnv() {
  const missing = [];
  if (!BUCKET) missing.push("S3_BUCKET");
  if (!ACCESS_KEY_ID) missing.push("S3_ACCESS_KEY_ID");
  if (!SECRET_ACCESS_KEY) missing.push("S3_SECRET_ACCESS_KEY");
  if (missing.length) {
    fail(`Missing env vars: ${missing.join(", ")}`);
    console.log("\nSet them in .env.local, then re-run.");
    process.exit(1);
  }
  ok(`Env: bucket="${BUCKET}", endpoint=${ENDPOINT}, region=${REGION}`);
  ok(`Key: ${ACCESS_KEY_ID.slice(0, 6)}…${ACCESS_KEY_ID.slice(-4)}`);
}

async function main() {
  checkEnv();

  const s3 = new S3Client({
    endpoint: ENDPOINT,
    region: REGION,
    forcePathStyle: true,
    credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
  });

  const key = `__healthcheck/verify-${Date.now()}.txt`;
  const payload = `bizmuzik s3 verify ${new Date().toISOString()}`;

  try {
    // 1. PutObject (needs storage.editor / uploader)
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: payload,
        ContentType: "text/plain",
      }),
    );
    ok(`Upload (PutObject) → ${key}`);

    // 2. ListObjectsV2 (needs read/list)
    const list = await s3.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: "__healthcheck/" }),
    );
    const found = (list.Contents ?? []).some((o) => o.Key === key);
    found ? ok(`List (ListObjectsV2) → object visible`) : fail("List did not return the object");

    // 3. Presign GET + fetch (the streaming/download read path)
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: BUCKET, Key: key }),
      { expiresIn: 120 },
    );
    const res = await fetch(url);
    const body = await res.text();
    if (res.ok && body === payload) {
      ok(`Presigned GET fetched (HTTP ${res.status}, body matches)`);
    } else {
      fail(`Presigned GET mismatch (HTTP ${res.status}, body="${body.slice(0, 40)}")`);
    }

    // 4. DeleteObject (cleanup — needs storage.editor)
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    ok(`Delete (DeleteObject) → cleaned up`);

    console.log("\n\x1b[32mAll checks passed — SA role, key, and bucket are working.\x1b[0m");
  } catch (err) {
    fail(`${err?.name ?? "Error"}: ${err?.message ?? err}`);
    if (String(err?.name).includes("AccessDenied") || String(err?.Code).includes("AccessDenied")) {
      console.log("\n→ The key works but the SA lacks permission. Grant storage.editor on the bucket.");
    } else if (String(err?.name).includes("NoSuchBucket")) {
      console.log("\n→ Bucket not found. Check S3_BUCKET name and region.");
    } else if (String(err?.name).includes("SignatureDoesNotMatch") || String(err?.name).includes("InvalidAccessKeyId")) {
      console.log("\n→ Static access key is wrong. Use a *static* access key (not the RSA authorized key).");
    }
    // best-effort cleanup
    try { await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key })); } catch {}
    process.exit(1);
  }
}

main();
