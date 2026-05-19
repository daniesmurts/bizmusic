/**
 * One-time script: bulk-create existing DB users in Clerk.
 *
 * Run from project root:
 *   npx tsx scripts/migrate-users-to-clerk.ts
 *
 * What it does:
 * - Reads all users from the DB that are not yet linked to Clerk (clerkId IS NULL)
 * - Creates a Clerk account for each one using their email + role
 * - Does NOT set a password — users reset via /forgot-password on first login
 */

import * as fs from "fs";
import * as dotenv from "dotenv";
import { randomBytes } from "crypto";
import { Pool } from "pg";
import { createClerkClient } from "@clerk/backend";

if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local" });
if (fs.existsSync(".env")) dotenv.config({ path: ".env" });

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

const raw = process.env.DATABASE_URL ?? process.env.DRIZZLE_DATABASE_URL;
if (!raw) throw new Error("DRIZZLE_DATABASE_URL or DATABASE_URL is not set");

const pool = new Pool({ connectionString: raw });

async function main() {
  const { rows: unlinked } = await pool.query<{ id: string; email: string; role: string }>(
    `SELECT id, email, role FROM users WHERE "clerkId" IS NULL ORDER BY "createdAt" ASC`
  );

  console.log(`Found ${unlinked.length} users to migrate.\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of unlinked) {
    try {
      const existing = await clerk.users.getUserList({ emailAddress: [user.email] });

      if (existing.totalCount > 0) {
        console.log(`⏭  ${user.email} — already in Clerk`);
        skipped++;
        continue;
      }

      await clerk.users.createUser({
        emailAddress: [user.email],
        password: randomBytes(32).toString("hex"), // random — user resets via forgot-password
        skipPasswordChecks: true,
        publicMetadata: { role: user.role },
      });

      console.log(`✅  ${user.email} (${user.role})`);
      created++;

      // Avoid Clerk rate limits
      await new Promise((r) => setTimeout(r, 250));
    } catch (err) {
      console.error(`❌  ${user.email}`, JSON.stringify(err, null, 2));
      failed++;
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}, Failed: ${failed}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
