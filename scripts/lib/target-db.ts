import * as fs from "fs";
import * as dotenv from "dotenv";

/** Loads .env.local then .env (first wins), refuses Supabase, prints the target host. */
export function loadTargetDb(): string {
  if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local", quiet: true });
  if (fs.existsSync(".env")) dotenv.config({ path: ".env", quiet: true });

  const url = process.env.DATABASE_URL ?? "";
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }
  if (/supabase\.(co|com)/.test(url)) {
    console.error(
      "Refusing to run against Supabase. Set DATABASE_URL in .env.local to the Yandex cluster " +
        "(postgresql://bizmuzik:…@c-<cluster_id>.rw.mdb.yandexcloud.net:6432/bizmuzik) and run `npm run db:migrate` first.",
    );
    process.exit(1);
  }
  console.log(`Target database: ${new URL(url).hostname}`);
  return url;
}

const HINTS: Record<string, string> = {
  ETIMEDOUT: "Timed out: this machine's IP isn't allowed on port 6432 in the cluster's security group.",
  ECONNREFUSED: "Connection refused: wrong host or port (Yandex uses 6432).",
  ENOTFOUND: "Host not found: check the cluster ID in DATABASE_URL.",
  "28P01": "Wrong database password in DATABASE_URL (special characters must be URL-encoded).",
  "23505": "A row with this value already exists.",
};

/** One-line explanation of a DB error, without echoing query parameters (hashes, emails). */
export function explainDbError(err: unknown): string {
  const e = err as { code?: string; message?: string; cause?: { code?: string; message?: string } };
  const code = e.cause?.code ?? e.code;
  const message = e.cause?.message ?? e.message?.split("\n")[0] ?? String(err);
  const hint =
    (code && HINTS[code]) ||
    (/terminated unexpectedly|closed the connection|timeout/i.test(message)
      ? "Connection dropped: turn the VPN off (the database only accepts your own IP), then retry."
      : undefined);
  return `❌ ${code ? `${code} ` : ""}${message}${hint ? `\n   ${hint}` : ""}`;
}
