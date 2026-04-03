CREATE TABLE IF NOT EXISTS "location_playlist_assignments" (
  "id" text PRIMARY KEY NOT NULL,
  "businessId" text NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
  "locationId" text NOT NULL UNIQUE REFERENCES "locations"("id") ON DELETE CASCADE,
  "playlistId" text NOT NULL REFERENCES "playlists"("id") ON DELETE CASCADE,
  "updatedByUserId" text REFERENCES "users"("id") ON DELETE SET NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS "location_playlist_assignments_business_location_idx" ON "location_playlist_assignments" ("businessId", "locationId");
CREATE INDEX IF NOT EXISTS "location_playlist_assignments_playlist_idx" ON "location_playlist_assignments" ("playlistId");
