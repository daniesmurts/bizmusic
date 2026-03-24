import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
import * as fs from "fs";

// Load both .env and .env.local if they exist
if (fs.existsSync(".env")) dotenv.config({ path: ".env" });
if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.DRIZZLE_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL or DRIZZLE_DATABASE_URL is not set");
}

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl.includes("supabase.co") && databaseUrl.includes(":5432") 
      ? databaseUrl.replace(":5432", ":6543") 
      : databaseUrl,
    ssl: { rejectUnauthorized: false },
  },
} satisfies Config;
