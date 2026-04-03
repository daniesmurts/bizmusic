-- Announcement play logs: track announcement plays and skips for analytics
CREATE TABLE IF NOT EXISTS "announcement_play_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "announcementId" text NOT NULL REFERENCES "voice_announcements"("id") ON DELETE CASCADE,
  "trackId" text NOT NULL REFERENCES "tracks"("id") ON DELETE CASCADE,
  "businessId" text NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
  "locationId" text REFERENCES "locations"("id") ON DELETE SET NULL,
  "wasSkipped" boolean DEFAULT false NOT NULL,
  "listenDurationSec" integer DEFAULT 0 NOT NULL,
  "playedAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "announcement_play_logs_business_played_idx" ON "announcement_play_logs" ("businessId", "playedAt");
CREATE INDEX IF NOT EXISTS "announcement_play_logs_announcement_played_idx" ON "announcement_play_logs" ("announcementId", "playedAt");
CREATE INDEX IF NOT EXISTS "announcement_play_logs_track_played_idx" ON "announcement_play_logs" ("trackId", "playedAt");
