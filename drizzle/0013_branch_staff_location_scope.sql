ALTER TABLE "users" ADD COLUMN "assignedLocationId" text;
CREATE INDEX "idx_users_assigned_location" ON "users" USING btree ("assignedLocationId");