import { db } from "../src/db/index";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Running manual migration...");
  try {
    // referral_agents
    await db.execute(sql`ALTER TABLE referral_agents ADD COLUMN IF NOT EXISTS "emailAlias" text UNIQUE`);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "referral_agents_email_alias_idx" ON "referral_agents" USING btree ("emailAlias")`);

    // leads
    await db.execute(sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS "unreadEmailCount" integer DEFAULT 0 NOT NULL`);
    await db.execute(sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS "lastEmailAt" timestamp`);

    // lead_activities
    await db.execute(sql`ALTER TABLE lead_activities ADD COLUMN IF NOT EXISTS "emailSubject" text`);
    await db.execute(sql`ALTER TABLE lead_activities ADD COLUMN IF NOT EXISTS "emailBodyText" text`);
    await db.execute(sql`ALTER TABLE lead_activities ADD COLUMN IF NOT EXISTS "emailFrom" text`);
    await db.execute(sql`ALTER TABLE lead_activities ADD COLUMN IF NOT EXISTS "emailTo" text`);
    await db.execute(sql`ALTER TABLE lead_activities ADD COLUMN IF NOT EXISTS "emailMessageId" text`);
    await db.execute(sql`ALTER TABLE lead_activities ADD COLUMN IF NOT EXISTS "isRead" boolean DEFAULT true NOT NULL`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "lead_activities_is_read_idx" ON "lead_activities" USING btree ("isRead")`);

    console.log("Migration finished successfully!");
  } catch (error) {
    console.error("Migration error:", error);
  }
  process.exit(0);
}

run();
