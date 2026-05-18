ALTER TABLE "users" ALTER COLUMN "passwordHash" SET DEFAULT 'CLERK_AUTH';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "clerkId" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_clerkId_unique" UNIQUE("clerkId");