import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { YANDEX_ROOT_CA } from "./src/db/yandex-ca";

// Load both .env and .env.local if they exist
if (fs.existsSync(".env")) dotenv.config({ path: ".env" });
if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.DRIZZLE_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DRIZZLE_DATABASE_URL is not set");
}

const isYandex = databaseUrl.includes("yandexcloud.net");

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Supabase: force the transaction pooler. YC and others: use the URL as-is.
    url: databaseUrl.includes("supabase.co") && databaseUrl.includes(":5432")
      ? databaseUrl.replace(":5432", ":6543")
      : databaseUrl,
    // YC Managed PostgreSQL: verify against the Yandex root CA.
    ssl: isYandex
      ? { ca: YANDEX_ROOT_CA, rejectUnauthorized: true }
      : process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: true }
        : { rejectUnauthorized: false },
  },
} satisfies Config;
