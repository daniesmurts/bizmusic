ALTER TYPE "public"."role" ADD VALUE 'PARTNER';--> statement-breakpoint
CREATE TABLE "agent_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"agentId" text NOT NULL,
	"cityId" text,
	"nicheId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_niches" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"region" text,
	"isActive" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "commission_ledger" (
	"id" text PRIMARY KEY NOT NULL,
	"agentId" text NOT NULL,
	"conversionId" text NOT NULL,
	"periodMonth" text NOT NULL,
	"subscriptionAmountKopecks" integer NOT NULL,
	"commissionAmountKopecks" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"paidAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_businesses" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"cityId" text,
	"nicheId" text,
	"address" text,
	"phone" text,
	"email" text,
	"website" text,
	"contactName" text,
	"source" text DEFAULT 'manual' NOT NULL,
	"isAssigned" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"leadId" text NOT NULL,
	"agentId" text NOT NULL,
	"type" text NOT NULL,
	"note" text,
	"previousStatus" text,
	"newStatus" text,
	"callbackAt" timestamp,
	"emailSubject" text,
	"emailBodyText" text,
	"emailFrom" text,
	"emailTo" text,
	"emailMessageId" text,
	"isRead" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"agentId" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"priority" integer DEFAULT 2 NOT NULL,
	"nextCallbackAt" timestamp,
	"convertedAt" timestamp,
	"convertedSubscriptionId" text,
	"callAttempts" integer DEFAULT 0 NOT NULL,
	"lastContactedAt" timestamp,
	"unreadEmailCount" integer DEFAULT 0 NOT NULL,
	"lastEmailAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_agents" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"referralCode" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"commissionRate" double precision DEFAULT 0.3 NOT NULL,
	"fullName" text,
	"phone" text,
	"city" text,
	"telegramChatId" text,
	"emailAlias" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "referral_agents_referralCode_unique" UNIQUE("referralCode"),
	CONSTRAINT "referral_agents_emailAlias_unique" UNIQUE("emailAlias")
);
--> statement-breakpoint
CREATE TABLE "referral_clicks" (
	"id" text PRIMARY KEY NOT NULL,
	"agentId" text NOT NULL,
	"referralCode" text NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"convertedUserId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_conversions" (
	"id" text PRIMARY KEY NOT NULL,
	"agentId" text NOT NULL,
	"referredUserId" text NOT NULL,
	"businessId" text NOT NULL,
	"status" text DEFAULT 'trial' NOT NULL,
	"firstPaymentAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_conversions_referredUserId_unique" UNIQUE("referredUserId")
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "brandVoiceOverageCharsPurchased" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referredByAgentId" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referralCodeUsed" text;--> statement-breakpoint
ALTER TABLE "voice_actors" ADD COLUMN "consentToken" text;--> statement-breakpoint
ALTER TABLE "voice_actors" ADD COLUMN "consentTokenExpiresAt" timestamp;--> statement-breakpoint
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_agentId_referral_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."referral_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_cityId_cities_id_fk" FOREIGN KEY ("cityId") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_nicheId_business_niches_id_fk" FOREIGN KEY ("nicheId") REFERENCES "public"."business_niches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_ledger" ADD CONSTRAINT "commission_ledger_agentId_referral_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."referral_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_ledger" ADD CONSTRAINT "commission_ledger_conversionId_referral_conversions_id_fk" FOREIGN KEY ("conversionId") REFERENCES "public"."referral_conversions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_businesses" ADD CONSTRAINT "crm_businesses_cityId_cities_id_fk" FOREIGN KEY ("cityId") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_businesses" ADD CONSTRAINT "crm_businesses_nicheId_business_niches_id_fk" FOREIGN KEY ("nicheId") REFERENCES "public"."business_niches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_leads_id_fk" FOREIGN KEY ("leadId") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_agentId_referral_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."referral_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_businessId_crm_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."crm_businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_agentId_referral_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."referral_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_agents" ADD CONSTRAINT "referral_agents_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_clicks" ADD CONSTRAINT "referral_clicks_agentId_referral_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."referral_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_clicks" ADD CONSTRAINT "referral_clicks_convertedUserId_users_id_fk" FOREIGN KEY ("convertedUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_agentId_referral_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."referral_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_referredUserId_users_id_fk" FOREIGN KEY ("referredUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_assignments_unique" ON "agent_assignments" USING btree ("agentId","cityId","nicheId");--> statement-breakpoint
CREATE INDEX "commission_ledger_agent_period_idx" ON "commission_ledger" USING btree ("agentId","periodMonth");--> statement-breakpoint
CREATE INDEX "commission_ledger_status_idx" ON "commission_ledger" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "commission_ledger_conversion_period_unique" ON "commission_ledger" USING btree ("conversionId","periodMonth");--> statement-breakpoint
CREATE INDEX "crm_businesses_city_niche_idx" ON "crm_businesses" USING btree ("cityId","nicheId");--> statement-breakpoint
CREATE INDEX "crm_businesses_is_assigned_idx" ON "crm_businesses" USING btree ("isAssigned");--> statement-breakpoint
CREATE INDEX "lead_activities_lead_idx" ON "lead_activities" USING btree ("leadId");--> statement-breakpoint
CREATE INDEX "lead_activities_agent_created_idx" ON "lead_activities" USING btree ("agentId","createdAt");--> statement-breakpoint
CREATE INDEX "lead_activities_is_read_idx" ON "lead_activities" USING btree ("isRead");--> statement-breakpoint
CREATE INDEX "leads_agent_status_idx" ON "leads" USING btree ("agentId","status");--> statement-breakpoint
CREATE INDEX "leads_agent_callback_idx" ON "leads" USING btree ("agentId","nextCallbackAt");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "referral_agents_code_idx" ON "referral_agents" USING btree ("referralCode");--> statement-breakpoint
CREATE INDEX "referral_agents_user_id_idx" ON "referral_agents" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "referral_agents_email_alias_idx" ON "referral_agents" USING btree ("emailAlias");--> statement-breakpoint
CREATE INDEX "referral_clicks_agent_id_idx" ON "referral_clicks" USING btree ("agentId");--> statement-breakpoint
CREATE INDEX "referral_clicks_converted_user_id_idx" ON "referral_clicks" USING btree ("convertedUserId");--> statement-breakpoint
CREATE INDEX "referral_conversions_agent_id_idx" ON "referral_conversions" USING btree ("agentId");--> statement-breakpoint
CREATE INDEX "referral_conversions_referred_user_id_idx" ON "referral_conversions" USING btree ("referredUserId");--> statement-breakpoint
CREATE INDEX "businesses_user_id_idx" ON "businesses" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "businesses_subscription_status_idx" ON "businesses" USING btree ("subscriptionStatus");--> statement-breakpoint
CREATE INDEX "businesses_subscription_expires_at_idx" ON "businesses" USING btree ("subscriptionExpiresAt");--> statement-breakpoint
CREATE INDEX "locations_business_id_idx" ON "locations" USING btree ("businessId");--> statement-breakpoint
CREATE INDEX "payments_business_id_created_at_idx" ON "payments" USING btree ("businessId","createdAt");--> statement-breakpoint
CREATE INDEX "play_logs_track_id_idx" ON "play_logs" USING btree ("trackId");--> statement-breakpoint
CREATE INDEX "play_logs_business_id_idx" ON "play_logs" USING btree ("businessId");--> statement-breakpoint
CREATE INDEX "play_logs_location_id_idx" ON "play_logs" USING btree ("locationId");--> statement-breakpoint
CREATE INDEX "play_logs_played_at_idx" ON "play_logs" USING btree ("playedAt");--> statement-breakpoint
CREATE INDEX "tracks_business_id_idx" ON "tracks" USING btree ("businessId");--> statement-breakpoint
CREATE INDEX "tracks_is_featured_idx" ON "tracks" USING btree ("isFeatured");--> statement-breakpoint
CREATE INDEX "tracks_is_announcement_idx" ON "tracks" USING btree ("isAnnouncement");--> statement-breakpoint
CREATE INDEX "tracks_artist_id_idx" ON "tracks" USING btree ("artistId");--> statement-breakpoint
CREATE INDEX "tracks_created_at_idx" ON "tracks" USING btree ("createdAt");--> statement-breakpoint
ALTER TABLE "voice_actors" ADD CONSTRAINT "voice_actors_consentToken_unique" UNIQUE("consentToken");