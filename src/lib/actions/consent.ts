"use server";

import { db } from "@/db";
import { brandVoiceModels, businesses, voiceActors } from "@/db/schema";
import { issueBrandVoiceUploadSessionToken } from "@/lib/brand-voice-upload-token";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";

/**
 * Публичное действие — не требует авторизации.
 * Принимает подтверждение или отказ от диктора по одноразовому токену.
 */
export async function acceptVoiceActorConsentByTokenAction(
  token: string,
  accepted: boolean,
): Promise<
  { success: true; actorId: string; uploadSessionToken?: string }
  | { success: false; error: string }
> {
  const rawToken = token?.trim();
  if (!rawToken || rawToken.length < 30) {
    return { success: false, error: "Недействительная ссылка" };
  }

  const actor = await db.query.voiceActors.findFirst({
    where: eq(voiceActors.consentToken, rawToken),
    columns: {
      id: true,
      consentToken: true,
      consentTokenExpiresAt: true,
      consentAcceptedAt: true,
      consentRevokedAt: true,
    },
  });

  if (!actor) {
    return { success: false, error: "Ссылка недействительна или уже использована" };
  }

  if (actor.consentTokenExpiresAt && actor.consentTokenExpiresAt < new Date()) {
    return { success: false, error: "Срок действия ссылки истёк. Попросите компанию выслать новое приглашение." };
  }

  // Извлекаем IP и User-Agent из входящего запроса
  const requestHeaders = await headers();
  const ipAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    requestHeaders.get("x-real-ip") ??
    null;
  const userAgent = requestHeaders.get("user-agent") ?? null;
  const now = new Date();

  await db
    .update(voiceActors)
    .set({
      consentAcceptedAt: accepted ? now : null,
      consentRevokedAt: accepted ? null : now,
      consentIpAddress: ipAddress,
      consentUserAgent: userAgent,
      // Одноразово — инвалидируем токен после использования
      consentToken: null,
      consentTokenExpiresAt: null,
    })
    .where(eq(voiceActors.id, actor.id));

  // Если согласие принято — перевести CONSENT_PENDING модели в SAMPLES_PENDING
  if (accepted) {
    await db
      .update(brandVoiceModels)
      .set({ status: "SAMPLES_PENDING" })
      .where(
        and(
          eq(brandVoiceModels.actorId, actor.id),
          eq(brandVoiceModels.status, "CONSENT_PENDING"),
        ),
      );
  }

  return {
    success: true,
    actorId: actor.id,
    uploadSessionToken: accepted ? issueBrandVoiceUploadSessionToken(actor.id) : undefined,
  };
}

/**
 * Публичный поиск диктора по токену — без раскрытия чувствительных данных.
 */
export async function getActorByConsentTokenAction(token: string) {
  const rawToken = token?.trim();
  if (!rawToken || rawToken.length < 30) {
    return { success: false as const, error: "Недействительная ссылка" };
  }

  const actor = await db.query.voiceActors.findFirst({
    where: eq(voiceActors.consentToken, rawToken),
    columns: {
      id: true,
      fullName: true,
      email: true,
      consentTokenExpiresAt: true,
      consentAcceptedAt: true,
      consentRevokedAt: true,
      businessId: true,
    },
  });

  if (!actor) {
    return { success: false as const, error: "Ссылка недействительна или уже использована" };
  }

  if (actor.consentTokenExpiresAt && actor.consentTokenExpiresAt < new Date()) {
    return { success: false as const, error: "Срок действия ссылки истёк" };
  }

  // Получаем название компании для отображения
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, actor.businessId),
    columns: { legalName: true },
  });

  return {
    success: true as const,
    data: {
      actorId: actor.id,
      fullName: actor.fullName,
      email: actor.email,
      companyName: business?.legalName ?? "Бизнес Музыка",
      alreadyConsented: Boolean(actor.consentAcceptedAt && !actor.consentRevokedAt),
    },
  };
}
