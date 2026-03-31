import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function runMigration() {
  try {
    console.log("Checking and adding missing columns for tracks table...");

    await db.execute(sql`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS "rightsStatus" text DEFAULT 'Direct Owner';`);
    await db.execute(sql`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS "territoryRestriction" text[];`);
    await db.execute(sql`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS "vocalType" text DEFAULT 'Instrumental';`);
    await db.execute(sql`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS "language" text DEFAULT 'Russian';`);
    await db.execute(sql`ALTER TABLE tracks ADD COLUMN IF NOT EXISTS "timeSuitability" text[];`);

    console.log("Creating wave_settings table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "wave_settings" (
        "id" text PRIMARY KEY NOT NULL,
        "businessId" text NOT NULL UNIQUE REFERENCES "businesses"("id") ON DELETE cascade,
        "energyPreference" integer DEFAULT 5 NOT NULL,
        "vocalPreference" text DEFAULT 'both' NOT NULL,
        "focusProfile" text DEFAULT 'none' NOT NULL,
        "createdAt" timestamp DEFAULT now() NOT NULL,
        "updatedAt" timestamp NOT NULL
      );
    `);

    console.log("Migration executed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
