-- =============================================================================
-- Sales CRM Migration
-- Creates: cities, business_niches, crm_businesses, leads, 
--          lead_activities, agent_assignments
-- Adds: telegramChatId to referral_agents
-- =============================================================================

-- 1. Add telegramChatId to referral_agents
ALTER TABLE referral_agents ADD COLUMN IF NOT EXISTS "telegramChatId" text;

-- 2. Cities
CREATE TABLE IF NOT EXISTS cities (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  region text,
  "isActive" boolean NOT NULL DEFAULT true
);

INSERT INTO cities (id, name, region) VALUES
  (gen_random_uuid()::text, 'Москва', 'Центральный'),
  (gen_random_uuid()::text, 'Санкт-Петербург', 'Северо-Западный'),
  (gen_random_uuid()::text, 'Краснодар', 'Южный'),
  (gen_random_uuid()::text, 'Екатеринбург', 'Уральский'),
  (gen_random_uuid()::text, 'Новосибирск', 'Сибирский'),
  (gen_random_uuid()::text, 'Казань', 'Приволжский'),
  (gen_random_uuid()::text, 'Ростов-на-Дону', 'Южный'),
  (gen_random_uuid()::text, 'Нижний Новгород', 'Приволжский')
ON CONFLICT DO NOTHING;

-- 3. Business Niches
CREATE TABLE IF NOT EXISTS business_niches (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  icon text
);

INSERT INTO business_niches (id, name, icon) VALUES
  (gen_random_uuid()::text, 'Кафе и кофейни', '☕'),
  (gen_random_uuid()::text, 'Рестораны и бары', '🍽️'),
  (gen_random_uuid()::text, 'Салоны красоты', '💇'),
  (gen_random_uuid()::text, 'Магазины и ритейл', '🛍️'),
  (gen_random_uuid()::text, 'Офисы и коворкинги', '🏢'),
  (gen_random_uuid()::text, 'Фитнес и спорт', '🏋️'),
  (gen_random_uuid()::text, 'Автосалоны', '🚗'),
  (gen_random_uuid()::text, 'Супермаркеты', '🛒'),
  (gen_random_uuid()::text, 'Медицинские клиники', '🏥'),
  (gen_random_uuid()::text, 'Отели и хостелы', '🏨')
ON CONFLICT DO NOTHING;

-- 4. CRM Businesses (cold-call prospects — separate from subscriber businesses)
CREATE TABLE IF NOT EXISTS crm_businesses (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  "cityId" text REFERENCES cities(id),
  "nicheId" text REFERENCES business_niches(id),
  address text,
  phone text,
  website text,
  "contactName" text,
  source text NOT NULL DEFAULT 'manual',
  "isAssigned" boolean NOT NULL DEFAULT false,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_businesses_city_niche_idx ON crm_businesses("cityId", "nicheId");
CREATE INDEX IF NOT EXISTS crm_businesses_is_assigned_idx ON crm_businesses("isAssigned");

-- 5. Leads
CREATE TABLE IF NOT EXISTS leads (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "businessId" text NOT NULL REFERENCES crm_businesses(id) ON DELETE CASCADE,
  "agentId" text NOT NULL REFERENCES referral_agents(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'new' CHECK (status IN (
    'new', 'no_answer', 'in_progress', 'trial_sent', 'converted', 'rejected', 'invalid'
  )),
  priority integer NOT NULL DEFAULT 2 CHECK (priority IN (1, 2, 3)),
  "nextCallbackAt" timestamptz,
  "convertedAt" timestamptz,
  "convertedSubscriptionId" text,
  "callAttempts" integer NOT NULL DEFAULT 0,
  "lastContactedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_agent_status_idx ON leads("agentId", status);
CREATE INDEX IF NOT EXISTS leads_agent_callback_idx ON leads("agentId", "nextCallbackAt");
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);

-- 6. Lead Activities
CREATE TABLE IF NOT EXISTS lead_activities (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "leadId" text NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  "agentId" text NOT NULL REFERENCES referral_agents(id),
  type text NOT NULL CHECK (type IN (
    'call_attempt', 'call_connected', 'status_change',
    'note', 'callback_scheduled', 'trial_sent', 'converted'
  )),
  note text,
  "previousStatus" text,
  "newStatus" text,
  "callbackAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_activities_lead_idx ON lead_activities("leadId");
CREATE INDEX IF NOT EXISTS lead_activities_agent_created_idx ON lead_activities("agentId", "createdAt" DESC);

-- 7. Agent Assignments
CREATE TABLE IF NOT EXISTS agent_assignments (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "agentId" text NOT NULL REFERENCES referral_agents(id) ON DELETE CASCADE,
  "cityId" text REFERENCES cities(id),
  "nicheId" text REFERENCES business_niches(id),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("agentId", "cityId", "nicheId")
);

-- =============================================================================
-- RLS Policies (defense-in-depth — app uses service role, but protects direct access)
-- =============================================================================

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_niches ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_assignments ENABLE ROW LEVEL SECURITY;

-- Cities & niches: readable by all authenticated
CREATE POLICY "cities_read_all" ON cities FOR SELECT TO authenticated USING (true);
CREATE POLICY "niches_read_all" ON business_niches FOR SELECT TO authenticated USING (true);

-- CRM businesses: all authenticated can read, admin inserts handled by service role
CREATE POLICY "crm_businesses_read_all" ON crm_businesses FOR SELECT TO authenticated USING (true);

-- Leads: agents see only their own leads
CREATE POLICY "leads_agent_read_own" ON leads FOR SELECT TO authenticated
  USING ("agentId" IN (
    SELECT id FROM referral_agents WHERE "userId" = auth.uid()::text
  ));

CREATE POLICY "leads_agent_update_own" ON leads FOR UPDATE TO authenticated
  USING ("agentId" IN (
    SELECT id FROM referral_agents WHERE "userId" = auth.uid()::text
  ));

-- Lead activities: agents see only their own
CREATE POLICY "lead_activities_agent_read_own" ON lead_activities FOR SELECT TO authenticated
  USING ("agentId" IN (
    SELECT id FROM referral_agents WHERE "userId" = auth.uid()::text
  ));

CREATE POLICY "lead_activities_agent_insert_own" ON lead_activities FOR INSERT TO authenticated
  WITH CHECK ("agentId" IN (
    SELECT id FROM referral_agents WHERE "userId" = auth.uid()::text
  ));

-- Agent assignments: agents see their own
CREATE POLICY "assignments_agent_read_own" ON agent_assignments FOR SELECT TO authenticated
  USING ("agentId" IN (
    SELECT id FROM referral_agents WHERE "userId" = auth.uid()::text
  ));

-- Admin full access (via users.role = 'ADMIN')
CREATE POLICY "admin_all_cities" ON cities FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'));
CREATE POLICY "admin_all_niches" ON business_niches FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'));
CREATE POLICY "admin_all_crm_businesses" ON crm_businesses FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'));
CREATE POLICY "admin_all_leads" ON leads FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'));
CREATE POLICY "admin_all_lead_activities" ON lead_activities FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'));
CREATE POLICY "admin_all_agent_assignments" ON agent_assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::text AND role = 'ADMIN'));
