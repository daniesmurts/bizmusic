import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { getSsl, stripSslParams } from "./src/db/ssl";

// dotenv never overrides, so the first file wins: .env.local takes precedence (same as Next.js).
if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local", quiet: true });
if (fs.existsSync(".env")) dotenv.config({ path: ".env", quiet: true });

const databaseUrl = process.env.DRIZZLE_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DRIZZLE_DATABASE_URL is not set");
}

// The schema baseline is for a fresh Yandex Managed PostgreSQL database only.
if (/supabase\.(co|com)/.test(databaseUrl)) {
  throw new Error(
    "Refusing to run against Supabase. Set DATABASE_URL (and DRIZZLE_DATABASE_URL, if used) " +
      "in .env.local to the Yandex cluster: postgresql://bizmuzik:…@c-<cluster_id>.rw.mdb.yandexcloud.net:6432/bizmuzik",
  );
}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: stripSslParams(databaseUrl)!,
    ssl: getSsl(databaseUrl),
  },
} satisfies Config;
