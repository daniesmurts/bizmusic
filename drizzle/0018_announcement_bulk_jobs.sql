CREATE TABLE IF NOT EXISTS "announcement_bulk_jobs" (
  "id" text PRIMARY KEY NOT NULL,
  "businessId" text NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
  "createdByUserId" text REFERENCES "users"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "text" text NOT NULL,
  "ssmlText" text,
  "provider" text DEFAULT 'sberbank' NOT NULL,
  "voiceName" text NOT NULL,
  "speakingRate" double precision DEFAULT 1 NOT NULL,
  "pitch" double precision DEFAULT 0 NOT NULL,
  "jingleId" text REFERENCES "announcement_jingles"("id") ON DELETE SET NULL,
  "status" text DEFAULT 'PENDING' NOT NULL,
  "totalTargets" integer DEFAULT 0 NOT NULL,
  "successTargets" integer DEFAULT 0 NOT NULL,
  "failedTargets" integer DEFAULT 0 NOT NULL,
  "generatedAnnouncementId" text REFERENCES "voice_announcements"("id") ON DELETE SET NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "announcement_bulk_job_targets" (
  "id" text PRIMARY KEY NOT NULL,
  "jobId" text NOT NULL REFERENCES "announcement_bulk_jobs"("id") ON DELETE CASCADE,
  "locationId" text REFERENCES "locations"("id") ON DELETE SET NULL,
  "playlistId" text REFERENCES "playlists"("id") ON DELETE SET NULL,
  "announcementId" text REFERENCES "voice_announcements"("id") ON DELETE SET NULL,
  "trackId" text REFERENCES "tracks"("id") ON DELETE SET NULL,
  "status" text DEFAULT 'PENDING' NOT NULL,
  "errorMessage" text,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS "announcement_bulk_jobs_business_created_idx" ON "announcement_bulk_jobs" ("businessId", "createdAt");
CREATE INDEX IF NOT EXISTS "announcement_bulk_jobs_status_created_idx" ON "announcement_bulk_jobs" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "announcement_bulk_job_targets_job_status_idx" ON "announcement_bulk_job_targets" ("jobId", "status");
CREATE INDEX IF NOT EXISTS "announcement_bulk_job_targets_playlist_idx" ON "announcement_bulk_job_targets" ("playlistId");
CREATE INDEX IF NOT EXISTS "announcement_bulk_job_targets_location_idx" ON "announcement_bulk_job_targets" ("locationId");
