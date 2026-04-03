DO $$ BEGIN
  CREATE TYPE "support_conversation_status" AS ENUM ('OPEN', 'PENDING', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "support_priority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "support_category" AS ENUM ('GENERAL', 'TECHNICAL', 'BILLING', 'LEGAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "support_message_direction" AS ENUM ('USER', 'SUPPORT', 'SYSTEM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "support_message_source" AS ENUM ('PUBLIC_WIDGET', 'DASHBOARD', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "support_delivery_provider" AS ENUM ('TELEGRAM', 'BITRIX24');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "support_delivery_status" AS ENUM ('PENDING', 'SENT', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "support_conversations" (
  "id" text PRIMARY KEY NOT NULL,
  "publicSessionKey" text,
  "userId" text REFERENCES "users"("id") ON DELETE SET NULL,
  "businessId" text REFERENCES "businesses"("id") ON DELETE SET NULL,
  "assignedToUserId" text REFERENCES "users"("id") ON DELETE SET NULL,
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

CREATE TABLE IF NOT EXISTS "support_messages" (
  "id" text PRIMARY KEY NOT NULL,
  "conversationId" text NOT NULL REFERENCES "support_conversations"("id") ON DELETE CASCADE,
  "senderUserId" text REFERENCES "users"("id") ON DELETE SET NULL,
  "direction" "support_message_direction" NOT NULL,
  "source" "support_message_source" NOT NULL,
  "body" text NOT NULL,
  "isInternal" boolean DEFAULT false NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "support_message_deliveries" (
  "id" text PRIMARY KEY NOT NULL,
  "messageId" text NOT NULL REFERENCES "support_messages"("id") ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS "idx_support_conversations_status_last_message" ON "support_conversations" ("status", "lastMessageAt");
CREATE INDEX IF NOT EXISTS "idx_support_conversations_user_created" ON "support_conversations" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_support_conversations_business_created" ON "support_conversations" ("businessId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_support_conversations_public_session_key" ON "support_conversations" ("publicSessionKey");

CREATE INDEX IF NOT EXISTS "idx_support_messages_conversation_created" ON "support_messages" ("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_support_messages_sender_created" ON "support_messages" ("senderUserId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "support_message_delivery_unique_target" ON "support_message_deliveries" ("messageId", "provider", "target");
CREATE INDEX IF NOT EXISTS "idx_support_message_deliveries_status_updated" ON "support_message_deliveries" ("status", "updatedAt");