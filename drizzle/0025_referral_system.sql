-- Migration: referral and affiliate tracking system

-- Create referral_agents table
CREATE TABLE IF NOT EXISTS "referral_agents" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"referralCode" text NOT NULL,
	"status" text NOT NULL DEFAULT 'active',
	"commissionRate" double precision NOT NULL DEFAULT 0.3,
	"fullName" text,
	"phone" text,
	"city" text,
	"createdAt" timestamp NOT NULL DEFAULT now(),
	"updatedAt" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "referral_agents" ADD CONSTRAINT "referral_agents_referralCode_unique" UNIQUE("referralCode");
ALTER TABLE "referral_agents" ADD CONSTRAINT "referral_agents_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE cascade;

CREATE INDEX IF NOT EXISTS "referral_agents_code_idx" ON "referral_agents" ("referralCode");
CREATE INDEX IF NOT EXISTS "referral_agents_user_id_idx" ON "referral_agents" ("userId");

-- Create referral_clicks table
CREATE TABLE IF NOT EXISTS "referral_clicks" (
	"id" text PRIMARY KEY NOT NULL,
	"agentId" text NOT NULL,
	"referralCode" text NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"convertedUserId" text,
	"createdAt" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "referral_clicks" ADD CONSTRAINT "referral_clicks_agentId_referral_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "referral_agents"("id") ON DELETE cascade;
ALTER TABLE "referral_clicks" ADD CONSTRAINT "referral_clicks_convertedUserId_users_id_fk" FOREIGN KEY ("convertedUserId") REFERENCES "users"("id") ON DELETE set null;

CREATE INDEX IF NOT EXISTS "referral_clicks_agent_id_idx" ON "referral_clicks" ("agentId");
CREATE INDEX IF NOT EXISTS "referral_clicks_converted_user_id_idx" ON "referral_clicks" ("convertedUserId");

-- Create referral_conversions table
CREATE TABLE IF NOT EXISTS "referral_conversions" (
	"id" text PRIMARY KEY NOT NULL,
	"agentId" text NOT NULL,
	"referredUserId" text NOT NULL,
	"businessId" text NOT NULL,
	"status" text NOT NULL DEFAULT 'trial',
	"firstPaymentAt" timestamp,
	"createdAt" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_referredUserId_unique" UNIQUE("referredUserId");
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_agentId_referral_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "referral_agents"("id") ON DELETE cascade;
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_referredUserId_users_id_fk" FOREIGN KEY ("referredUserId") REFERENCES "users"("id") ON DELETE cascade;
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE cascade;

CREATE INDEX IF NOT EXISTS "referral_conversions_agent_id_idx" ON "referral_conversions" ("agentId");
CREATE INDEX IF NOT EXISTS "referral_conversions_referred_user_id_idx" ON "referral_conversions" ("referredUserId");

-- Create commission_ledger table
CREATE TABLE IF NOT EXISTS "commission_ledger" (
	"id" text PRIMARY KEY NOT NULL,
	"agentId" text NOT NULL,
	"conversionId" text NOT NULL,
	"periodMonth" text NOT NULL,
	"subscriptionAmountKopecks" integer NOT NULL,
	"commissionAmountKopecks" integer NOT NULL,
	"status" text NOT NULL DEFAULT 'pending',
	"paidAt" timestamp,
	"createdAt" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "commission_ledger" ADD CONSTRAINT "commission_ledger_agentId_referral_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "referral_agents"("id") ON DELETE cascade;
ALTER TABLE "commission_ledger" ADD CONSTRAINT "commission_ledger_conversionId_referral_conversions_id_fk" FOREIGN KEY ("conversionId") REFERENCES "referral_conversions"("id") ON DELETE cascade;
ALTER TABLE "commission_ledger" ADD CONSTRAINT "commission_ledger_conversion_period_unique" UNIQUE("conversionId", "periodMonth");

CREATE INDEX IF NOT EXISTS "commission_ledger_agent_period_idx" ON "commission_ledger" ("agentId", "periodMonth");
CREATE INDEX IF NOT EXISTS "commission_ledger_status_idx" ON "commission_ledger" ("status");

-- Extend users table with referral tracking columns
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referredByAgentId" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referralCodeUsed" text;
ALTER TABLE "users" ADD CONSTRAINT "users_referredByAgentId_referral_agents_id_fk" FOREIGN KEY ("referredByAgentId") REFERENCES "referral_agents"("id") ON DELETE set null;
CREATE INDEX IF NOT EXISTS "users_referred_by_agent_id_idx" ON "users" ("referredByAgentId");

-- Enable Row Level Security on new tables
ALTER TABLE "referral_agents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "referral_clicks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "referral_conversions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "commission_ledger" ENABLE ROW LEVEL SECURITY;

-- RLS: referral_agents — agents see only their own row; admins see all
CREATE POLICY "agents_read_own" ON "referral_agents"
  FOR SELECT USING ("userId" = auth.uid()::text);
CREATE POLICY "admin_full_access_agents" ON "referral_agents"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "users" WHERE "id" = auth.uid()::text AND "role" = 'ADMIN')
  );

-- RLS: referral_conversions — agents see their own conversions; admins see all
CREATE POLICY "agents_read_own_conversions" ON "referral_conversions"
  FOR SELECT USING (
    "agentId" IN (SELECT "id" FROM "referral_agents" WHERE "userId" = auth.uid()::text)
  );
CREATE POLICY "admin_full_access_conversions" ON "referral_conversions"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "users" WHERE "id" = auth.uid()::text AND "role" = 'ADMIN')
  );

-- RLS: commission_ledger — agents see their own commissions; admins see all
CREATE POLICY "agents_read_own_commissions" ON "commission_ledger"
  FOR SELECT USING (
    "agentId" IN (SELECT "id" FROM "referral_agents" WHERE "userId" = auth.uid()::text)
  );
CREATE POLICY "admin_full_access_ledger" ON "commission_ledger"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "users" WHERE "id" = auth.uid()::text AND "role" = 'ADMIN')
  );

-- RLS: referral_clicks — admins only (agents don't need raw click data)
CREATE POLICY "admin_full_access_clicks" ON "referral_clicks"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "users" WHERE "id" = auth.uid()::text AND "role" = 'ADMIN')
  );
