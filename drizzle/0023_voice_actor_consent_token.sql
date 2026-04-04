ALTER TABLE "voice_actors" ADD COLUMN "consentToken" text;--> statement-breakpoint
ALTER TABLE "voice_actors" ADD COLUMN "consentTokenExpiresAt" timestamp;--> statement-breakpoint
ALTER TABLE "voice_actors" ADD CONSTRAINT "voice_actors_consentToken_unique" UNIQUE("consentToken");
