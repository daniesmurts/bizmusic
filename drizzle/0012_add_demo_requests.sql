CREATE TYPE "public"."demo_request_status" AS ENUM('PENDING', 'CONTACTED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "demo_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company" text,
	"interest" text NOT NULL,
	"message" text,
	"status" "demo_request_status" DEFAULT 'PENDING' NOT NULL,
	"consentAccepted" boolean DEFAULT false NOT NULL,
	"consentAcceptedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_demo_requests_email" ON "demo_requests" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_demo_requests_status" ON "demo_requests" USING btree ("status");