"use server";

/**
 * Публичные server actions для загрузки образцов голоса диктором
 * со страницы согласия — не требуют авторизации бизнеса.
 */

import { db } from "@/db";
import { voiceActors, voiceSamples, brandVoiceModels } from "@/db/schema";
import { verifyBrandVoiceUploadSessionToken } from "@/lib/brand-voice-upload-token";
import { and, eq } from "drizzle-orm";
import { generateUniqueFileName, getUploadSignedUrl, MAX_FILE_SIZE } from "@/lib/supabase-storage";

const ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/ogg",
  "audio/flac",
];

export interface PublicSampleUploadUrlInput {
  actorId: string;
  uploadSessionToken: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export async function createPublicVoiceSampleUploadUrlAction(input: PublicSampleUploadUrlInput) {
  const actorId = input.actorId?.trim();
  if (!actorId || actorId.length < 10) {
    return { success: false, error: "Недействительный идентификатор диктора" };
  }

  const tokenCheck = verifyBrandVoiceUploadSessionToken(input.uploadSessionToken ?? "", actorId);
  if (!tokenCheck.valid) {
    return { success: false, error: tokenCheck.error };
  }

  const actor = await db.query.voiceActors.findFirst({
    where: eq(voiceActors.id, actorId),
    columns: { id: true, businessId: true, consentAcceptedAt: true, consentRevokedAt: true },
  });

  if (!actor) {
    return { success: false, error: "Диктор не найден" };
  }

  if (!actor.consentAcceptedAt || actor.consentRevokedAt) {
    return { success: false, error: "Согласие не принято или отозвано" };
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

  if (!ALLOWED_MIME_TYPES.includes(input.fileType)) {
    return { success: false, error: "Поддерживаются только MP3/WAV/OGG/FLAC" };
  }

  // Найдём модель, привязанную к этому диктору
  const model = await db.query.brandVoiceModels.findFirst({
    where: and(
      eq(brandVoiceModels.actorId, actorId),
      eq(brandVoiceModels.businessId, actor.businessId),
    ),
    columns: { id: true },
    orderBy: (m, { desc }) => [desc(m.createdAt)],
  });

  if (!model) {
    return { success: false, error: "Голосовая модель не найдена" };
  }

  const safeFileName = generateUniqueFileName(fileName);
  const folder = `brand-voice-samples/${actor.businessId}/${model.id}`;
  const { uploadUrl, objectPath } = await getUploadSignedUrl(safeFileName, folder, input.fileType);

  return {
    success: true,
    data: {
      uploadUrl,
      objectPath,
      storedFileName: safeFileName,
      actorId,
      modelId: model.id,
    },
  };
}

export interface AddPublicSampleMetadataInput {
  actorId: string;
  uploadSessionToken: string;
  modelId: string;
  objectPath: string;
  fileName: string;
  fileSizeBytes?: number;
  mimeType?: string;
  durationSeconds?: number;
}

export async function addPublicVoiceSampleMetadataAction(input: AddPublicSampleMetadataInput) {
  const actorId = input.actorId?.trim();
  if (!actorId || actorId.length < 10) {
    return { success: false, error: "Недействительный идентификатор диктора" };
  }

  const tokenCheck = verifyBrandVoiceUploadSessionToken(input.uploadSessionToken ?? "", actorId);
  if (!tokenCheck.valid) {
    return { success: false, error: tokenCheck.error };
  }

  const actor = await db.query.voiceActors.findFirst({
    where: eq(voiceActors.id, actorId),
    columns: { id: true, businessId: true, consentAcceptedAt: true, consentRevokedAt: true },
  });

  if (!actor || !actor.consentAcceptedAt || actor.consentRevokedAt) {
    return { success: false, error: "Нет активного согласия" };
  }

  // Проверяем, что модель принадлежит этому диктору
  const model = await db.query.brandVoiceModels.findFirst({
    where: and(
      eq(brandVoiceModels.id, input.modelId),
      eq(brandVoiceModels.actorId, actorId),
    ),
    columns: { id: true },
  });

  if (!model) {
    return { success: false, error: "Модель не найдена" };
  }

  const objectPath = input.objectPath?.trim();
  if (!objectPath || !objectPath.includes("/")) {
    return { success: false, error: "Некорректный путь к файлу" };
  }

  const expectedPrefix = `brand-voice-samples/${actor.businessId}/${input.modelId}/`;
  if (!objectPath.startsWith(expectedPrefix)) {
    return { success: false, error: "Путь к файлу не соответствует модели" };
  }

  await db.insert(voiceSamples).values({
    actorId,
    modelId: input.modelId,
    fileUrl: objectPath,
    fileName: input.fileName,
    fileSizeBytes: input.fileSizeBytes ?? null,
    mimeType: input.mimeType ?? null,
    durationSeconds: input.durationSeconds ?? null,
    approvalStatus: "PENDING",
  });

  return { success: true };
}
