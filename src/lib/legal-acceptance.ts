import { db } from "@/db";
import { legalAcceptanceEvents, users } from "@/db/schema";
import { eq } from "drizzle-orm";

type UserMetadata = Record<string, unknown>;

interface SyncLegalAcceptanceInput {
  userId: string;
  email: string;
  metadata?: UserMetadata;
  source: string;
  ipAddress?: string;
  userAgent?: string;
}

function parseAcceptedAt(metadata?: UserMetadata): Date | null {
  if (!metadata) return null;

  const raw = metadata.terms_accepted_at ?? metadata.termsAcceptedAt;
  if (typeof raw !== "string") return null;

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseTermsAccepted(metadata?: UserMetadata): boolean {
  if (!metadata) return false;
  return metadata.terms_accepted === true || metadata.termsAccepted === true;
}

function parseUserType(metadata?: UserMetadata): "BUSINESS" | "CREATOR" {
  return metadata?.user_type === "CREATOR" ? "CREATOR" : "BUSINESS";
}

export async function syncUserAndLegalAcceptance(input: SyncLegalAcceptanceInput) {
  const termsAccepted = parseTermsAccepted(input.metadata);
  const acceptedAt = parseAcceptedAt(input.metadata);
  const phone = typeof input.metadata?.phone === "string" ? input.metadata.phone : null;

  const existing = await db.query.users.findFirst({
    where: eq(users.id, input.userId),
  });

  if (!existing) {
    await db.insert(users).values({
      id: input.userId,
      email: input.email,
      passwordHash: "SUPABASE_AUTH",
      role: "BUSINESS_OWNER",
      userType: parseUserType(input.metadata),
      phone,
      termsAccepted,
      termsAcceptedAt: acceptedAt,
    });
  } else {
    await db.update(users)
      .set({
        email: input.email,
        userType: parseUserType(input.metadata),
        phone,
        termsAccepted: existing.termsAccepted || termsAccepted,
        termsAcceptedAt: existing.termsAcceptedAt || acceptedAt,
      })
      .where(eq(users.id, input.userId));
  }

  const shouldWriteAcceptanceEvent = termsAccepted && !existing?.termsAccepted;
  if (shouldWriteAcceptanceEvent) {
    await db.insert(legalAcceptanceEvents).values({
      userId: input.userId,
      acceptedAt: acceptedAt || new Date(),
      source: input.source,
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent || null,
      termsVersion: "2026-03-25",
    });
  }
}
