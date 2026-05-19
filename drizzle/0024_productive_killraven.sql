CREATE TABLE "platform_settings" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"tierBusinessPrice" integer DEFAULT 149000 NOT NULL,
	"tierContentPrice" integer DEFAULT 179000 NOT NULL,
	"tierBusinessProPrice" integer DEFAULT 249000 NOT NULL,
	"tierBusinessPlusPrice" integer DEFAULT 499000 NOT NULL,
	"paymentProcessingFeePercent" double precision DEFAULT 2.5 NOT NULL,
	"taxRatePercent" double precision DEFAULT 6 NOT NULL,
	"ambassadorCommissionPercent" double precision DEFAULT 30 NOT NULL,
	"minimumPayoutThresholdKopeks" integer DEFAULT 50000 NOT NULL,
	"payoutDay" text DEFAULT 'friday' NOT NULL,
	"infrastructureCostKopeks" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_settings_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"adminUserId" text,
	"field" text NOT NULL,
	"oldValue" text NOT NULL,
	"newValue" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "platform_settings_audit_log" ADD CONSTRAINT "platform_settings_audit_log_adminUserId_users_id_fk" FOREIGN KEY ("adminUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "platform_settings_audit_log_admin_user_idx" ON "platform_settings_audit_log" USING btree ("adminUserId");--> statement-breakpoint
CREATE INDEX "platform_settings_audit_log_created_at_idx" ON "platform_settings_audit_log" USING btree ("createdAt");