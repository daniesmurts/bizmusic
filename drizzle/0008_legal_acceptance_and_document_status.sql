CREATE TYPE "public"."document_status" AS ENUM('GENERATING', 'READY', 'FAILED');--> statement-breakpoint
ALTER TABLE "licenses" ADD COLUMN "documentStatus" "document_status" DEFAULT 'READY' NOT NULL;--> statement-breakpoint
ALTER TABLE "licenses" ADD COLUMN "generationError" text;--> statement-breakpoint
ALTER TABLE "licenses" ADD COLUMN "agreementAcceptedAt" timestamp;--> statement-breakpoint
ALTER TABLE "licenses" ADD COLUMN "agreementAcceptedIp" text;--> statement-breakpoint
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
ALTER TABLE "legal_acceptance_events" ADD CONSTRAINT "legal_acceptance_events_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;