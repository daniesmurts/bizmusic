CREATE TYPE "public"."billing_interval" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'BUSINESS_OWNER', 'STAFF');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('INACTIVE', 'ACTIVE', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('BUSINESS', 'CREATOR');--> statement-breakpoint
CREATE TABLE "albums" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"coverUrl" text,
	"description" text,
	"releaseDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "blog_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "blog_post_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"postId" text NOT NULL,
	"tagName" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"categoryId" text NOT NULL,
	"authorId" text NOT NULL,
	"imageUrl" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"publishedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"inn" text NOT NULL,
	"ogrn" text,
	"kpp" text,
	"legalName" text NOT NULL,
	"address" text NOT NULL,
	"phone" text,
	"contactPerson" text,
	"businessType" text,
	"businessCategory" text,
	"bankName" text,
	"bik" text,
	"settlementAccount" text,
	"corrAccount" text,
	"subscriptionStatus" "subscription_status" DEFAULT 'INACTIVE' NOT NULL,
	"subscriptionExpiresAt" timestamp,
	"trialEndsAt" timestamp,
	"rebillId" text,
	"cardMask" text,
	"cardExpiry" text,
	"currentPlanSlug" text,
	"billingInterval" "billing_interval" DEFAULT 'monthly' NOT NULL,
	"cancelAtPeriodEnd" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "businesses_inn_unique" UNIQUE("inn")
);
--> statement-breakpoint
CREATE TABLE "licenses" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"licenseNumber" text NOT NULL,
	"signingName" text NOT NULL,
	"issuedAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"validFrom" timestamp NOT NULL,
	"validTo" timestamp NOT NULL,
	"totalCost" double precision DEFAULT 0 NOT NULL,
	"pdfUrl" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "licenses_licenseNumber_unique" UNIQUE("licenseNumber")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"deviceId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "locations_deviceId_unique" UNIQUE("deviceId")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"amount" integer NOT NULL,
	"status" text NOT NULL,
	"tbankPaymentId" text,
	"orderId" text NOT NULL,
	"recurrent" boolean DEFAULT false NOT NULL,
	"rebillId" text,
	"errorCode" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "payments_tbankPaymentId_unique" UNIQUE("tbankPaymentId"),
	CONSTRAINT "payments_orderId_unique" UNIQUE("orderId")
);
--> statement-breakpoint
CREATE TABLE "play_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"locationId" text,
	"businessId" text,
	"trackId" text NOT NULL,
	"playedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playlist_tracks" (
	"id" text PRIMARY KEY NOT NULL,
	"playlistId" text NOT NULL,
	"trackId" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "playlists" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text,
	"name" text NOT NULL,
	"scheduleConfig" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracks" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"fileUrl" text NOT NULL,
	"duration" integer NOT NULL,
	"bpm" integer,
	"genre" text DEFAULT 'Unknown',
	"moodTags" text[] NOT NULL,
	"isExplicit" boolean DEFAULT false NOT NULL,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"energyLevel" integer,
	"downloadsCount" integer DEFAULT 0 NOT NULL,
	"sharesCount" integer DEFAULT 0 NOT NULL,
	"albumId" text,
	"trackNumber" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"passwordHash" text NOT NULL,
	"role" "role" DEFAULT 'BUSINESS_OWNER' NOT NULL,
	"userType" "user_type" DEFAULT 'BUSINESS' NOT NULL,
	"phone" text,
	"termsAccepted" boolean DEFAULT false NOT NULL,
	"termsAcceptedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_postId_blog_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_categoryId_blog_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."blog_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_logs" ADD CONSTRAINT "play_logs_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_logs" ADD CONSTRAINT "play_logs_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_logs" ADD CONSTRAINT "play_logs_trackId_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_playlistId_playlists_id_fk" FOREIGN KEY ("playlistId") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_trackId_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_albumId_albums_id_fk" FOREIGN KEY ("albumId") REFERENCES "public"."albums"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_post_tags_post_idx" ON "blog_post_tags" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "blog_post_tags_tag_idx" ON "blog_post_tags" USING btree ("tagName");--> statement-breakpoint
CREATE INDEX "blog_post_slug_idx" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_post_category_idx" ON "blog_posts" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "blog_post_published_idx" ON "blog_posts" USING btree ("published");--> statement-breakpoint
CREATE UNIQUE INDEX "playlist_track_unique" ON "playlist_tracks" USING btree ("playlistId","trackId");--> statement-breakpoint
CREATE INDEX "playlist_position_idx" ON "playlist_tracks" USING btree ("playlistId","position");