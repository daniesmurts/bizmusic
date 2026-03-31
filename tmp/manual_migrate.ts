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

    console.log("Migration executed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
