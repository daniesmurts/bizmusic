CREATE TABLE IF NOT EXISTS "track_download_events" (
  "id" text PRIMARY KEY NOT NULL,
  "trackId" text NOT NULL REFERENCES "tracks"("id") ON DELETE CASCADE,
  "songOfWeekId" text REFERENCES "song_of_the_week"("id") ON DELETE SET NULL,
  "source" text DEFAULT 'unknown' NOT NULL,
  "ipHash" text,
  "userAgent" text,
  "referer" text,
  "downloadedAt" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "track_download_events_track_downloaded_idx" ON "track_download_events" ("trackId", "downloadedAt");
CREATE INDEX IF NOT EXISTS "track_download_events_downloaded_at_idx" ON "track_download_events" ("downloadedAt");
CREATE INDEX IF NOT EXISTS "track_download_events_source_idx" ON "track_download_events" ("source");
CREATE INDEX IF NOT EXISTS "track_download_events_song_of_week_idx" ON "track_download_events" ("songOfWeekId");
