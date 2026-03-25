ALTER TABLE "users" ALTER COLUMN "passwordHash" SET DEFAULT 'SUPABASE_AUTH';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "passwordHash" DROP NOT NULL;--> statement-breakpoint
UPDATE "users" SET "passwordHash" = 'SUPABASE_AUTH' WHERE "passwordHash" IS NULL;