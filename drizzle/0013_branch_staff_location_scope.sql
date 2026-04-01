ALTER TABLE "users" ADD COLUMN "assignedLocationId" text;--> statement-breakpoint
CREATE INDEX "idx_users_assigned_location" ON "users" USING btree ("assignedLocationId");