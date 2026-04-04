ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "brandVoiceMonthlyUsed" integer DEFAULT 0 NOT NULL;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "brandVoiceMonthlyPeriodStart" timestamp;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "brandVoiceMonthlyPeriodEnd" timestamp;

CREATE TABLE IF NOT EXISTS "voice_actors" (
  "id" text PRIMARY KEY NOT NULL,
  "businessId" text NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
  "fullName" text NOT NULL,
  "email" text NOT NULL,
  "phone" text,
  "role" text DEFAULT 'employee' NOT NULL,
  "consentDocumentUrl" text,
  "consentVersion" text,
  "consentAcceptedAt" timestamp,
  "consentIpAddress" text,
  "consentUserAgent" text,
  "consentRevokedAt" timestamp,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS "voice_actors_business_email_idx" ON "voice_actors" ("businessId", "email");

CREATE TABLE IF NOT EXISTS "brand_voice_models" (
  "id" text PRIMARY KEY NOT NULL,
  "businessId" text NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
  "actorId" text NOT NULL REFERENCES "voice_actors"("id") ON DELETE RESTRICT,
  "status" text DEFAULT 'PENDING' NOT NULL,
  "provider" text DEFAULT 'external' NOT NULL,
  "providerModelId" text,
  "providerJobId" text,
  "subscriptionTier" text,
  "setupPaymentId" text REFERENCES "payments"("id") ON DELETE SET NULL,
  "monthlyCharsLimit" integer DEFAULT 0 NOT NULL,
  "monthlyCharsUsed" integer DEFAULT 0 NOT NULL,
  "monthlyPeriodStart" timestamp,
  "monthlyPeriodEnd" timestamp,
  "samplesRequiredMinutes" integer DEFAULT 10 NOT NULL,
  "samplesUploadedSeconds" integer DEFAULT 0 NOT NULL,
  "qualityScore" integer,
  "consentCheckedAt" timestamp,
  "trainingStartedAt" timestamp,
  "trainingCompletedAt" timestamp,
  "estimatedCompletionAt" timestamp,
  "errorMessage" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS "brand_voice_models_business_status_idx" ON "brand_voice_models" ("businessId", "status");
CREATE INDEX IF NOT EXISTS "brand_voice_models_actor_idx" ON "brand_voice_models" ("actorId");
CREATE UNIQUE INDEX IF NOT EXISTS "brand_voice_models_provider_model_unique" ON "brand_voice_models" ("provider", "providerModelId");

CREATE TABLE IF NOT EXISTS "voice_samples" (
  "id" text PRIMARY KEY NOT NULL,
  "actorId" text NOT NULL REFERENCES "voice_actors"("id") ON DELETE CASCADE,
  "modelId" text REFERENCES "brand_voice_models"("id") ON DELETE SET NULL,
  "fileUrl" text NOT NULL,
  "fileName" text NOT NULL,
  "fileSizeBytes" integer,
  "mimeType" text,
  "durationSeconds" integer,
  "transcript" text,
  "approvalStatus" text DEFAULT 'PENDING' NOT NULL,
  "approvalReason" text,
  "approvedAt" timestamp,
  "uploadedAt" timestamp DEFAULT now() NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "voice_samples_actor_approval_idx" ON "voice_samples" ("actorId", "approvalStatus");
CREATE INDEX IF NOT EXISTS "voice_samples_model_uploaded_idx" ON "voice_samples" ("modelId", "uploadedAt");

ALTER TABLE "voice_announcements" ADD COLUMN IF NOT EXISTS "brandVoiceModelId" text;
DO $$ BEGIN
  ALTER TABLE "voice_announcements"
    ADD CONSTRAINT "voice_announcements_brandVoiceModelId_brand_voice_models_id_fk"
    FOREIGN KEY ("brandVoiceModelId") REFERENCES "brand_voice_models"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "brand_voice_usage_events" (
  "id" text PRIMARY KEY NOT NULL,
  "businessId" text NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
  "modelId" text NOT NULL REFERENCES "brand_voice_models"("id") ON DELETE CASCADE,
  "announcementId" text REFERENCES "voice_announcements"("id") ON DELETE SET NULL,
  "provider" text NOT NULL,
  "charsCount" integer NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "brand_voice_usage_events_business_created_idx" ON "brand_voice_usage_events" ("businessId", "createdAt");
CREATE INDEX IF NOT EXISTS "brand_voice_usage_events_model_created_idx" ON "brand_voice_usage_events" ("modelId", "createdAt");
