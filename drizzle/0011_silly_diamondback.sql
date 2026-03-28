CREATE TYPE "public"."document_status" AS ENUM('GENERATING', 'READY', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."platform_announcement_access" AS ENUM('FREE', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."platform_announcement_source" AS ENUM('UPLOAD', 'TTS');--> statement-breakpoint
CREATE TYPE "public"."track_reaction_type" AS ENUM('LIKE', 'DISLIKE');--> statement-breakpoint
CREATE TABLE "ai_usage_events" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"provider" text NOT NULL,
	"sourceType" text NOT NULL,
	"charsCount" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_announcement_acquisitions" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"platformAnnouncementId" text NOT NULL,
	"paymentId" text,
	"importedAnnouncementId" text,
	"pricePaidKopeks" integer DEFAULT 0 NOT NULL,
	"claimedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_acceptance_events" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"acceptedAt" timestamp DEFAULT now() NOT NULL,
	"source" text DEFAULT 'unknown' NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"termsVersion" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_announcement_products" (
	"id" text PRIMARY KEY NOT NULL,
	"trackId" text NOT NULL,
	"createdByUserId" text,
	"description" text,
	"transcript" text,
	"languageCode" text DEFAULT 'ru-RU' NOT NULL,
	"provider" text DEFAULT 'uploaded' NOT NULL,
	"voiceName" text DEFAULT 'uploaded' NOT NULL,
	"speakingRate" double precision DEFAULT 1 NOT NULL,
	"pitch" double precision DEFAULT 0 NOT NULL,
	"accessModel" "platform_announcement_access" DEFAULT 'FREE' NOT NULL,
	"priceKopeks" integer DEFAULT 0 NOT NULL,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"isPublished" boolean DEFAULT true NOT NULL,
	"sourceType" "platform_announcement_source" NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "platform_announcement_products_trackId_unique" UNIQUE("trackId")
);
--> statement-breakpoint
CREATE TABLE "track_reactions" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"trackId" text NOT NULL,
	"reactionType" "track_reaction_type" NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "track_skips" (
	"id" serial PRIMARY KEY NOT NULL,
	"trackId" text NOT NULL,
	"userId" text,
	"businessId" text,
	"locationId" text,
	"skippedAt" timestamp DEFAULT now() NOT NULL,
	"playedAt" timestamp,
	"device" varchar(64),
	"reason" varchar(128)
);
--> statement-breakpoint
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
ALTER TABLE "users" ALTER COLUMN "passwordHash" SET DEFAULT 'SUPABASE_AUTH';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "ttsMonthlyUsed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "ttsMonthlyPeriodStart" timestamp;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "ttsMonthlyPeriodEnd" timestamp;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "aiMonthlyUsed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "aiMonthlyPeriodStart" timestamp;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "aiMonthlyPeriodEnd" timestamp;--> statement-breakpoint
ALTER TABLE "licenses" ADD COLUMN "documentStatus" "document_status" DEFAULT 'READY' NOT NULL;--> statement-breakpoint
ALTER TABLE "licenses" ADD COLUMN "generationError" text;--> statement-breakpoint
ALTER TABLE "licenses" ADD COLUMN "agreementAcceptedAt" timestamp;--> statement-breakpoint
ALTER TABLE "licenses" ADD COLUMN "agreementAcceptedIp" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "paymentType" text DEFAULT 'subscription' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "voice_announcements" ADD COLUMN "platformAnnouncementId" text;--> statement-breakpoint
ALTER TABLE "voice_announcements" ADD COLUMN "provider" text DEFAULT 'google' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_announcement_acquisitions" ADD CONSTRAINT "business_announcement_acquisitions_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_announcement_acquisitions" ADD CONSTRAINT "business_announcement_acquisitions_platformAnnouncementId_platform_announcement_products_id_fk" FOREIGN KEY ("platformAnnouncementId") REFERENCES "public"."platform_announcement_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_announcement_acquisitions" ADD CONSTRAINT "business_announcement_acquisitions_paymentId_payments_id_fk" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_announcement_acquisitions" ADD CONSTRAINT "business_announcement_acquisitions_importedAnnouncementId_voice_announcements_id_fk" FOREIGN KEY ("importedAnnouncementId") REFERENCES "public"."voice_announcements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_acceptance_events" ADD CONSTRAINT "legal_acceptance_events_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_announcement_products" ADD CONSTRAINT "platform_announcement_products_trackId_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_announcement_products" ADD CONSTRAINT "platform_announcement_products_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_reactions" ADD CONSTRAINT "track_reactions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_reactions" ADD CONSTRAINT "track_reactions_trackId_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_skips" ADD CONSTRAINT "track_skips_trackId_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_skips" ADD CONSTRAINT "track_skips_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_skips" ADD CONSTRAINT "track_skips_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_skips" ADD CONSTRAINT "track_skips_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tts_credit_lots" ADD CONSTRAINT "tts_credit_lots_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tts_credit_lots" ADD CONSTRAINT "tts_credit_lots_paymentId_payments_id_fk" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tts_usage_events" ADD CONSTRAINT "tts_usage_events_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tts_usage_events" ADD CONSTRAINT "tts_usage_events_announcementId_voice_announcements_id_fk" FOREIGN KEY ("announcementId") REFERENCES "public"."voice_announcements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_usage_events_business_created_idx" ON "ai_usage_events" USING btree ("businessId","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "business_announcement_acquisition_unique" ON "business_announcement_acquisitions" USING btree ("businessId","platformAnnouncementId");--> statement-breakpoint
CREATE UNIQUE INDEX "business_announcement_acquisition_payment_unique" ON "business_announcement_acquisitions" USING btree ("paymentId");--> statement-breakpoint
CREATE INDEX "business_announcement_acquisition_business_claimed_idx" ON "business_announcement_acquisitions" USING btree ("businessId","claimedAt");--> statement-breakpoint
CREATE INDEX "platform_announcement_featured_published_idx" ON "platform_announcement_products" USING btree ("isFeatured","isPublished","sortOrder");--> statement-breakpoint
CREATE INDEX "platform_announcement_access_model_idx" ON "platform_announcement_products" USING btree ("accessModel");--> statement-breakpoint
CREATE UNIQUE INDEX "track_reactions_user_track_unique" ON "track_reactions" USING btree ("userId","trackId");--> statement-breakpoint
CREATE INDEX "track_reactions_track_type_idx" ON "track_reactions" USING btree ("trackId","reactionType");--> statement-breakpoint
CREATE INDEX "track_reactions_created_at_idx" ON "track_reactions" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_track_skips_skipped_at" ON "track_skips" USING btree ("skippedAt");--> statement-breakpoint
CREATE INDEX "idx_track_skips_track_id" ON "track_skips" USING btree ("trackId");--> statement-breakpoint
CREATE INDEX "idx_track_skips_business_id" ON "track_skips" USING btree ("businessId");--> statement-breakpoint
CREATE INDEX "idx_track_skips_location_id" ON "track_skips" USING btree ("locationId");--> statement-breakpoint
CREATE INDEX "tts_credit_lots_business_expiry_idx" ON "tts_credit_lots" USING btree ("businessId","expiresAt");--> statement-breakpoint
CREATE UNIQUE INDEX "tts_credit_lots_payment_unique" ON "tts_credit_lots" USING btree ("paymentId");--> statement-breakpoint
CREATE INDEX "tts_usage_events_business_created_idx" ON "tts_usage_events" USING btree ("businessId","createdAt");--> statement-breakpoint
ALTER TABLE "voice_announcements" ADD CONSTRAINT "voice_announcements_platformAnnouncementId_platform_announcement_products_id_fk" FOREIGN KEY ("platformAnnouncementId") REFERENCES "public"."platform_announcement_products"("id") ON DELETE set null ON UPDATE no action;