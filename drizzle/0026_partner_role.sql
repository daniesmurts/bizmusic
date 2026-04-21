-- Add PARTNER value to the role enum
-- PostgreSQL requires ALTER TYPE to add enum values
ALTER TYPE "role" ADD VALUE IF NOT EXISTS 'PARTNER';
