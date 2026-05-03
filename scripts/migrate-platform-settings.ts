import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as fs from "fs";

if (fs.existsSync(".env")) dotenv.config({ path: ".env" });
if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

// Use session pooler for DDL
const url = databaseUrl.includes(":6543") ? databaseUrl.replace(":6543", ":5432") : databaseUrl;

async function migrate() {
  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log("Creating platform_settings table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "platform_settings" (
        "id" text PRIMARY KEY DEFAULT 'singleton',
        "tierBusinessPrice" integer NOT NULL DEFAULT 149000,
        "tierContentPrice" integer NOT NULL DEFAULT 179000,
        "tierBusinessProPrice" integer NOT NULL DEFAULT 249000,
        "tierBusinessPlusPrice" integer NOT NULL DEFAULT 499000,
        "paymentProcessingFeePercent" double precision NOT NULL DEFAULT 2.5,
        "taxRatePercent" double precision NOT NULL DEFAULT 6.0,
        "ambassadorCommissionPercent" double precision NOT NULL DEFAULT 30.0,
        "minimumPayoutThresholdKopeks" integer NOT NULL DEFAULT 50000,
        "payoutDay" text NOT NULL DEFAULT 'friday',
        "infrastructureCostKopeks" integer NOT NULL DEFAULT 0,
        "updatedAt" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("✅ platform_settings created");

    console.log("Creating platform_settings_audit_log table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "platform_settings_audit_log" (
        "id" text PRIMARY KEY,
        "adminUserId" text REFERENCES "users"("id") ON DELETE SET NULL,
        "field" text NOT NULL,
        "oldValue" text NOT NULL,
        "newValue" text NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL
      );
    `);
    console.log("✅ platform_settings_audit_log created");

    console.log("Creating indexes...");
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "platform_settings_audit_log_admin_user_idx" 
        ON "platform_settings_audit_log" ("adminUserId");
      CREATE INDEX IF NOT EXISTS "platform_settings_audit_log_created_at_idx" 
        ON "platform_settings_audit_log" ("createdAt");
    `);
    console.log("✅ Indexes created");

    // Insert singleton row if it doesn't exist
    console.log("Ensuring singleton settings row...");
    await pool.query(`
      INSERT INTO "platform_settings" ("id") VALUES ('singleton')
      ON CONFLICT ("id") DO NOTHING;
    `);
    console.log("✅ Singleton row ensured");

    console.log("\n🎉 Migration complete!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
