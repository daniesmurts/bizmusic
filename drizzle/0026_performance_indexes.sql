-- Performance indexes for billing cron and common lookups
-- businesses: queried by userId in most actions; by status+expiresAt in billing cron
CREATE INDEX IF NOT EXISTS "businesses_user_id_idx" ON "businesses" ("userId");
CREATE INDEX IF NOT EXISTS "businesses_subscription_status_idx" ON "businesses" ("subscriptionStatus");
CREATE INDEX IF NOT EXISTS "businesses_subscription_expires_at_idx" ON "businesses" ("subscriptionExpiresAt");

-- locations: always filtered by businessId
CREATE INDEX IF NOT EXISTS "locations_business_id_idx" ON "locations" ("businessId");

-- payments: billing cron counts recent failures per business ordered by createdAt
CREATE INDEX IF NOT EXISTS "payments_business_id_created_at_idx" ON "payments" ("businessId", "createdAt");
