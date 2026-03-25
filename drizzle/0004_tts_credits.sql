ALTER TABLE "businesses" ADD COLUMN "ttsMonthlyUsed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "ttsMonthlyPeriodStart" timestamp;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "ttsMonthlyPeriodEnd" timestamp;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "paymentType" text DEFAULT 'subscription' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint

CREATE TABLE "tts_credit_lots" (
  "id" text PRIMARY KEY NOT NULL,
  "businessId" text NOT NULL,
  "creditsTotal" integer NOT NULL,
  "creditsRemaining" integer NOT NULL,
  "purchasedAt" timestamp DEFAULT now() NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "paymentId" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp NOT NULL
);
--> statement-breakpoint

CREATE TABLE "tts_usage_events" (
  "id" text PRIMARY KEY NOT NULL,
  "businessId" text NOT NULL,
  "announcementId" text,
  "provider" text NOT NULL,
  "sourceType" text NOT NULL,
  "consumedCredits" integer DEFAULT 1 NOT NULL,
  "charsCount" integer NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "tts_credit_lots" ADD CONSTRAINT "tts_credit_lots_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tts_credit_lots" ADD CONSTRAINT "tts_credit_lots_paymentId_payments_id_fk" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tts_usage_events" ADD CONSTRAINT "tts_usage_events_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tts_usage_events" ADD CONSTRAINT "tts_usage_events_announcementId_voice_announcements_id_fk" FOREIGN KEY ("announcementId") REFERENCES "public"."voice_announcements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE UNIQUE INDEX "tts_credit_lots_payment_unique" ON "tts_credit_lots" ("paymentId");--> statement-breakpoint
CREATE INDEX "tts_credit_lots_business_expiry_idx" ON "tts_credit_lots" ("businessId", "expiresAt");--> statement-breakpoint
CREATE INDEX "tts_usage_events_business_created_idx" ON "tts_usage_events" ("businessId", "createdAt");