"use server";

import { db } from "@/db";
import {
  brandVoiceModels,
  businesses,
  voiceActors,
  voiceSamples,
} from "@/db/schema";
import { resolveAccessScope } from "@/lib/auth/scope";
import { sendEmail } from "@/lib/email";
import {
  BrandVoiceModelStatus,
  getBrandVoiceProvider,
} from "@/lib/integrations/brand-voice-provider";
import {
  generateUniqueFileName,
  getDownloadSignedUrl,
  getUploadSignedUrl,
  MAX_FILE_SIZE,
  parseStorageObjectRef,
} from "@/lib/supabase-storage";
import { createClient } from "@/utils/supabase/server";
import { and, desc, eq } from "drizzle-orm";
import * as mm from "music-metadata";

interface BrandVoiceScope {
  businessId: string;
  isBranchManager: boolean;
}

const BRAND_VOICE_ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/ogg",
  "audio/flac",
];

async function resolveBrandVoiceScope(): Promise<BrandVoiceScope | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const scope = await resolveAccessScope(user.id);
  if (!scope?.businessId) {
    return null;
  }

  return {
    businessId: scope.businessId,
    isBranchManager: Boolean(scope.isBranchManager),
  };
}

async function estimateDurationFromStoragePath(fileUrl: string, mimeType?: string): Promise<number | null> {
  try {
    const objectRef = parseStorageObjectRef(fileUrl, "brand-voice-samples");
    const signedUrl = await getDownloadSignedUrl(
      objectRef.fileName,
      objectRef.folder,
      15 * 60,
    );

    const response = await fetch(signedUrl, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const metadata = await mm.parseBuffer(buffer, mimeType || "audio/mpeg");
    const seconds = Math.round(metadata.format.duration || 0);
    return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
  } catch {
    return null;
  }
}

export interface CreateVoiceActorInput {
  fullName: string;
  email: string;
  phone?: string;
  role: "employee" | "external" | "owner";
}

export async function createVoiceActorAction(input: CreateVoiceActorInput) {
  const scope = await resolveBrandVoiceScope();
  if (!scope) {
    return { success: false, error: "Unauthorized" };
  }

  if (scope.isBranchManager) {
    return { success: false, error: "Менеджер филиала не может управлять Brand Voice" };
  }

  const normalizedName = input.fullName.trim();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (!normalizedName) {
    return { success: false, error: "Укажите ФИО диктора" };
  }

  if (!normalizedEmail) {
    return { success: false, error: "Укажите email диктора" };
  }

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, scope.businessId),
    columns: { legalName: true },
  });

  const token = crypto.randomUUID().replace(/-/g, "");
  const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней

  const [actor] = await db
    .insert(voiceActors)
    .values({
      businessId: scope.businessId,
      fullName: normalizedName,
      email: normalizedEmail,
      phone: input.phone?.trim() || null,
      role: input.role,
      consentToken: token,
      consentTokenExpiresAt: tokenExpiresAt,
    })
    .returning();

  // Отправляем приглашение на подпись согласия асинхронно (не блокируем ответ)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizmuzik.ru";
  const consentUrl = `${appUrl}/consent/${token}`;
  const companyName = business?.legalName ?? "Бизнес Музыка";

  sendEmail({
    to: normalizedEmail,
    subject: `Согласие на создание голосовой модели — ${companyName}`,
    html: buildConsentInviteEmail(normalizedName, companyName, consentUrl, tokenExpiresAt),
  }).catch((err) => console.error("[BrandVoice] Failed to send consent invite:", err));

  // Возвращаем без consentToken (не нужен клиенту)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { consentToken: _consentToken, consentTokenExpiresAt, ...safeActor } = actor;
  return { success: true, data: { ...safeActor, consentTokenExpiresAt } };
}

export async function resendConsentInviteAction(actorId: string) {
  const scope = await resolveBrandVoiceScope();
  if (!scope) {
    return { success: false, error: "Unauthorized" };
  }

  if (scope.isBranchManager) {
    return { success: false, error: "Менеджер филиала не может управлять Brand Voice" };
  }

  const actor = await db.query.voiceActors.findFirst({
    where: and(eq(voiceActors.id, actorId), eq(voiceActors.businessId, scope.businessId)),
  });

  if (!actor) {
    return { success: false, error: "Диктор не найден" };
  }

  if (actor.consentAcceptedAt && !actor.consentRevokedAt) {
    return { success: false, error: "Диктор уже дал согласие" };
  }

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, scope.businessId),
    columns: { legalName: true },
  });

  const token = crypto.randomUUID().replace(/-/g, "");
  const tokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db
    .update(voiceActors)
    .set({ consentToken: token, consentTokenExpiresAt: tokenExpiresAt })
    .where(eq(voiceActors.id, actor.id));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizmuzik.ru";
  const consentUrl = `${appUrl}/consent/${token}`;
  const companyName = business?.legalName ?? "Бизнес Музыка";

  await sendEmail({
    to: actor.email,
    subject: `Согласие на создание голосовой модели — ${companyName}`,
    html: buildConsentInviteEmail(actor.fullName, companyName, consentUrl, tokenExpiresAt),
  });

  return { success: true };
}

export interface CreateBrandVoiceModelDraftInput {
  actorId: string;
  subscriptionTier: "starter" | "business" | "enterprise";
  monthlyCharsLimit: number;
}

export async function createBrandVoiceModelDraftAction(input: CreateBrandVoiceModelDraftInput) {
  const scope = await resolveBrandVoiceScope();
  if (!scope) {
    return { success: false, error: "Unauthorized" };
  }

  if (scope.isBranchManager) {
    return { success: false, error: "Менеджер филиала не может создавать модель" };
  }

  const actor = await db.query.voiceActors.findFirst({
    where: and(eq(voiceActors.id, input.actorId), eq(voiceActors.businessId, scope.businessId)),
  });

  if (!actor) {
    return { success: false, error: "Диктор не найден" };
  }

  const [model] = await db
    .insert(brandVoiceModels)
    .values({
      businessId: scope.businessId,
      actorId: actor.id,
      status: actor.consentAcceptedAt ? "SAMPLES_PENDING" : "CONSENT_PENDING",
      subscriptionTier: input.subscriptionTier,
      monthlyCharsLimit: Math.max(0, Math.floor(input.monthlyCharsLimit)),
    })
    .returning();

  return { success: true, data: model };
}

export interface CreateBrandVoiceSampleUploadUrlInput {
  modelId: string;
  actorId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export async function createBrandVoiceSampleUploadUrlAction(input: CreateBrandVoiceSampleUploadUrlInput) {
  const scope = await resolveBrandVoiceScope();
  if (!scope) {
    return { success: false, error: "Unauthorized" };
  }

  const fileName = input.fileName?.trim();
  if (!fileName) {
    return { success: false, error: "Имя файла обязательно" };
  }

  if (!Number.isFinite(input.fileSize) || input.fileSize <= 0) {
    return { success: false, error: "Некорректный размер файла" };
  }

  if (input.fileSize > MAX_FILE_SIZE) {
    return { success: false, error: "Файл слишком большой. Максимум 100MB" };
  }

  if (!BRAND_VOICE_ALLOWED_MIME_TYPES.includes(input.fileType)) {
    return { success: false, error: "Поддерживаются только MP3/WAV/OGG/FLAC" };
  }

  const model = await db.query.brandVoiceModels.findFirst({
    where: and(eq(brandVoiceModels.id, input.modelId), eq(brandVoiceModels.businessId, scope.businessId)),
  });

  if (!model) {
    return { success: false, error: "Модель не найдена" };
  }

  const actor = await db.query.voiceActors.findFirst({
    where: and(eq(voiceActors.id, input.actorId), eq(voiceActors.businessId, scope.businessId)),
  });

  if (!actor) {
    return { success: false, error: "Диктор не найден" };
  }

  const safeFileName = generateUniqueFileName(fileName);
  const folder = `brand-voice-samples/${scope.businessId}/${model.id}`;
  const { uploadUrl, objectPath } = await getUploadSignedUrl(safeFileName, folder, input.fileType);

  return {
    success: true,
    data: {
      uploadUrl,
      objectPath,
      storedFileName: safeFileName,
      folder,
    },
  };
}

export interface AddVoiceSampleMetadataInput {
  actorId: string;
  modelId: string;
  fileUrl: string;
  fileName: string;
  fileSizeBytes?: number;
  mimeType?: string;
  durationSeconds?: number;
}

export async function addVoiceSampleMetadataAction(input: AddVoiceSampleMetadataInput) {
  const scope = await resolveBrandVoiceScope();
  if (!scope) {
    return { success: false, error: "Unauthorized" };
  }

  const model = await db.query.brandVoiceModels.findFirst({
    where: and(eq(brandVoiceModels.id, input.modelId), eq(brandVoiceModels.businessId, scope.businessId)),
  });

  if (!model) {
    return { success: false, error: "Модель не найдена" };
  }

  const actor = await db.query.voiceActors.findFirst({
    where: and(eq(voiceActors.id, input.actorId), eq(voiceActors.businessId, scope.businessId)),
  });

  if (!actor) {
    return { success: false, error: "Диктор не найден" };
  }

  const objectPath = input.fileUrl?.trim();
  const expectedPrefix = `brand-voice-samples/${scope.businessId}/${model.id}/`;
  if (!objectPath || !objectPath.startsWith(expectedPrefix)) {
    return { success: false, error: "Некорректный путь к файлу образца" };
  }

  const estimatedDuration = await estimateDurationFromStoragePath(objectPath, input.mimeType);
  const normalizedDuration = Math.max(0, input.durationSeconds ?? estimatedDuration ?? 0);

  const [sample] = await db
    .insert(voiceSamples)
    .values({
      actorId: actor.id,
      modelId: model.id,
      fileUrl: objectPath,
      fileName: input.fileName,
      fileSizeBytes: input.fileSizeBytes,
      mimeType: input.mimeType,
      durationSeconds: normalizedDuration || null,
    })
    .returning();

  const secondsToAdd = normalizedDuration;
  await db
    .update(brandVoiceModels)
    .set({
      samplesUploadedSeconds: model.samplesUploadedSeconds + secondsToAdd,
      status: model.status === "CONSENT_PENDING" ? "CONSENT_PENDING" : "SAMPLES_PENDING",
    })
    .where(eq(brandVoiceModels.id, model.id));

  return { success: true, data: sample };
}

export async function startBrandVoiceTrainingAction(modelId: string) {
  const scope = await resolveBrandVoiceScope();
  if (!scope) {
    return { success: false, error: "Unauthorized" };
  }

  if (scope.isBranchManager) {
    return { success: false, error: "Менеджер филиала не может запускать обучение" };
  }

  const model = await db.query.brandVoiceModels.findFirst({
    where: and(eq(brandVoiceModels.id, modelId), eq(brandVoiceModels.businessId, scope.businessId)),
    with: {
      actor: true,
      samples: true,
    },
  });

  if (!model) {
    return { success: false, error: "Модель не найдена" };
  }

  if (!model.actor.consentAcceptedAt || model.actor.consentRevokedAt) {
    return { success: false, error: "Нет действующего согласия диктора" };
  }

  if (model.samples.length === 0) {
    return { success: false, error: "Загрузите образцы голоса перед запуском" };
  }

  const provider = getBrandVoiceProvider();
  const result = await provider.createModel({
    modelId: model.id,
    businessId: scope.businessId,
    actorFullName: model.actor.fullName,
    sampleUrls: model.samples.map((sample) => sample.fileUrl),
  });

  const [updated] = await db
    .update(brandVoiceModels)
    .set({
      status: "TRAINING",
      providerModelId: result.providerModelId,
      providerJobId: result.providerJobId,
      consentCheckedAt: new Date(),
      trainingStartedAt: new Date(),
      estimatedCompletionAt: result.estimatedCompletionAt ?? null,
      errorMessage: null,
    })
    .where(eq(brandVoiceModels.id, model.id))
    .returning();

  return { success: true, data: updated };
}

export async function syncBrandVoiceModelStatusAction(modelId: string) {
  const scope = await resolveBrandVoiceScope();
  if (!scope) {
    return { success: false, error: "Unauthorized" };
  }

  const model = await db.query.brandVoiceModels.findFirst({
    where: and(eq(brandVoiceModels.id, modelId), eq(brandVoiceModels.businessId, scope.businessId)),
  });

  if (!model || !model.providerModelId) {
    return { success: false, error: "Модель не найдена или не отправлена провайдеру" };
  }

  const provider = getBrandVoiceProvider();
  const status = await provider.getModelStatus(model.providerModelId);
  const nextStatus: BrandVoiceModelStatus = status.status;

  const [updated] = await db
    .update(brandVoiceModels)
    .set({
      status: nextStatus,
      estimatedCompletionAt: status.estimatedCompletionAt ?? model.estimatedCompletionAt,
      trainingCompletedAt: nextStatus === "READY" ? new Date() : model.trainingCompletedAt,
      errorMessage: status.errorMessage ?? null,
    })
    .where(eq(brandVoiceModels.id, model.id))
    .returning();

  return { success: true, data: updated };
}

export async function markVoiceActorConsentAction(actorId: string, accepted: boolean) {
  const scope = await resolveBrandVoiceScope();
  if (!scope) {
    return { success: false, error: "Unauthorized" };
  }

  const actor = await db.query.voiceActors.findFirst({
    where: and(eq(voiceActors.id, actorId), eq(voiceActors.businessId, scope.businessId)),
  });

  if (!actor) {
    return { success: false, error: "Диктор не найден" };
  }

  const [updated] = await db
    .update(voiceActors)
    .set({
      consentAcceptedAt: accepted ? new Date() : null,
      consentRevokedAt: accepted ? null : new Date(),
      // Invalidate token on any consent change
      consentToken: null,
      consentTokenExpiresAt: null,
    })
    .where(eq(voiceActors.id, actor.id))
    .returning();

  // Если согласие получено — перевести CONSENT_PENDING модели в SAMPLES_PENDING
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

  return { success: true, data: updated };
}

export async function getBrandVoiceOverviewAction() {
  const scope = await resolveBrandVoiceScope();
  if (!scope) {
    return { success: false, error: "Unauthorized" };
  }

  const [business, models] = await Promise.all([
    db.query.businesses.findFirst({
      where: eq(businesses.id, scope.businessId),
      columns: {
        id: true,
        brandVoiceMonthlyUsed: true,
        brandVoiceOverageCharsPurchased: true,
        brandVoiceMonthlyPeriodStart: true,
        brandVoiceMonthlyPeriodEnd: true,
      },
    }),
    db.query.brandVoiceModels.findMany({
      where: eq(brandVoiceModels.businessId, scope.businessId),
      with: {
        actor: {
          columns: {
            id: true,
            businessId: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            consentDocumentUrl: true,
            consentVersion: true,
            consentAcceptedAt: true,
            consentIpAddress: true,
            consentUserAgent: true,
            consentRevokedAt: true,
            consentTokenExpiresAt: true,
            // consentToken intentionally excluded
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: [desc(brandVoiceModels.createdAt)],
    }),
  ]);

  if (!business) {
    return { success: false, error: "Business not found" };
  }

  return {
    success: true,
    data: {
      providerMode: process.env.BRAND_VOICE_PROVIDER_MODE || "mock",
      business,
      models,
    },
  };
}

// ---------------------------------------------------------------------------
// Email helpers (private)
// ---------------------------------------------------------------------------

function buildConsentInviteEmail(
  actorName: string,
  companyName: string,
  consentUrl: string,
  expiresAt: Date,
): string {
  const expiryFormatted = expiresAt.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Согласие на создание голосовой модели</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- Шапка -->
          <tr>
            <td style="background:#0f172a;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;text-transform:uppercase;">
                Бизнес <span style="color:#10b981;">Музыка</span>
              </p>
              <p style="margin:8px 0 0;font-size:13px;color:#94a3b8;letter-spacing:0.5px;">
                Платформа лицензионной музыки для бизнеса
              </p>
            </td>
          </tr>

          <!-- Контент -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;">
                Запрос на согласие
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">
                Здравствуйте, <strong>${escapeHtml(actorName)}</strong>!
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
                Компания <strong>${escapeHtml(companyName)}</strong> запрашивает ваше согласие
                на <strong>создание персональной голосовой модели на основе ваших аудиозаписей</strong>
                в системе Бизнес Музыка.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.6;">
                Голосовая модель будет использоваться исключительно для генерации
                аудиообъявлений в точках продаж компании.
              </p>

              <!-- Детали -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f1f5f9;border-radius:12px;padding:20px;margin-bottom:32px;">
                <tr>
                  <td style="font-size:13px;color:#64748b;padding-bottom:8px;">Компания</td>
                  <td style="font-size:14px;font-weight:600;color:#0f172a;text-align:right;">${escapeHtml(companyName)}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#64748b;padding-bottom:8px;">Получатель</td>
                  <td style="font-size:14px;font-weight:600;color:#0f172a;text-align:right;">${escapeHtml(actorName)}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#64748b;">Ссылка действительна до</td>
                  <td style="font-size:14px;font-weight:600;color:#0f172a;text-align:right;">${expiryFormatted}</td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${consentUrl}"
                      style="display:inline-block;background:#10b981;color:#ffffff;font-size:16px;font-weight:700;
                             text-decoration:none;padding:16px 40px;border-radius:12px;letter-spacing:0.2px;">
                      Ознакомиться и подписать →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center;">
                Если кнопка не работает, скопируйте ссылку в браузер:
              </p>
              <p style="margin:0;font-size:12px;color:#6366f1;text-align:center;word-break:break-all;">
                ${consentUrl}
              </p>
            </td>
          </tr>

          <!-- Подвал -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                Вы получили это письмо, потому что вас указали как диктора в системе Бизнес Музыка.<br />
                Если вы не ожидали этого письма, просто проигнорируйте его.
              </p>
              <p style="margin:8px 0 0;font-size:12px;color:#cbd5e1;">
                © 2026 Бизнес Музыка. Все права защищены.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
