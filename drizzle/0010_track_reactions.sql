CREATE TYPE "public"."track_reaction_type" AS ENUM('LIKE', 'DISLIKE');--> statement-breakpoint
CREATE TABLE "track_reactions" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"trackId" text NOT NULL,
	"reactionType" "track_reaction_type" NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "track_reactions_user_track_unique" UNIQUE("userId","trackId")
);
--> statement-breakpoint
ALTER TABLE "track_reactions" ADD CONSTRAINT "track_reactions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_reactions" ADD CONSTRAINT "track_reactions_trackId_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "track_reactions_track_type_idx" ON "track_reactions" USING btree ("trackId","reactionType");--> statement-breakpoint
CREATE INDEX "track_reactions_created_at_idx" ON "track_reactions" USING btree ("createdAt");--> statement-breakpoint
