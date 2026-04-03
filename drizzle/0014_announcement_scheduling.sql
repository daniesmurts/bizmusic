-- Announcement auto-scheduling: add scheduling config to wave_settings
ALTER TABLE "wave_settings"
  ADD COLUMN IF NOT EXISTS "announcementScheduleEnabled" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "announcementScheduleConfig" jsonb DEFAULT '{"frequency":0,"mode":"sequential","timeRules":[],"weights":{}}'::jsonb NOT NULL;
