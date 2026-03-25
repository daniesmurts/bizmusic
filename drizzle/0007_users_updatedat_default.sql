UPDATE "users" SET "updatedAt" = now() WHERE "updatedAt" IS NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updatedAt" SET DEFAULT now();