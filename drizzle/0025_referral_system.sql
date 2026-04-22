-- Migration: referral and affiliate tracking system
-- Uses unquoted dot-notation (public.table) throughout — the only form that
-- survives Supabase SQL editor's restricted search_path without being mangled.

-- ── referral_agents ──────────────────────────────────────────────────────────
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
);

ALTER TABLE public.referral_agents
  ADD CONSTRAINT referral_agents_referralCode_unique UNIQUE ("referralCode");
ALTER TABLE public.referral_agents
  ADD CONSTRAINT referral_agents_userId_users_id_fk
  FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS referral_agents_code_idx    ON public.referral_agents ("referralCode");
CREATE INDEX IF NOT EXISTS referral_agents_user_id_idx ON public.referral_agents ("userId");

-- ── referral_clicks ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id                text      PRIMARY KEY NOT NULL,
  "agentId"         text      NOT NULL,
  "referralCode"    text      NOT NULL,
  "ipAddress"       text,
  "userAgent"       text,
  "convertedUserId" text,
  "createdAt"       timestamp NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_clicks
  ADD CONSTRAINT referral_clicks_agentId_fk
  FOREIGN KEY ("agentId") REFERENCES public.referral_agents(id) ON DELETE CASCADE;
ALTER TABLE public.referral_clicks
  ADD CONSTRAINT referral_clicks_convertedUserId_fk
  FOREIGN KEY ("convertedUserId") REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS referral_clicks_agent_id_idx          ON public.referral_clicks ("agentId");
CREATE INDEX IF NOT EXISTS referral_clicks_converted_user_id_idx ON public.referral_clicks ("convertedUserId");

-- ── referral_conversions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referral_conversions (
  id               text      PRIMARY KEY NOT NULL,
  "agentId"        text      NOT NULL,
  "referredUserId" text      NOT NULL,
  "businessId"     text      NOT NULL,
  status           text      NOT NULL DEFAULT 'trial',
  "firstPaymentAt" timestamp,
  "createdAt"      timestamp NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_conversions
  ADD CONSTRAINT referral_conversions_referredUserId_unique UNIQUE ("referredUserId");
ALTER TABLE public.referral_conversions
  ADD CONSTRAINT referral_conversions_agentId_fk
  FOREIGN KEY ("agentId") REFERENCES public.referral_agents(id) ON DELETE CASCADE;
ALTER TABLE public.referral_conversions
  ADD CONSTRAINT referral_conversions_referredUserId_fk
  FOREIGN KEY ("referredUserId") REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE public.referral_conversions
  ADD CONSTRAINT referral_conversions_businessId_fk
  FOREIGN KEY ("businessId") REFERENCES public.businesses(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS referral_conversions_agent_id_idx         ON public.referral_conversions ("agentId");
CREATE INDEX IF NOT EXISTS referral_conversions_referred_user_id_idx ON public.referral_conversions ("referredUserId");

-- ── commission_ledger ─────────────────────────────────────────────────────────
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
);

ALTER TABLE public.commission_ledger
  ADD CONSTRAINT commission_ledger_agentId_fk
  FOREIGN KEY ("agentId") REFERENCES public.referral_agents(id) ON DELETE CASCADE;
ALTER TABLE public.commission_ledger
  ADD CONSTRAINT commission_ledger_conversionId_fk
  FOREIGN KEY ("conversionId") REFERENCES public.referral_conversions(id) ON DELETE CASCADE;
ALTER TABLE public.commission_ledger
  ADD CONSTRAINT commission_ledger_conversion_period_unique
  UNIQUE ("conversionId", "periodMonth");

CREATE INDEX IF NOT EXISTS commission_ledger_agent_period_idx ON public.commission_ledger ("agentId", "periodMonth");
CREATE INDEX IF NOT EXISTS commission_ledger_status_idx        ON public.commission_ledger (status);

-- ── Extend users table ────────────────────────────────────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "referredByAgentId" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "referralCodeUsed"  text;
ALTER TABLE public.users
  ADD CONSTRAINT users_referredByAgentId_fk
  FOREIGN KEY ("referredByAgentId") REFERENCES public.referral_agents(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS users_referred_by_agent_id_idx ON public.users ("referredByAgentId");

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE public.referral_agents      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_clicks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_ledger    ENABLE ROW LEVEL SECURITY;

-- referral_agents
CREATE POLICY agents_read_own ON public.referral_agents
  FOR SELECT USING ("userId" = auth.uid()::text);

CREATE POLICY admin_full_access_agents ON public.referral_agents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- referral_conversions
CREATE POLICY agents_read_own_conversions ON public.referral_conversions
  FOR SELECT USING (
    "agentId" IN (
      SELECT id FROM public.referral_agents
      WHERE "userId" = auth.uid()::text
    )
  );

CREATE POLICY admin_full_access_conversions ON public.referral_conversions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- commission_ledger
CREATE POLICY agents_read_own_commissions ON public.commission_ledger
  FOR SELECT USING (
    "agentId" IN (
      SELECT id FROM public.referral_agents
      WHERE "userId" = auth.uid()::text
    )
  );

CREATE POLICY admin_full_access_ledger ON public.commission_ledger
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()::text AND role = 'ADMIN'
    )
  );

-- referral_clicks
CREATE POLICY admin_full_access_clicks ON public.referral_clicks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()::text AND role = 'ADMIN'
    )
  );
