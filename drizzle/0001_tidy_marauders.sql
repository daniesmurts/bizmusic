CREATE TABLE "artists" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"imageUrl" text,
	"bio" text,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"externalLinks" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "artists_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "albums" ADD COLUMN "artistId" text;--> statement-breakpoint
ALTER TABLE "tracks" ADD COLUMN "artistId" text;--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_artistId_artists_id_fk" FOREIGN KEY ("artistId") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_artistId_artists_id_fk" FOREIGN KEY ("artistId") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;