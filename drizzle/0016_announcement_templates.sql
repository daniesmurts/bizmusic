CREATE TABLE IF NOT EXISTS "announcement_templates" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "title" text NOT NULL,
  "text" text NOT NULL,
  "pack" text DEFAULT 'base' NOT NULL,
  "packLabel" text DEFAULT 'Базовые' NOT NULL,
  "provider" text DEFAULT 'sberbank' NOT NULL,
  "isSeasonal" boolean DEFAULT false NOT NULL,
  "seasonCode" text,
  "isPublished" boolean DEFAULT true NOT NULL,
  "sortOrder" integer DEFAULT 0 NOT NULL,
  "createdByUserId" text REFERENCES "users"("id") ON DELETE SET NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS "announcement_templates_published_sort_idx" ON "announcement_templates" ("isPublished", "sortOrder", "createdAt");
CREATE INDEX IF NOT EXISTS "announcement_templates_pack_idx" ON "announcement_templates" ("pack", "isPublished");
