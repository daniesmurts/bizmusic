CREATE TYPE "public"."platform_announcement_access" AS ENUM('FREE', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."platform_announcement_source" AS ENUM('UPLOAD', 'TTS');--> statement-breakpoint
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
ALTER TABLE "voice_announcements" ADD COLUMN "platformAnnouncementId" text;--> statement-breakpoint
CREATE TABLE "business_announcement_acquisitions" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"platformAnnouncementId" text NOT NULL,
	"paymentId" text,
	"importedAnnouncementId" text,
	"pricePaidKopeks" integer DEFAULT 0 NOT NULL,
	"claimedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "business_announcement_acquisition_unique" UNIQUE("businessId","platformAnnouncementId"),
	CONSTRAINT "business_announcement_acquisition_payment_unique" UNIQUE("paymentId")
);
--> statement-breakpoint
ALTER TABLE "platform_announcement_products" ADD CONSTRAINT "platform_announcement_products_trackId_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_announcement_products" ADD CONSTRAINT "platform_announcement_products_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_announcements" ADD CONSTRAINT "voice_announcements_platformAnnouncementId_platform_announcement_products_id_fk" FOREIGN KEY ("platformAnnouncementId") REFERENCES "public"."platform_announcement_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_announcement_acquisitions" ADD CONSTRAINT "business_announcement_acquisitions_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_announcement_acquisitions" ADD CONSTRAINT "business_announcement_acquisitions_platformAnnouncementId_platform_announcement_products_id_fk" FOREIGN KEY ("platformAnnouncementId") REFERENCES "public"."platform_announcement_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_announcement_acquisitions" ADD CONSTRAINT "business_announcement_acquisitions_paymentId_payments_id_fk" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_announcement_acquisitions" ADD CONSTRAINT "business_announcement_acquisitions_importedAnnouncementId_voice_announcements_id_fk" FOREIGN KEY ("importedAnnouncementId") REFERENCES "public"."voice_announcements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "platform_announcement_featured_published_idx" ON "platform_announcement_products" USING btree ("isFeatured","isPublished","sortOrder");--> statement-breakpoint
CREATE INDEX "platform_announcement_access_model_idx" ON "platform_announcement_products" USING btree ("accessModel");--> statement-breakpoint
CREATE INDEX "business_announcement_acquisition_business_claimed_idx" ON "business_announcement_acquisitions" USING btree ("businessId","claimedAt");--> statement-breakpoint