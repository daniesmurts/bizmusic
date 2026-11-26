CREATE TYPE "public"."auth_token_type" AS ENUM('EMAIL_VERIFY', 'PASSWORD_RESET', 'INVITE');--> statement-breakpoint
CREATE TYPE "public"."billing_interval" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."demo_request_status" AS ENUM('PENDING', 'CONTACTED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."document_status" AS ENUM('GENERATING', 'READY', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."platform_announcement_access" AS ENUM('FREE', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."platform_announcement_source" AS ENUM('UPLOAD', 'TTS');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'BUSINESS_OWNER', 'STAFF', 'PARTNER');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('INACTIVE', 'ACTIVE', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."support_category" AS ENUM('GENERAL', 'TECHNICAL', 'BILLING', 'LEGAL');--> statement-breakpoint
CREATE TYPE "public"."support_conversation_status" AS ENUM('OPEN', 'PENDING', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."support_delivery_provider" AS ENUM('TELEGRAM', 'BITRIX24');--> statement-breakpoint
CREATE TYPE "public"."support_delivery_status" AS ENUM('PENDING', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."support_message_direction" AS ENUM('USER', 'SUPPORT', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."support_message_source" AS ENUM('PUBLIC_WIDGET', 'DASHBOARD', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."support_priority" AS ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."track_reaction_type" AS ENUM('LIKE', 'DISLIKE');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('BUSINESS', 'CREATOR');--> statement-breakpoint
CREATE TABLE "agent_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"agentId" text NOT NULL,
	"cityId" text,
	"nicheId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage_events" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"provider" text NOT NULL,
	"sourceType" text NOT NULL,
	"charsCount" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "albums" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"artist" text NOT NULL,
	"artistId" text,
	"coverUrl" text,
	"description" text,
	"releaseDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcement_bulk_job_targets" (
	"id" text PRIMARY KEY NOT NULL,
	"jobId" text NOT NULL,
	"locationId" text,
	"playlistId" text,
	"announcementId" text,
	"trackId" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcement_bulk_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"createdByUserId" text,
	"title" text NOT NULL,
	"text" text NOT NULL,
	"ssmlText" text,
	"provider" text DEFAULT 'sberbank' NOT NULL,
	"voiceName" text NOT NULL,
	"speakingRate" double precision DEFAULT 1 NOT NULL,
	"pitch" double precision DEFAULT 0 NOT NULL,
	"jingleId" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"totalTargets" integer DEFAULT 0 NOT NULL,
	"successTargets" integer DEFAULT 0 NOT NULL,
	"failedTargets" integer DEFAULT 0 NOT NULL,
	"generatedAnnouncementId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcement_jingles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"fileUrl" text NOT NULL,
	"duration" integer DEFAULT 0 NOT NULL,
	"position" text DEFAULT 'intro' NOT NULL,
	"volumeDb" integer DEFAULT -6 NOT NULL,
	"isPublished" boolean DEFAULT true NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdByUserId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcement_play_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"announcementId" text NOT NULL,
	"trackId" text NOT NULL,
	"businessId" text NOT NULL,
	"locationId" text,
	"wasSkipped" boolean DEFAULT false NOT NULL,
	"listenDurationSec" integer DEFAULT 0 NOT NULL,
	"playedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcement_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"text" text NOT NULL,
	"pack" text DEFAULT 'base' NOT NULL,
	"packLabel" text DEFAULT 'Базовые' NOT NULL,
	"provider" text DEFAULT 'sberbank' NOT NULL,
	"isSeasonal" boolean DEFAULT false NOT NULL,
	"seasonCode" text,
	"isPublished" boolean DEFAULT true NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdByUserId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "auth_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"type" "auth_token_type" NOT NULL,
	"tokenHash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"usedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "brand_voice_models" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"actorId" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"provider" text DEFAULT 'external' NOT NULL,
	"providerModelId" text,
	"providerJobId" text,
	"subscriptionTier" text,
	"setupPaymentId" text,
	"monthlyCharsLimit" integer DEFAULT 0 NOT NULL,
	"monthlyCharsUsed" integer DEFAULT 0 NOT NULL,
	"monthlyPeriodStart" timestamp,
	"monthlyPeriodEnd" timestamp,
	"samplesRequiredMinutes" integer DEFAULT 10 NOT NULL,
	"samplesUploadedSeconds" integer DEFAULT 0 NOT NULL,
	"qualityScore" integer,
	"consentCheckedAt" timestamp,
	"trainingStartedAt" timestamp,
	"trainingCompletedAt" timestamp,
	"estimatedCompletionAt" timestamp,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_voice_usage_events" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"modelId" text NOT NULL,
	"announcementId" text,
	"provider" text NOT NULL,
	"charsCount" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_announcement_acquisitions" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"platformAnnouncementId" text NOT NULL,
	"paymentId" text,
	"importedAnnouncementId" text,
	"pricePaidKopeks" integer DEFAULT 0 NOT NULL,
	"claimedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_niches" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text
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
	"ttsMonthlyUsed" integer DEFAULT 0 NOT NULL,
	"ttsMonthlyPeriodStart" timestamp,
	"ttsMonthlyPeriodEnd" timestamp,
	"aiMonthlyUsed" integer DEFAULT 0 NOT NULL,
	"aiMonthlyPeriodStart" timestamp,
	"aiMonthlyPeriodEnd" timestamp,
	"brandVoiceMonthlyUsed" integer DEFAULT 0 NOT NULL,
	"brandVoiceMonthlyPeriodStart" timestamp,
	"brandVoiceMonthlyPeriodEnd" timestamp,
	"brandVoiceOverageCharsPurchased" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "businesses_inn_unique" UNIQUE("inn")
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
	"documentStatus" "document_status" DEFAULT 'READY' NOT NULL,
	"generationError" text,
	"agreementAcceptedAt" timestamp,
	"agreementAcceptedIp" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "licenses_licenseNumber_unique" UNIQUE("licenseNumber")
);
--> statement-breakpoint
CREATE TABLE "location_playlist_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"locationId" text NOT NULL,
	"playlistId" text NOT NULL,
	"updatedByUserId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "location_playlist_assignments_locationId_unique" UNIQUE("locationId")
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
	"paymentType" text DEFAULT 'subscription' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"recurrent" boolean DEFAULT false NOT NULL,
	"rebillId" text,
	"errorCode" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "payments_tbankPaymentId_unique" UNIQUE("tbankPaymentId"),
	CONSTRAINT "payments_orderId_unique" UNIQUE("orderId")
);
--> statement-breakpoint
CREATE TABLE "platform_announcement_products" (
	"id" text PRIMARY KEY NOT NULL,
	"trackId" text NOT NULL,
	"createdByUserId" text,
	"description" text,
	"transcript" text,
	"languageCode" text DEFAULT 'ru-RU' NOT NULL,
	"provider" text DEFAULT 'uploaded' NOT NULL,
	"voiceName" text DEFAULT 'uploaded' NOT NULL,
	"speakingRate" double precision DEFAULT 1 NOT NULL,
	"pitch" double precision DEFAULT 0 NOT NULL,
	"accessModel" "platform_announcement_access" DEFAULT 'FREE' NOT NULL,
	"priceKopeks" integer DEFAULT 0 NOT NULL,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"isPublished" boolean DEFAULT true NOT NULL,
	"sourceType" "platform_announcement_source" NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "platform_announcement_products_trackId_unique" UNIQUE("trackId")
);
--> statement-breakpoint
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
CREATE TABLE "song_of_the_week" (
	"id" text PRIMARY KEY NOT NULL,
	"trackId" text NOT NULL,
	"postedAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"publicSessionKey" text,
	"userId" text,
	"businessId" text,
	"assignedToUserId" text,
	"visitorName" text,
	"visitorEmail" text,
	"visitorPhone" text,
	"subject" text,
	"category" "support_category" DEFAULT 'GENERAL' NOT NULL,
	"priority" "support_priority" DEFAULT 'NORMAL' NOT NULL,
	"status" "support_conversation_status" DEFAULT 'OPEN' NOT NULL,
	"bitrixTaskId" text,
	"lastMessageAt" timestamp DEFAULT now() NOT NULL,
	"closedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_message_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"messageId" text NOT NULL,
	"provider" "support_delivery_provider" NOT NULL,
	"status" "support_delivery_status" DEFAULT 'PENDING' NOT NULL,
	"target" text NOT NULL,
	"externalId" text,
	"attemptCount" integer DEFAULT 0 NOT NULL,
	"lastError" text,
	"lastAttemptAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"conversationId" text NOT NULL,
	"senderUserId" text,
	"direction" "support_message_direction" NOT NULL,
	"source" "support_message_source" NOT NULL,
	"body" text NOT NULL,
	"isInternal" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "track_download_events" (
	"id" text PRIMARY KEY NOT NULL,
	"trackId" text NOT NULL,
	"songOfWeekId" text,
	"source" text DEFAULT 'unknown' NOT NULL,
	"ipHash" text,
	"userAgent" text,
	"referer" text,
	"downloadedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "track_reactions" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"trackId" text NOT NULL,
	"reactionType" "track_reaction_type" NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "track_skips" (
	"id" serial PRIMARY KEY NOT NULL,
	"trackId" text NOT NULL,
	"userId" text,
	"businessId" text,
	"locationId" text,
	"skippedAt" timestamp DEFAULT now() NOT NULL,
	"playedAt" timestamp,
	"device" varchar(64),
	"reason" varchar(128)
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
	"isAnnouncement" boolean DEFAULT false NOT NULL,
	"rightsStatus" text DEFAULT 'Direct Owner',
	"territoryRestriction" text[],
	"vocalType" text DEFAULT 'Instrumental',
	"language" text DEFAULT 'Russian',
	"timeSuitability" text[],
	"businessId" text,
	"energyLevel" integer,
	"downloadsCount" integer DEFAULT 0 NOT NULL,
	"sharesCount" integer DEFAULT 0 NOT NULL,
	"artistId" text,
	"albumId" text,
	"trackNumber" integer,
	"coverUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tts_credit_lots" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"creditsTotal" integer NOT NULL,
	"creditsRemaining" integer NOT NULL,
	"purchasedAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"paymentId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tts_usage_events" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"announcementId" text,
	"provider" text NOT NULL,
	"sourceType" text NOT NULL,
	"consumedCredits" integer DEFAULT 1 NOT NULL,
	"charsCount" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"passwordHash" text,
	"emailVerifiedAt" timestamp,
	"disabledAt" timestamp,
	"sessionVersion" integer DEFAULT 0 NOT NULL,
	"role" "role" DEFAULT 'BUSINESS_OWNER' NOT NULL,
	"userType" "user_type" DEFAULT 'BUSINESS' NOT NULL,
	"phone" text,
	"assignedLocationId" text,
	"termsAccepted" boolean DEFAULT false NOT NULL,
	"termsAcceptedAt" timestamp,
	"referredByAgentId" text,
	"referralCodeUsed" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "voice_actors" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"fullName" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"role" text DEFAULT 'employee' NOT NULL,
	"consentDocumentUrl" text,
	"consentVersion" text,
	"consentAcceptedAt" timestamp,
	"consentIpAddress" text,
	"consentUserAgent" text,
	"consentRevokedAt" timestamp,
	"consentToken" text,
	"consentTokenExpiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "voice_actors_consentToken_unique" UNIQUE("consentToken")
);
--> statement-breakpoint
CREATE TABLE "voice_announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"trackId" text NOT NULL,
	"platformAnnouncementId" text,
	"brandVoiceModelId" text,
	"text" text NOT NULL,
	"languageCode" text DEFAULT 'ru-RU' NOT NULL,
	"provider" text DEFAULT 'google' NOT NULL,
	"voiceName" text NOT NULL,
	"speakingRate" double precision DEFAULT 1 NOT NULL,
	"pitch" double precision DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voice_samples" (
	"id" text PRIMARY KEY NOT NULL,
	"actorId" text NOT NULL,
	"modelId" text,
	"fileUrl" text NOT NULL,
	"fileName" text NOT NULL,
	"fileSizeBytes" integer,
	"mimeType" text,
	"durationSeconds" integer,
	"transcript" text,
	"approvalStatus" text DEFAULT 'PENDING' NOT NULL,
	"approvalReason" text,
	"approvedAt" timestamp,
	"uploadedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wave_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"businessId" text NOT NULL,
	"energyPreference" integer DEFAULT 5 NOT NULL,
	"vocalPreference" text DEFAULT 'both' NOT NULL,
	"focusProfile" text DEFAULT 'none' NOT NULL,
	"announcementScheduleEnabled" boolean DEFAULT false NOT NULL,
	"announcementScheduleConfig" jsonb DEFAULT '{"frequency":0,"mode":"sequential","timeRules":[],"weights":{}}'::jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "wave_settings_businessId_unique" UNIQUE("businessId")
);
--> statement-breakpoint
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_agentId_referral_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."referral_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_cityId_cities_id_fk" FOREIGN KEY ("cityId") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_assignments" ADD CONSTRAINT "agent_assignments_nicheId_business_niches_id_fk" FOREIGN KEY ("nicheId") REFERENCES "public"."business_niches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_events" ADD CONSTRAINT "ai_usage_events_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_artistId_artists_id_fk" FOREIGN KEY ("artistId") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_bulk_job_targets" ADD CONSTRAINT "announcement_bulk_job_targets_jobId_announcement_bulk_jobs_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."announcement_bulk_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_bulk_job_targets" ADD CONSTRAINT "announcement_bulk_job_targets_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_bulk_job_targets" ADD CONSTRAINT "announcement_bulk_job_targets_playlistId_playlists_id_fk" FOREIGN KEY ("playlistId") REFERENCES "public"."playlists"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_bulk_job_targets" ADD CONSTRAINT "announcement_bulk_job_targets_announcementId_voice_announcements_id_fk" FOREIGN KEY ("announcementId") REFERENCES "public"."voice_announcements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_bulk_job_targets" ADD CONSTRAINT "announcement_bulk_job_targets_trackId_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."tracks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_bulk_jobs" ADD CONSTRAINT "announcement_bulk_jobs_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_bulk_jobs" ADD CONSTRAINT "announcement_bulk_jobs_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_bulk_jobs" ADD CONSTRAINT "announcement_bulk_jobs_jingleId_announcement_jingles_id_fk" FOREIGN KEY ("jingleId") REFERENCES "public"."announcement_jingles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_bulk_jobs" ADD CONSTRAINT "announcement_bulk_jobs_generatedAnnouncementId_voice_announcements_id_fk" FOREIGN KEY ("generatedAnnouncementId") REFERENCES "public"."voice_announcements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_jingles" ADD CONSTRAINT "announcement_jingles_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_play_logs" ADD CONSTRAINT "announcement_play_logs_announcementId_voice_announcements_id_fk" FOREIGN KEY ("announcementId") REFERENCES "public"."voice_announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_play_logs" ADD CONSTRAINT "announcement_play_logs_trackId_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_play_logs" ADD CONSTRAINT "announcement_play_logs_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_play_logs" ADD CONSTRAINT "announcement_play_logs_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_templates" ADD CONSTRAINT "announcement_templates_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_tags" ADD CONSTRAINT "blog_post_tags_postId_blog_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_categoryId_blog_categories_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."blog_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_voice_models" ADD CONSTRAINT "brand_voice_models_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_voice_models" ADD CONSTRAINT "brand_voice_models_actorId_voice_actors_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."voice_actors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_voice_models" ADD CONSTRAINT "brand_voice_models_setupPaymentId_payments_id_fk" FOREIGN KEY ("setupPaymentId") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_voice_usage_events" ADD CONSTRAINT "brand_voice_usage_events_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_voice_usage_events" ADD CONSTRAINT "brand_voice_usage_events_modelId_brand_voice_models_id_fk" FOREIGN KEY ("modelId") REFERENCES "public"."brand_voice_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_voice_usage_events" ADD CONSTRAINT "brand_voice_usage_events_announcementId_voice_announcements_id_fk" FOREIGN KEY ("announcementId") REFERENCES "public"."voice_announcements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_announcement_acquisitions" ADD CONSTRAINT "business_announcement_acquisitions_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_announcement_acquisitions" ADD CONSTRAINT "business_announcement_acquisitions_platformAnnouncementId_platform_announcement_products_id_fk" FOREIGN KEY ("platformAnnouncementId") REFERENCES "public"."platform_announcement_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_announcement_acquisitions" ADD CONSTRAINT "business_announcement_acquisitions_paymentId_payments_id_fk" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_announcement_acquisitions" ADD CONSTRAINT "business_announcement_acquisitions_importedAnnouncementId_voice_announcements_id_fk" FOREIGN KEY ("importedAnnouncementId") REFERENCES "public"."voice_announcements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_ledger" ADD CONSTRAINT "commission_ledger_agentId_referral_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."referral_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_ledger" ADD CONSTRAINT "commission_ledger_conversionId_referral_conversions_id_fk" FOREIGN KEY ("conversionId") REFERENCES "public"."referral_conversions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_businesses" ADD CONSTRAINT "crm_businesses_cityId_cities_id_fk" FOREIGN KEY ("cityId") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_businesses" ADD CONSTRAINT "crm_businesses_nicheId_business_niches_id_fk" FOREIGN KEY ("nicheId") REFERENCES "public"."business_niches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_leads_id_fk" FOREIGN KEY ("leadId") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_agentId_referral_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."referral_agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_businessId_crm_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."crm_businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_agentId_referral_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."referral_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_acceptance_events" ADD CONSTRAINT "legal_acceptance_events_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "licenses" ADD CONSTRAINT "licenses_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_playlist_assignments" ADD CONSTRAINT "location_playlist_assignments_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_playlist_assignments" ADD CONSTRAINT "location_playlist_assignments_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_playlist_assignments" ADD CONSTRAINT "location_playlist_assignments_playlistId_playlists_id_fk" FOREIGN KEY ("playlistId") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_playlist_assignments" ADD CONSTRAINT "location_playlist_assignments_updatedByUserId_users_id_fk" FOREIGN KEY ("updatedByUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_announcement_products" ADD CONSTRAINT "platform_announcement_products_trackId_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_announcement_products" ADD CONSTRAINT "platform_announcement_products_createdByUserId_users_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_settings_audit_log" ADD CONSTRAINT "platform_settings_audit_log_adminUserId_users_id_fk" FOREIGN KEY ("adminUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_logs" ADD CONSTRAINT "play_logs_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_logs" ADD CONSTRAINT "play_logs_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_logs" ADD CONSTRAINT "play_logs_trackId_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."tracks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_playlistId_playlists_id_fk" FOREIGN KEY ("playlistId") REFERENCES "public"."playlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlist_tracks" ADD CONSTRAINT "playlist_tracks_trackId_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "playlists" ADD CONSTRAINT "playlists_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_agents" ADD CONSTRAINT "referral_agents_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_clicks" ADD CONSTRAINT "referral_clicks_agentId_referral_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."referral_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_clicks" ADD CONSTRAINT "referral_clicks_convertedUserId_users_id_fk" FOREIGN KEY ("convertedUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_agentId_referral_agents_id_fk" FOREIGN KEY ("agentId") REFERENCES "public"."referral_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_referredUserId_users_id_fk" FOREIGN KEY ("referredUserId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_conversions" ADD CONSTRAINT "referral_conversions_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_of_the_week" ADD CONSTRAINT "song_of_the_week_trackId_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_conversations" ADD CONSTRAINT "support_conversations_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_conversations" ADD CONSTRAINT "support_conversations_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_conversations" ADD CONSTRAINT "support_conversations_assignedToUserId_users_id_fk" FOREIGN KEY ("assignedToUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_message_deliveries" ADD CONSTRAINT "support_message_deliveries_messageId_support_messages_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."support_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_conversationId_support_conversations_id_fk" FOREIGN KEY ("conversationId") REFERENCES "public"."support_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_senderUserId_users_id_fk" FOREIGN KEY ("senderUserId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_download_events" ADD CONSTRAINT "track_download_events_trackId_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_download_events" ADD CONSTRAINT "track_download_events_songOfWeekId_song_of_the_week_id_fk" FOREIGN KEY ("songOfWeekId") REFERENCES "public"."song_of_the_week"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_reactions" ADD CONSTRAINT "track_reactions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_reactions" ADD CONSTRAINT "track_reactions_trackId_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_skips" ADD CONSTRAINT "track_skips_trackId_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_skips" ADD CONSTRAINT "track_skips_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_skips" ADD CONSTRAINT "track_skips_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_skips" ADD CONSTRAINT "track_skips_locationId_locations_id_fk" FOREIGN KEY ("locationId") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_artistId_artists_id_fk" FOREIGN KEY ("artistId") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_albumId_albums_id_fk" FOREIGN KEY ("albumId") REFERENCES "public"."albums"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tts_credit_lots" ADD CONSTRAINT "tts_credit_lots_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tts_credit_lots" ADD CONSTRAINT "tts_credit_lots_paymentId_payments_id_fk" FOREIGN KEY ("paymentId") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tts_usage_events" ADD CONSTRAINT "tts_usage_events_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tts_usage_events" ADD CONSTRAINT "tts_usage_events_announcementId_voice_announcements_id_fk" FOREIGN KEY ("announcementId") REFERENCES "public"."voice_announcements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_actors" ADD CONSTRAINT "voice_actors_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_announcements" ADD CONSTRAINT "voice_announcements_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_announcements" ADD CONSTRAINT "voice_announcements_trackId_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_announcements" ADD CONSTRAINT "voice_announcements_platformAnnouncementId_platform_announcement_products_id_fk" FOREIGN KEY ("platformAnnouncementId") REFERENCES "public"."platform_announcement_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_announcements" ADD CONSTRAINT "voice_announcements_brandVoiceModelId_brand_voice_models_id_fk" FOREIGN KEY ("brandVoiceModelId") REFERENCES "public"."brand_voice_models"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_samples" ADD CONSTRAINT "voice_samples_actorId_voice_actors_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."voice_actors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_samples" ADD CONSTRAINT "voice_samples_modelId_brand_voice_models_id_fk" FOREIGN KEY ("modelId") REFERENCES "public"."brand_voice_models"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wave_settings" ADD CONSTRAINT "wave_settings_businessId_businesses_id_fk" FOREIGN KEY ("businessId") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_assignments_unique" ON "agent_assignments" USING btree ("agentId","cityId","nicheId");--> statement-breakpoint
CREATE INDEX "ai_usage_events_business_created_idx" ON "ai_usage_events" USING btree ("businessId","createdAt");--> statement-breakpoint
CREATE INDEX "announcement_bulk_job_targets_job_status_idx" ON "announcement_bulk_job_targets" USING btree ("jobId","status");--> statement-breakpoint
CREATE INDEX "announcement_bulk_job_targets_playlist_idx" ON "announcement_bulk_job_targets" USING btree ("playlistId");--> statement-breakpoint
CREATE INDEX "announcement_bulk_job_targets_location_idx" ON "announcement_bulk_job_targets" USING btree ("locationId");--> statement-breakpoint
CREATE INDEX "announcement_bulk_jobs_business_created_idx" ON "announcement_bulk_jobs" USING btree ("businessId","createdAt");--> statement-breakpoint
CREATE INDEX "announcement_bulk_jobs_status_created_idx" ON "announcement_bulk_jobs" USING btree ("status","createdAt");--> statement-breakpoint
CREATE INDEX "announcement_jingles_published_sort_idx" ON "announcement_jingles" USING btree ("isPublished","sortOrder","createdAt");--> statement-breakpoint
CREATE INDEX "announcement_jingles_position_published_idx" ON "announcement_jingles" USING btree ("position","isPublished");--> statement-breakpoint
CREATE INDEX "announcement_play_logs_business_played_idx" ON "announcement_play_logs" USING btree ("businessId","playedAt");--> statement-breakpoint
CREATE INDEX "announcement_play_logs_announcement_played_idx" ON "announcement_play_logs" USING btree ("announcementId","playedAt");--> statement-breakpoint
CREATE INDEX "announcement_play_logs_track_played_idx" ON "announcement_play_logs" USING btree ("trackId","playedAt");--> statement-breakpoint
CREATE INDEX "announcement_templates_published_sort_idx" ON "announcement_templates" USING btree ("isPublished","sortOrder","createdAt");--> statement-breakpoint
CREATE INDEX "announcement_templates_pack_idx" ON "announcement_templates" USING btree ("pack","isPublished");--> statement-breakpoint
CREATE INDEX "auth_attempts_key_created_idx" ON "auth_attempts" USING btree ("key","createdAt");--> statement-breakpoint
CREATE INDEX "auth_tokens_user_type_idx" ON "auth_tokens" USING btree ("userId","type");--> statement-breakpoint
CREATE INDEX "auth_tokens_token_hash_idx" ON "auth_tokens" USING btree ("tokenHash");--> statement-breakpoint
CREATE INDEX "blog_post_tags_post_idx" ON "blog_post_tags" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "blog_post_tags_tag_idx" ON "blog_post_tags" USING btree ("tagName");--> statement-breakpoint
CREATE INDEX "blog_post_slug_idx" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_post_category_idx" ON "blog_posts" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "blog_post_published_idx" ON "blog_posts" USING btree ("published");--> statement-breakpoint
CREATE INDEX "brand_voice_models_business_status_idx" ON "brand_voice_models" USING btree ("businessId","status");--> statement-breakpoint
CREATE INDEX "brand_voice_models_actor_idx" ON "brand_voice_models" USING btree ("actorId");--> statement-breakpoint
CREATE UNIQUE INDEX "brand_voice_models_provider_model_unique" ON "brand_voice_models" USING btree ("provider","providerModelId");--> statement-breakpoint
CREATE INDEX "brand_voice_usage_events_business_created_idx" ON "brand_voice_usage_events" USING btree ("businessId","createdAt");--> statement-breakpoint
CREATE INDEX "brand_voice_usage_events_model_created_idx" ON "brand_voice_usage_events" USING btree ("modelId","createdAt");--> statement-breakpoint
CREATE UNIQUE INDEX "business_announcement_acquisition_unique" ON "business_announcement_acquisitions" USING btree ("businessId","platformAnnouncementId");--> statement-breakpoint
CREATE UNIQUE INDEX "business_announcement_acquisition_payment_unique" ON "business_announcement_acquisitions" USING btree ("paymentId");--> statement-breakpoint
CREATE INDEX "business_announcement_acquisition_business_claimed_idx" ON "business_announcement_acquisitions" USING btree ("businessId","claimedAt");--> statement-breakpoint
CREATE INDEX "businesses_user_id_idx" ON "businesses" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "businesses_subscription_status_idx" ON "businesses" USING btree ("subscriptionStatus");--> statement-breakpoint
CREATE INDEX "businesses_subscription_expires_at_idx" ON "businesses" USING btree ("subscriptionExpiresAt");--> statement-breakpoint
CREATE INDEX "commission_ledger_agent_period_idx" ON "commission_ledger" USING btree ("agentId","periodMonth");--> statement-breakpoint
CREATE INDEX "commission_ledger_status_idx" ON "commission_ledger" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "commission_ledger_conversion_period_unique" ON "commission_ledger" USING btree ("conversionId","periodMonth");--> statement-breakpoint
CREATE INDEX "crm_businesses_city_niche_idx" ON "crm_businesses" USING btree ("cityId","nicheId");--> statement-breakpoint
CREATE INDEX "crm_businesses_is_assigned_idx" ON "crm_businesses" USING btree ("isAssigned");--> statement-breakpoint
CREATE INDEX "idx_demo_requests_email" ON "demo_requests" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_demo_requests_status" ON "demo_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lead_activities_lead_idx" ON "lead_activities" USING btree ("leadId");--> statement-breakpoint
CREATE INDEX "lead_activities_agent_created_idx" ON "lead_activities" USING btree ("agentId","createdAt");--> statement-breakpoint
CREATE INDEX "lead_activities_is_read_idx" ON "lead_activities" USING btree ("isRead");--> statement-breakpoint
CREATE INDEX "leads_agent_status_idx" ON "leads" USING btree ("agentId","status");--> statement-breakpoint
CREATE INDEX "leads_agent_callback_idx" ON "leads" USING btree ("agentId","nextCallbackAt");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "location_playlist_assignments_business_location_idx" ON "location_playlist_assignments" USING btree ("businessId","locationId");--> statement-breakpoint
CREATE INDEX "location_playlist_assignments_playlist_idx" ON "location_playlist_assignments" USING btree ("playlistId");--> statement-breakpoint
CREATE INDEX "locations_business_id_idx" ON "locations" USING btree ("businessId");--> statement-breakpoint
CREATE INDEX "payments_business_id_created_at_idx" ON "payments" USING btree ("businessId","createdAt");--> statement-breakpoint
CREATE INDEX "platform_announcement_featured_published_idx" ON "platform_announcement_products" USING btree ("isFeatured","isPublished","sortOrder");--> statement-breakpoint
CREATE INDEX "platform_announcement_access_model_idx" ON "platform_announcement_products" USING btree ("accessModel");--> statement-breakpoint
CREATE INDEX "platform_settings_audit_log_admin_user_idx" ON "platform_settings_audit_log" USING btree ("adminUserId");--> statement-breakpoint
CREATE INDEX "platform_settings_audit_log_created_at_idx" ON "platform_settings_audit_log" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "play_logs_track_id_idx" ON "play_logs" USING btree ("trackId");--> statement-breakpoint
CREATE INDEX "play_logs_business_id_idx" ON "play_logs" USING btree ("businessId");--> statement-breakpoint
CREATE INDEX "play_logs_location_id_idx" ON "play_logs" USING btree ("locationId");--> statement-breakpoint
CREATE INDEX "play_logs_played_at_idx" ON "play_logs" USING btree ("playedAt");--> statement-breakpoint
CREATE INDEX "play_logs_business_played_at_idx" ON "play_logs" USING btree ("businessId","playedAt");--> statement-breakpoint
CREATE INDEX "play_logs_location_played_at_idx" ON "play_logs" USING btree ("locationId","playedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "playlist_track_unique" ON "playlist_tracks" USING btree ("playlistId","trackId");--> statement-breakpoint
CREATE INDEX "playlist_position_idx" ON "playlist_tracks" USING btree ("playlistId","position");--> statement-breakpoint
CREATE INDEX "referral_agents_code_idx" ON "referral_agents" USING btree ("referralCode");--> statement-breakpoint
CREATE INDEX "referral_agents_user_id_idx" ON "referral_agents" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "referral_agents_email_alias_idx" ON "referral_agents" USING btree ("emailAlias");--> statement-breakpoint
CREATE INDEX "referral_clicks_agent_id_idx" ON "referral_clicks" USING btree ("agentId");--> statement-breakpoint
CREATE INDEX "referral_clicks_converted_user_id_idx" ON "referral_clicks" USING btree ("convertedUserId");--> statement-breakpoint
CREATE INDEX "referral_conversions_agent_id_idx" ON "referral_conversions" USING btree ("agentId");--> statement-breakpoint
CREATE INDEX "referral_conversions_referred_user_id_idx" ON "referral_conversions" USING btree ("referredUserId");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_song_of_week_active" ON "song_of_the_week" USING btree ("isActive") WHERE "song_of_the_week"."isActive" = true;--> statement-breakpoint
CREATE INDEX "idx_song_of_week_expires_at" ON "song_of_the_week" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "idx_song_of_week_posted_at" ON "song_of_the_week" USING btree ("postedAt");--> statement-breakpoint
CREATE INDEX "idx_support_conversations_status_last_message" ON "support_conversations" USING btree ("status","lastMessageAt");--> statement-breakpoint
CREATE INDEX "idx_support_conversations_user_created" ON "support_conversations" USING btree ("userId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_support_conversations_business_created" ON "support_conversations" USING btree ("businessId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_support_conversations_public_session_key" ON "support_conversations" USING btree ("publicSessionKey");--> statement-breakpoint
CREATE UNIQUE INDEX "support_message_delivery_unique_target" ON "support_message_deliveries" USING btree ("messageId","provider","target");--> statement-breakpoint
CREATE INDEX "idx_support_message_deliveries_status_updated" ON "support_message_deliveries" USING btree ("status","updatedAt");--> statement-breakpoint
CREATE INDEX "idx_support_messages_conversation_created" ON "support_messages" USING btree ("conversationId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_support_messages_sender_created" ON "support_messages" USING btree ("senderUserId","createdAt");--> statement-breakpoint
CREATE INDEX "track_download_events_track_downloaded_idx" ON "track_download_events" USING btree ("trackId","downloadedAt");--> statement-breakpoint
CREATE INDEX "track_download_events_downloaded_at_idx" ON "track_download_events" USING btree ("downloadedAt");--> statement-breakpoint
CREATE INDEX "track_download_events_source_idx" ON "track_download_events" USING btree ("source");--> statement-breakpoint
CREATE INDEX "track_download_events_song_of_week_idx" ON "track_download_events" USING btree ("songOfWeekId");--> statement-breakpoint
CREATE UNIQUE INDEX "track_reactions_user_track_unique" ON "track_reactions" USING btree ("userId","trackId");--> statement-breakpoint
CREATE INDEX "track_reactions_track_type_idx" ON "track_reactions" USING btree ("trackId","reactionType");--> statement-breakpoint
CREATE INDEX "track_reactions_created_at_idx" ON "track_reactions" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_track_skips_skipped_at" ON "track_skips" USING btree ("skippedAt");--> statement-breakpoint
CREATE INDEX "idx_track_skips_track_id" ON "track_skips" USING btree ("trackId");--> statement-breakpoint
CREATE INDEX "idx_track_skips_business_id" ON "track_skips" USING btree ("businessId");--> statement-breakpoint
CREATE INDEX "idx_track_skips_location_id" ON "track_skips" USING btree ("locationId");--> statement-breakpoint
CREATE INDEX "tracks_business_id_idx" ON "tracks" USING btree ("businessId");--> statement-breakpoint
CREATE INDEX "tracks_is_featured_idx" ON "tracks" USING btree ("isFeatured");--> statement-breakpoint
CREATE INDEX "tracks_is_announcement_idx" ON "tracks" USING btree ("isAnnouncement");--> statement-breakpoint
CREATE INDEX "tracks_artist_id_idx" ON "tracks" USING btree ("artistId");--> statement-breakpoint
CREATE INDEX "tracks_created_at_idx" ON "tracks" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "tts_credit_lots_business_expiry_idx" ON "tts_credit_lots" USING btree ("businessId","expiresAt");--> statement-breakpoint
CREATE UNIQUE INDEX "tts_credit_lots_payment_unique" ON "tts_credit_lots" USING btree ("paymentId");--> statement-breakpoint
CREATE INDEX "tts_usage_events_business_created_idx" ON "tts_usage_events" USING btree ("businessId","createdAt");--> statement-breakpoint
CREATE INDEX "idx_users_assigned_location" ON "users" USING btree ("assignedLocationId");--> statement-breakpoint
CREATE INDEX "users_referred_by_agent_id_idx" ON "users" USING btree ("referredByAgentId");--> statement-breakpoint
CREATE INDEX "voice_actors_business_email_idx" ON "voice_actors" USING btree ("businessId","email");--> statement-breakpoint
CREATE INDEX "voice_samples_actor_approval_idx" ON "voice_samples" USING btree ("actorId","approvalStatus");--> statement-breakpoint
CREATE INDEX "voice_samples_model_uploaded_idx" ON "voice_samples" USING btree ("modelId","uploadedAt");