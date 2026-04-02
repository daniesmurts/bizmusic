-- Song of the Week Feature
CREATE TABLE IF NOT EXISTS "song_of_the_week" (
  "id" text PRIMARY KEY,
  "trackId" text NOT NULL REFERENCES "tracks"("id") ON DELETE CASCADE,
  "postedAt" timestamp DEFAULT now() NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "isActive" boolean DEFAULT true NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_song_of_week_active" ON "song_of_the_week" ("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS "idx_song_of_week_expires_at" ON "song_of_the_week" ("expiresAt");
CREATE INDEX IF NOT EXISTS "idx_song_of_week_posted_at" ON "song_of_the_week" ("postedAt");
