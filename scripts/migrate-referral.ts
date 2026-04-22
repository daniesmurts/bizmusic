/**
 * One-time migration script for the referral/affiliate system.
 * Run with:  npx tsx scripts/migrate-referral.ts
 *
 * This bypasses the Supabase SQL editor (which has broken schema-qualifier
 * parsing) and connects directly via the pg driver — the same way the app does.
 */
import { Pool } from "pg";
import * as dotenv from "dotenv";
import * as fs from "fs";

// Load env vars the same way the app does
if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local" });
if (fs.existsSync(".env"))       dotenv.config({ path: ".env" });

const raw = process.env.DATABASE_URL;
if (!raw) throw new Error("DATABASE_URL is not set in .env.local / .env");

// Prefer the direct connection (5432) for DDL; fall back to whatever URL is set
const connectionString = raw.includes(":6543") ? raw.replace(":6543", ":5432") : raw;

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });

// ---------------------------------------------------------------------------
// All DDL statements — split so we can log each one individually
// ---------------------------------------------------------------------------
const steps: Array<{ label: string; sql: string }> = [
  // Must run OUTSIDE a transaction (pg restriction for enum ALTER on used types).
  // Uses a DO block to find the EXACT enum name (case-sensitive) in pg_type,
  // then ALTERs it — handles both "role" (lowercase) and "Role" (capital R).
  {
    label: "ALTER TYPE Role ADD VALUE 'PARTNER'",
    sql: `
      DO $$
      DECLARE
        enum_name text;
      BEGIN
        SELECT typname INTO enum_name
        FROM pg_type
        WHERE typname ILIKE 'role'
          AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

        IF enum_name IS NULL THEN
          RAISE EXCEPTION 'Could not find a "role" enum type in public schema';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = enum_name
            AND t.typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            AND e.enumlabel = 'PARTNER'
        ) THEN
          EXECUTE format('ALTER TYPE public.%I ADD VALUE ''PARTNER''', enum_name);
          RAISE NOTICE 'Added PARTNER to enum %', enum_name;
        ELSE
          RAISE NOTICE 'PARTNER already exists in enum %', enum_name;
        END IF;
      END
      $$
    `,
  },

  {
    label: "CREATE TABLE referral_agents",
    sql: `
      CREATE TABLE IF NOT EXISTS public.referral_agents (
        id               text              PRIMARY KEY NOT NULL,
        "userId"         text              NOT NULL,
        "referralCode"   text              NOT NULL,
        status           text              NOT NULL DEFAULT 'active',
        "commissionRate" double precision  NOT NULL DEFAULT 0.3,
        "fullName"       text,
        phone            text,
        city             text,
        "createdAt"      timestamp         NOT NULL DEFAULT now(),
        "updatedAt"      timestamp         NOT NULL DEFAULT now()
      )`,
  },
  {
    label: "UNIQUE referral_agents.referralCode",
    sql: `ALTER TABLE public.referral_agents
            ADD CONSTRAINT referral_agents_referralCode_unique UNIQUE ("referralCode")`,
  },
  {
    label: "FK referral_agents -> users",
    sql: `ALTER TABLE public.referral_agents
            ADD CONSTRAINT referral_agents_userId_users_id_fk
            FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE`,
  },
  {
    label: "INDEX referral_agents_code_idx",
    sql: `CREATE INDEX IF NOT EXISTS referral_agents_code_idx ON public.referral_agents ("referralCode")`,
  },
  {
    label: "INDEX referral_agents_user_id_idx",
    sql: `CREATE INDEX IF NOT EXISTS referral_agents_user_id_idx ON public.referral_agents ("userId")`,
  },

  {
    label: "CREATE TABLE referral_clicks",
    sql: `
      CREATE TABLE IF NOT EXISTS public.referral_clicks (
        id                text      PRIMARY KEY NOT NULL,
        "agentId"         text      NOT NULL,
        "referralCode"    text      NOT NULL,
        "ipAddress"       text,
        "userAgent"       text,
        "convertedUserId" text,
        "createdAt"       timestamp NOT NULL DEFAULT now()
      )`,
  },
  {
    label: "FK referral_clicks -> referral_agents",
    sql: `ALTER TABLE public.referral_clicks
            ADD CONSTRAINT referral_clicks_agentId_fk
            FOREIGN KEY ("agentId") REFERENCES public.referral_agents(id) ON DELETE CASCADE`,
  },
  {
    label: "FK referral_clicks -> users (convertedUserId)",
    sql: `ALTER TABLE public.referral_clicks
            ADD CONSTRAINT referral_clicks_convertedUserId_fk
            FOREIGN KEY ("convertedUserId") REFERENCES public.users(id) ON DELETE SET NULL`,
  },
  {
    label: "INDEX referral_clicks_agent_id_idx",
    sql: `CREATE INDEX IF NOT EXISTS referral_clicks_agent_id_idx ON public.referral_clicks ("agentId")`,
  },
  {
    label: "INDEX referral_clicks_converted_user_id_idx",
    sql: `CREATE INDEX IF NOT EXISTS referral_clicks_converted_user_id_idx ON public.referral_clicks ("convertedUserId")`,
  },

  {
    label: "CREATE TABLE referral_conversions",
    sql: `
      CREATE TABLE IF NOT EXISTS public.referral_conversions (
        id               text      PRIMARY KEY NOT NULL,
        "agentId"        text      NOT NULL,
        "referredUserId" text      NOT NULL,
        "businessId"     text      NOT NULL,
        status           text      NOT NULL DEFAULT 'trial',
        "firstPaymentAt" timestamp,
        "createdAt"      timestamp NOT NULL DEFAULT now()
      )`,
  },
  {
    label: "UNIQUE referral_conversions.referredUserId",
    sql: `ALTER TABLE public.referral_conversions
            ADD CONSTRAINT referral_conversions_referredUserId_unique UNIQUE ("referredUserId")`,
  },
  {
    label: "FK referral_conversions -> referral_agents",
    sql: `ALTER TABLE public.referral_conversions
            ADD CONSTRAINT referral_conversions_agentId_fk
            FOREIGN KEY ("agentId") REFERENCES public.referral_agents(id) ON DELETE CASCADE`,
  },
  {
    label: "FK referral_conversions -> users",
    sql: `ALTER TABLE public.referral_conversions
            ADD CONSTRAINT referral_conversions_referredUserId_fk
            FOREIGN KEY ("referredUserId") REFERENCES public.users(id) ON DELETE CASCADE`,
  },
  {
    label: "FK referral_conversions -> businesses",
    sql: `ALTER TABLE public.referral_conversions
            ADD CONSTRAINT referral_conversions_businessId_fk
            FOREIGN KEY ("businessId") REFERENCES public.businesses(id) ON DELETE CASCADE`,
  },
  {
    label: "INDEX referral_conversions_agent_id_idx",
    sql: `CREATE INDEX IF NOT EXISTS referral_conversions_agent_id_idx ON public.referral_conversions ("agentId")`,
  },
  {
    label: "INDEX referral_conversions_referred_user_id_idx",
    sql: `CREATE INDEX IF NOT EXISTS referral_conversions_referred_user_id_idx ON public.referral_conversions ("referredUserId")`,
  },

  {
    label: "CREATE TABLE commission_ledger",
    sql: `
      CREATE TABLE IF NOT EXISTS public.commission_ledger (
        id                          text      PRIMARY KEY NOT NULL,
        "agentId"                   text      NOT NULL,
        "conversionId"              text      NOT NULL,
        "periodMonth"               text      NOT NULL,
        "subscriptionAmountKopecks" integer   NOT NULL,
        "commissionAmountKopecks"   integer   NOT NULL,
        status                      text      NOT NULL DEFAULT 'pending',
        "paidAt"                    timestamp,
        "createdAt"                 timestamp NOT NULL DEFAULT now()
      )`,
  },
  {
    label: "FK commission_ledger -> referral_agents",
    sql: `ALTER TABLE public.commission_ledger
            ADD CONSTRAINT commission_ledger_agentId_fk
            FOREIGN KEY ("agentId") REFERENCES public.referral_agents(id) ON DELETE CASCADE`,
  },
  {
    label: "FK commission_ledger -> referral_conversions",
    sql: `ALTER TABLE public.commission_ledger
            ADD CONSTRAINT commission_ledger_conversionId_fk
            FOREIGN KEY ("conversionId") REFERENCES public.referral_conversions(id) ON DELETE CASCADE`,
  },
  {
    label: "UNIQUE commission_ledger (conversionId, periodMonth)",
    sql: `ALTER TABLE public.commission_ledger
            ADD CONSTRAINT commission_ledger_conversion_period_unique
            UNIQUE ("conversionId", "periodMonth")`,
  },
  {
    label: "INDEX commission_ledger_agent_period_idx",
    sql: `CREATE INDEX IF NOT EXISTS commission_ledger_agent_period_idx ON public.commission_ledger ("agentId", "periodMonth")`,
  },
  {
    label: "INDEX commission_ledger_status_idx",
    sql: `CREATE INDEX IF NOT EXISTS commission_ledger_status_idx ON public.commission_ledger (status)`,
  },

  {
    label: "ALTER users ADD COLUMN referredByAgentId",
    sql: `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "referredByAgentId" text`,
  },
  {
    label: "ALTER users ADD COLUMN referralCodeUsed",
    sql: `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "referralCodeUsed" text`,
  },
  {
    label: "FK users -> referral_agents",
    sql: `ALTER TABLE public.users
            ADD CONSTRAINT users_referredByAgentId_fk
            FOREIGN KEY ("referredByAgentId") REFERENCES public.referral_agents(id) ON DELETE SET NULL`,
  },
  {
    label: "INDEX users_referred_by_agent_id_idx",
    sql: `CREATE INDEX IF NOT EXISTS users_referred_by_agent_id_idx ON public.users ("referredByAgentId")`,
  },

  { label: "RLS referral_agents",      sql: `ALTER TABLE public.referral_agents      ENABLE ROW LEVEL SECURITY` },
  { label: "RLS referral_clicks",      sql: `ALTER TABLE public.referral_clicks      ENABLE ROW LEVEL SECURITY` },
  { label: "RLS referral_conversions", sql: `ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY` },
  { label: "RLS commission_ledger",    sql: `ALTER TABLE public.commission_ledger    ENABLE ROW LEVEL SECURITY` },

  {
    label: "POLICY agents_read_own",
    sql: `CREATE POLICY agents_read_own ON public.referral_agents
            FOR SELECT USING ("userId" = auth.uid()::text)`,
  },
  {
    label: "POLICY admin_full_access_agents",
    sql: `CREATE POLICY admin_full_access_agents ON public.referral_agents
            FOR ALL USING (
              EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'ADMIN')
            )`,
  },
  {
    label: "POLICY agents_read_own_conversions",
    sql: `CREATE POLICY agents_read_own_conversions ON public.referral_conversions
            FOR SELECT USING (
              "agentId" IN (SELECT id FROM public.referral_agents WHERE "userId" = auth.uid()::text)
            )`,
  },
  {
    label: "POLICY admin_full_access_conversions",
    sql: `CREATE POLICY admin_full_access_conversions ON public.referral_conversions
            FOR ALL USING (
              EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'ADMIN')
            )`,
  },
  {
    label: "POLICY agents_read_own_commissions",
    sql: `CREATE POLICY agents_read_own_commissions ON public.commission_ledger
            FOR SELECT USING (
              "agentId" IN (SELECT id FROM public.referral_agents WHERE "userId" = auth.uid()::text)
            )`,
  },
  {
    label: "POLICY admin_full_access_ledger",
    sql: `CREATE POLICY admin_full_access_ledger ON public.commission_ledger
            FOR ALL USING (
              EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'ADMIN')
            )`,
  },
  {
    label: "POLICY admin_full_access_clicks",
    sql: `CREATE POLICY admin_full_access_clicks ON public.referral_clicks
            FOR ALL USING (
              EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'ADMIN')
            )`,
  },
];

// ---------------------------------------------------------------------------
// PostgreSQL error codes we treat as "already done" — safe to skip
// 42710 duplicate_object  (constraint / policy / index already exists)
// 42P07 duplicate_table   (table already exists — shouldn't happen with IF NOT EXISTS, but just in case)
// 42701 duplicate_column  (column already exists — shouldn't happen with IF NOT EXISTS, but just in case)
const SKIP_CODES = new Set(["42710", "42P07", "42701"]);

async function main() {
  const client = await pool.connect();
  console.log("🔌 Connected to database\n");

  let errors = 0;

  try {
    // No single wrapping transaction — previous partial runs already committed
    // some steps, so we run each statement independently and skip duplicates.
    for (const step of steps) {
      process.stdout.write(`  ▸ ${step.label} ... `);
      try {
        await client.query(step.sql);
        console.log("✓");
      } catch (err: any) {
        if (SKIP_CODES.has(err.code)) {
          console.log("⚠  already exists — skipped");
        } else {
          console.error(`\n     ERROR ${err.code}: ${err.message}`);
          errors++;
        }
      }
    }
  } finally {
    client.release();
    await pool.end();
  }

  if (errors > 0) {
    console.error(`\n❌ Migration finished with ${errors} unexpected error(s).`);
    process.exit(1);
  } else {
    console.log("\n✅ Referral system migration complete!");
  }
}

main();
