import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { getSsl, stripSslParams } from "./src/db/ssl";

// drizzle-kit loads .env by itself before this file runs, so .env.local must
// override to take precedence (same order as Next.js).
if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local", override: true, quiet: true });
if (fs.existsSync(".env")) dotenv.config({ path: ".env", quiet: true });

// Yandex Managed PostgreSQL has a single port (6432), so migrations use the app's DATABASE_URL.
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

// The schema baseline is for a fresh Yandex Managed PostgreSQL database only.
if (/supabase\.(co|com)/.test(databaseUrl)) {
  throw new Error(
    "Refusing to run against Supabase. Set DATABASE_URL in .env.local to the Yandex cluster: postgresql://bizmuzik:…@c-<cluster_id>.rw.mdb.yandexcloud.net:6432/bizmuzik",
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
