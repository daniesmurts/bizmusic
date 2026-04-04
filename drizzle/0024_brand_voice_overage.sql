-- Migration: add brandVoiceOverageCharsPurchased column to businesses
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "brandVoiceOverageCharsPurchased" integer NOT NULL DEFAULT 0;
