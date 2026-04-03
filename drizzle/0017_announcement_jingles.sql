CREATE TABLE IF NOT EXISTS "announcement_jingles" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "fileUrl" text NOT NULL,
  "duration" integer DEFAULT 0 NOT NULL,
  "position" text DEFAULT 'intro' NOT NULL,
  "volumeDb" integer DEFAULT -6 NOT NULL,
  "isPublished" boolean DEFAULT true NOT NULL,
  "sortOrder" integer DEFAULT 0 NOT NULL,
  "createdByUserId" text REFERENCES "users"("id") ON DELETE SET NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS "announcement_jingles_published_sort_idx" ON "announcement_jingles" ("isPublished", "sortOrder", "createdAt");
CREATE INDEX IF NOT EXISTS "announcement_jingles_position_published_idx" ON "announcement_jingles" ("position", "isPublished");
