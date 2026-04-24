-- tracks: indexes for catalog filtering, joins, and ordering
CREATE INDEX IF NOT EXISTS "tracks_business_id_idx" ON "tracks" ("businessId");
CREATE INDEX IF NOT EXISTS "tracks_is_featured_idx" ON "tracks" ("isFeatured");
CREATE INDEX IF NOT EXISTS "tracks_is_announcement_idx" ON "tracks" ("isAnnouncement");
CREATE INDEX IF NOT EXISTS "tracks_artist_id_idx" ON "tracks" ("artistId");
CREATE INDEX IF NOT EXISTS "tracks_created_at_idx" ON "tracks" ("createdAt");

-- play_logs: indexes for analytics, compliance reports, and play-count joins
CREATE INDEX IF NOT EXISTS "play_logs_track_id_idx" ON "play_logs" ("trackId");
CREATE INDEX IF NOT EXISTS "play_logs_business_id_idx" ON "play_logs" ("businessId");
CREATE INDEX IF NOT EXISTS "play_logs_location_id_idx" ON "play_logs" ("locationId");
CREATE INDEX IF NOT EXISTS "play_logs_played_at_idx" ON "play_logs" ("playedAt");
