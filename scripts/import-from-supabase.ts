/**
 * Moves the platform catalog from the old Supabase project to Yandex Cloud.
 * Users, businesses and their data are NOT moved (fresh start).
 *
 *   1. With VPN ON (Supabase is blocked in RF):
 *        npx tsx scripts/import-from-supabase.ts export [--skip-files]
 *      Reads catalog rows from the Supabase DB into scratch/supabase-export/catalog.json
 *      and copies referenced files from Supabase Storage into the Yandex bucket.
 *
 *   2. With VPN OFF (Yandex DB only accepts your IP):
 *        npx tsx scripts/import-from-supabase.ts import
 *      Inserts the rows into the Yandex DB. Existing ids are skipped, so re-runs are safe.
 *
 * Source: the first Supabase URL in .env / .env.local (DATABASE_URL or DRIZZLE_DATABASE_URL),
 *         NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for storage.
 * Target: DATABASE_URL in .env.local, S3_* in .env.local (the new bucket).
 */
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { Pool, type PoolClient } from "pg";
import { S3Client, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

const OUT_DIR = path.join("scratch", "supabase-export");
const OUT_FILE = path.join(OUT_DIR, "catalog.json");
const SUPABASE_BUCKET = "bizmusic-assets";
const STORAGE_URL_RE = /https?:\/\/[^/"'\s]+\/storage\/v1\/object\/(?:public|sign|authenticated)\/bizmusic-assets\/([^?"'\s]+)(?:\?[^"'\s]*)?/g;
// Prefixes /api/media is allowed to serve.
const MEDIA_PREFIXES = ["blog/", "covers/", "licenses/"];

type Row = Record<string, unknown>;
interface Export {
  exportedAt: string;
  tables: Record<string, Row[]>;
  files: { src: string; dst: string }[];
}

// Insert order respects foreign keys.
const TABLES: { name: string; where?: string }[] = [
  { name: "artists" },
  { name: "albums" },
  { name: "blog_categories" },
  { name: "tracks", where: `"businessId" is null` },
  { name: "playlists", where: `"businessId" is null` },
  { name: "playlist_tracks" },
  { name: "blog_posts" },
  { name: "song_of_the_week" },
];

function envFile(file: string): Record<string, string> {
  return fs.existsSync(file) ? dotenv.parse(fs.readFileSync(file)) : {};
}

function sourceDbUrl(): string {
  for (const file of [".env.local", ".env"]) {
    const env = envFile(file);
    for (const key of ["SUPABASE_DATABASE_URL", "DRIZZLE_DATABASE_URL", "DATABASE_URL"]) {
      if (env[key] && /supabase\.(co|com)/.test(env[key])) return env[key];
    }
  }
  throw new Error("No Supabase database URL found in .env.local or .env");
}

// ─── export ──────────────────────────────────────────────────────────────────

async function exportCatalog() {
  const local = { ...envFile(".env"), ...envFile(".env.local") };
  const supabaseUrl = local.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = local.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = local.S3_BUCKET;
  if (!supabaseUrl || !serviceKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
  const skipFiles = process.argv.includes("--skip-files");
  if (!skipFiles && (!bucket || !local.S3_ACCESS_KEY_ID || !local.S3_SECRET_ACCESS_KEY)) throw new Error("S3_BUCKET / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY missing in .env.local");

  const src = new Pool({ connectionString: sourceDbUrl(), ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 20_000 });
  const tables: Record<string, Row[]> = {};
  const files = new Map<string, string>();

  const addFile = (srcPath: string, dst?: string) => {
    const clean = decodeURIComponent(srcPath.replace(/^\/+/, ""));
    files.set(clean, dst ?? clean);
    return dst ?? clean;
  };

  try {
    for (const { name, where } of TABLES) {
      const exists = await src.query(`select to_regclass($1) as t`, [`public.${name}`]);
      if (!exists.rows[0].t) {
        console.log(`  ${name.padEnd(18)} (not in source)`);
        tables[name] = [];
        continue;
      }
      const { rows } = await src.query(`select * from "${name}"${where ? ` where ${where}` : ""}`);
      for (const row of rows) {
        for (const [col, value] of Object.entries(row)) {
          if (typeof value !== "string") continue;
          // Track audio: bare file name or path inside the bucket.
          if (name === "tracks" && col === "fileUrl") {
            const m = [...value.matchAll(STORAGE_URL_RE)][0];
            const objectPath = m ? m[1] : value.includes("/") ? value : `tracks/${value}`;
            row[col] = addFile(objectPath);
            continue;
          }
          // Any other Supabase Storage URL → stable /api/media URL on Yandex.
          row[col] = value.replace(STORAGE_URL_RE, (_full, objectPath: string) => {
            const decoded = decodeURIComponent(objectPath);
            const dst = MEDIA_PREFIXES.some((p) => decoded.startsWith(p))
              ? decoded
              : `covers/${path.posix.basename(decoded)}`;
            return `/api/media/${addFile(decoded, dst)}`;
          });
        }
      }
      tables[name] = rows;
      console.log(`  ${name.padEnd(18)} ${rows.length} rows`);
    }
  } finally {
    await src.end();
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const data: Export = {
    exportedAt: new Date().toISOString(),
    tables,
    files: [...files].map(([s, d]) => ({ src: s, dst: d })),
  };
  fs.writeFileSync(OUT_FILE, JSON.stringify(data, null, 2));
  if (skipFiles) {
    console.log(`\nRows saved to ${OUT_FILE}. Files skipped (--skip-files): ${data.files.length} referenced.`);
    return;
  }
  console.log(`\nRows saved to ${OUT_FILE}. Copying ${data.files.length} files to bucket "${bucket}"…`);

  const s3 = new S3Client({
    endpoint: local.S3_ENDPOINT || "https://storage.yandexcloud.net",
    region: local.S3_REGION || "ru-central1",
    forcePathStyle: true,
    credentials: { accessKeyId: local.S3_ACCESS_KEY_ID, secretAccessKey: local.S3_SECRET_ACCESS_KEY },
  });

  let copied = 0, skipped = 0, failed = 0;
  const queue = [...data.files];
  const worker = async () => {
    for (let f = queue.shift(); f; f = queue.shift()) {
      try {
        try {
          await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: f.dst }));
          skipped++;
          continue;
        } catch {
          // not there yet
        }
        const res = await fetch(`${supabaseUrl}/storage/v1/object/${SUPABASE_BUCKET}/${f.src.split("/").map(encodeURIComponent).join("/")}`, {
          headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
          signal: AbortSignal.timeout(180_000),
        });
        if (!res.ok) throw new Error(`download HTTP ${res.status}`);
        const body = Buffer.from(await res.arrayBuffer());
        await s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: f.dst,
          Body: body,
          ContentType: res.headers.get("content-type") ?? undefined,
        }));
        copied++;
        if (copied % 10 === 0) console.log(`  … ${copied} copied`);
      } catch (err) {
        failed++;
        console.error(`  ✗ ${f.src}: ${err instanceof Error ? err.message : err}`);
      }
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  console.log(`\nFiles: ${copied} copied, ${skipped} already there, ${failed} failed.`);
  if (failed) {
    console.log("Re-run `export` to retry the failed files.");
    process.exitCode = 1;
  } else {
    console.log("Next: turn the VPN OFF and run `npx tsx scripts/import-from-supabase.ts import`.");
  }
}

// ─── import ──────────────────────────────────────────────────────────────────

async function targetColumns(client: PoolClient, table: string) {
  const { rows } = await client.query(
    `select column_name, data_type, is_nullable from information_schema.columns where table_schema = 'public' and table_name = $1`,
    [table],
  );
  return new Map(rows.map((r) => [r.column_name as string, { type: r.data_type as string, nullable: r.is_nullable === "YES" }]));
}

async function importCatalog() {
  if (!fs.existsSync(OUT_FILE)) throw new Error(`${OUT_FILE} not found. Run \`export\` first (with VPN on).`);
  const data = JSON.parse(fs.readFileSync(OUT_FILE, "utf8")) as Export;

  const { loadTargetDb } = await import("./lib/target-db");
  const { getSsl, stripSslParams } = await import("../src/db/ssl");
  const url = loadTargetDb();
  const pool = new Pool({ connectionString: stripSslParams(url), ssl: getSsl(url), connectionTimeoutMillis: 15_000 });
  const client = await pool.connect();

  try {
    const admin = await client.query(`select id from users where role = 'ADMIN' order by "createdAt" limit 1`);
    if (!admin.rows[0]) throw new Error("No ADMIN user in the target DB. Run `npm run create-admin` first.");
    const adminId = admin.rows[0].id as string;

    await client.query("begin");
    const imported = new Map<string, Set<string>>();

    for (const { name } of TABLES) {
      const rows = data.tables[name] ?? [];
      const cols = await targetColumns(client, name);
      if (cols.size === 0) {
        console.log(`  ${name.padEnd(18)} (not in target, skipped)`);
        continue;
      }
      const ids = new Set<string>();
      let inserted = 0, dropped = 0;

      for (const original of rows) {
        const row: Row = { ...original };
        // Rewire references to rows we don't move.
        if ("authorId" in row) row.authorId = adminId;
        if ("userId" in row) row.userId = cols.get("userId")?.nullable ? null : adminId;
        if ("businessId" in row) row.businessId = null;
        if (name === "playlist_tracks" && (!imported.get("playlists")?.has(row.playlistId as string) || !imported.get("tracks")?.has(row.trackId as string))) {
          dropped++;
          continue;
        }
        if (name === "song_of_the_week" && !imported.get("tracks")?.has(row.trackId as string)) {
          dropped++;
          continue;
        }

        const keys = Object.keys(row).filter((k) => cols.has(k));
        const values = keys.map((k) => {
          const v = row[k];
          const t = cols.get(k)!.type;
          return (t === "json" || t === "jsonb") && v !== null ? JSON.stringify(v) : v;
        });
        const res = await client.query(
          `insert into "${name}" (${keys.map((k) => `"${k}"`).join(", ")}) values (${keys.map((_, i) => `$${i + 1}`).join(", ")}) on conflict do nothing`,
          values,
        );
        inserted += res.rowCount ?? 0;
        if (row.id) ids.add(row.id as string);
      }
      imported.set(name, ids);
      console.log(`  ${name.padEnd(18)} ${inserted} inserted${rows.length - inserted - dropped > 0 ? `, ${rows.length - inserted - dropped} already present` : ""}${dropped ? `, ${dropped} skipped (parent not moved)` : ""}`);
    }

    await client.query("commit");
    console.log("\n✅ Catalog imported.");
  } catch (err) {
    await client.query("rollback").catch(() => {});
    const e = err as { code?: string; message?: string; detail?: string };
    console.error(`❌ ${e.code ?? ""} ${e.message ?? err}${e.detail ? `\n   ${e.detail}` : ""}`);
    console.error("   Nothing was written (the import runs in one transaction).");
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

const mode = process.argv[2];
if (mode === "export") exportCatalog().catch((e) => { console.error(`❌ ${e.message ?? e}`); process.exit(1); });
else if (mode === "import") importCatalog().catch((e) => { console.error(`❌ ${e.message ?? e}`); process.exit(1); });
else {
  console.error("Usage: npx tsx scripts/import-from-supabase.ts export|import");
  process.exit(1);
}
