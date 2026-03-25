ALTER TABLE "businesses" ADD COLUMN "aiMonthlyUsed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "aiMonthlyPeriodStart" timestamp;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "aiMonthlyPeriodEnd" timestamp;--> statement-breakpoint

CREATE TABLE "ai_usage_events" (
  "id" text PRIMARY KEY NOT NULL,
  "businessId" text NOT NULL,
  "provider" text NOT NULL,
  "sourceType" text NOT NULL,
  "charsCount" integer NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE INDEX "ai_usage_events_business_created_idx" ON "ai_usage_events" ("businessId", "createdAt");
