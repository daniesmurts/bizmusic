CREATE TABLE "voice_announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"trackId" text NOT NULL,
	"text" text NOT NULL,
	"languageCode" text DEFAULT 'ru-RU' NOT NULL,
	"voiceName" text NOT NULL,
	"speakingRate" double precision DEFAULT 1 NOT NULL,
	"pitch" double precision DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "isAnnouncement" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "businessId" text;--> statement-breakpoint
ALTER TABLE "voice_announcements" ADD CONSTRAINT "voice_announcements_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_announcements" ADD CONSTRAINT "voice_announcements_trackId_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;