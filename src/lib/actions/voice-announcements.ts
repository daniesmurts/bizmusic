"use server";

import { db } from "@/db";
import { tracks, voiceAnnouncements, businesses, announcementJingles, brandVoiceModels } from "@/db/schema";
import { generateSpeech, TTSRequest, isProviderConfigured } from "@/lib/tts";
import { uploadFileBuffer, generateUniqueFileName, deleteFile, parseStorageObjectRef } from "@/lib/supabase-storage";
import {
  createAnnouncementDeleteScope,
  isAnnouncementOwnedByBusiness,
} from "@/lib/voice-announcements-security";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import * as mm from "music-metadata";
import {
  consumeBrandVoiceGenerationChars,
  consumeTtsGenerationCredit,
  getBrandVoiceEntitlementStatus,
  getBusinessEntitlementState,
  getTtsEntitlementStatus,
} from "@/lib/tts-entitlements";
import { resolveAccessScope } from "@/lib/auth/scope";
import { ANNOUNCEMENT_TEMPLATES } from "@/lib/announcement-templates";
import { announcementTemplates } from "@/db/schema";
import { asc, desc } from "drizzle-orm";
import { MAX_JINGLE_DURATION_SEC, mixAnnouncementWithJingle } from "@/lib/audio-jingle-mixer";
import { getBrandVoiceProvider } from "@/lib/integrations/brand-voice-provider";

async function resolveAnnouncementScope() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, scope: null, business: null };
  }

  const scope = await resolveAccessScope(user.id);
  const business = scope?.businessId
    ? await db.query.businesses.findFirst({ where: eq(businesses.id, scope.businessId) })
    : null;

  return { user, scope, business };
}

export interface CreateAnnouncementInput {
  text: string;
  ssmlText?: string;
  title: string;
  voiceName: string;
  brandVoiceModelId?: string;
  speakingRate?: number;
  pitch?: number;
  languageCode?: string;
  provider?: "google" | "sberbank";
  jingleId?: string;
}

function estimateTextLengthFromSsml(ssml: string): number {
  return ssml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().length;
}

/**
 * Generate a voice announcement, upload to storage, and save to database
 */
export async function generateVoiceAnnouncementAction(input: CreateAnnouncementInput) {
  try {
    const { user, scope, business } = await resolveAnnouncementScope();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (scope?.isBranchManager) {
      return { success: false, error: "Менеджер филиала не может создавать анонсы" };
    }

    if (!business) {
      return { success: false, error: "Business not found for this user." };
    }

    // Validation
    if (input.text.length === 0) {
      return { success: false, error: "Текст объявления не должен быть пустым." };
    }

    if (input.text.length > 500) {
      return { success: false, error: "Текст объявления не должен превышать 500 символов." };
    }

    const useBrandVoice = Boolean(input.brandVoiceModelId?.trim());
    const hasSsml = !useBrandVoice && Boolean(input.ssmlText && input.ssmlText.trim().length > 0);
    if (hasSsml && (input.provider || "google") !== "google") {
      return { success: false, error: "SSML поддерживается только при использовании Google Cloud TTS" };
    }

    if (hasSsml && (input.ssmlText?.length || 0) > 3000) {
      return { success: false, error: "SSML не должен превышать 3000 символов" };
    }

    const charsForBilling = Math.max(
      1,
      hasSsml ? estimateTextLengthFromSsml(input.ssmlText || "") : input.text.length,
    );

    const entitlement = useBrandVoice
      ? await getBrandVoiceEntitlementStatus(business.id)
      : await getTtsEntitlementStatus(business.id);

    if (!entitlement.canGenerate) {
      return { success: false, error: entitlement.denialReason || "Лимит генераций исчерпан." };
    }

    const entitlementBusiness = await getBusinessEntitlementState(business.id);

    let audioBuffer: Buffer;
    let persistedProvider: string;
    let persistedVoiceName: string;
    let languageCode = input.languageCode || "ru-RU";
    let brandVoiceModelId: string | null = null;

    if (useBrandVoice) {
      const modelId = input.brandVoiceModelId!.trim();
      const model = await db.query.brandVoiceModels.findFirst({
        where: and(
          eq(brandVoiceModels.id, modelId),
          eq(brandVoiceModels.businessId, business.id),
          eq(brandVoiceModels.status, "READY"),
        ),
        with: {
          actor: {
            columns: {
              fullName: true,
              consentAcceptedAt: true,
              consentRevokedAt: true,
            },
          },
        },
      });

      if (!model || !model.providerModelId) {
        return { success: false, error: "Выбранная Brand Voice модель недоступна или не готова" };
      }

      if (!model.actor.consentAcceptedAt || model.actor.consentRevokedAt) {
        return { success: false, error: "У модели нет действующего согласия диктора" };
      }

      try {
        const provider = getBrandVoiceProvider();
        audioBuffer = await provider.synthesize({
          providerModelId: model.providerModelId,
          text: input.text,
          speakingRate: input.speakingRate,
          pitch: input.pitch,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Ошибка синтеза Brand Voice";
        return { success: false, error: msg };
      }

      persistedProvider = "brand_voice";
      persistedVoiceName = `Brand Voice: ${model.actor.fullName}`;
      brandVoiceModelId = model.id;
      languageCode = "ru-RU";
    } else {
      const ttsRequest: TTSRequest = {
        text: input.text,
        ssml: hasSsml ? input.ssmlText : undefined,
        voiceName: input.voiceName,
        languageCode,
        speakingRate: input.speakingRate,
        pitch: input.pitch,
        provider: input.provider || "google",
      };

      audioBuffer = await generateSpeech(ttsRequest);
      persistedProvider = ttsRequest.provider || "google";
      persistedVoiceName = input.voiceName;
      languageCode = ttsRequest.languageCode || "ru-RU";
    }

    let finalAudioBuffer = audioBuffer;

    if (input.jingleId) {
      const selectedJingle = await db.query.announcementJingles.findFirst({
        where: and(
          eq(announcementJingles.id, input.jingleId),
          eq(announcementJingles.isPublished, true)
        ),
      });

      if (!selectedJingle) {
        return { success: false, error: "Выбранный джингл не найден или снят с публикации" };
      }

      if (selectedJingle.duration <= 0) {
        return { success: false, error: "У выбранного джингла некорректная длительность" };
      }

      if (selectedJingle.duration > MAX_JINGLE_DURATION_SEC) {
        return { success: false, error: `Джингл должен быть не длиннее ${MAX_JINGLE_DURATION_SEC} секунд` };
      }

      const jingleResponse = await fetch(selectedJingle.fileUrl);
      if (!jingleResponse.ok) {
        return { success: false, error: "Не удалось загрузить аудио джингла" };
      }

      const jingleBytes = Buffer.from(await jingleResponse.arrayBuffer());
      finalAudioBuffer = await mixAnnouncementWithJingle({
        announcementBuffer: audioBuffer,
        jingleBuffer: jingleBytes,
        position: selectedJingle.position === "outro" ? "outro" : "intro",
        volumeDb: selectedJingle.volumeDb,
      });
    }

    // 2. Calculate duration
    const metadata = await mm.parseBuffer(finalAudioBuffer, "audio/mpeg");
    const duration = Math.round(metadata.format.duration || 0);

    // 3. Upload to Supabase Storage
    const fileName = generateUniqueFileName(`${input.title.replace(/\s+/g, '_')}.mp3`);
    const publicUrl = await uploadFileBuffer(finalAudioBuffer, fileName, "announcements");

    // 4. Save to Database
    const result = await db.transaction(async (tx) => {
      // Create track record
      const [newTrack] = await tx.insert(tracks).values({
        title: input.title,
        artist: "Голосовое объявление",
        fileUrl: publicUrl,
        duration: duration,
        isAnnouncement: true,
        businessId: business.id,
        moodTags: ["announcement"],
      }).returning();

      // Create voice announcement record
      const [newAnnouncement] = await tx.insert(voiceAnnouncements).values({
        businessId: business.id,
        trackId: newTrack.id,
        brandVoiceModelId,
        text: input.text,
        languageCode,
        provider: persistedProvider,
        voiceName: persistedVoiceName,
        speakingRate: input.speakingRate || 1.0,
        pitch: input.pitch || 0.0,
      }).returning();

      if (brandVoiceModelId) {
        await consumeBrandVoiceGenerationChars(tx, {
          business: entitlementBusiness,
          modelId: brandVoiceModelId,
          announcementId: newAnnouncement.id,
          provider: persistedProvider,
          charsCount: charsForBilling,
        });
      } else {
        await consumeTtsGenerationCredit(tx, {
          business: entitlementBusiness,
          announcementId: newAnnouncement.id,
          provider: (persistedProvider === "sberbank" ? "sberbank" : "google"),
          charsCount: charsForBilling,
        });
      }

      return { track: newTrack, announcement: newAnnouncement };
    });

    revalidatePath("/dashboard/announcements");
    revalidatePath("/dashboard/player");

    const nextEntitlement = useBrandVoice
      ? await getBrandVoiceEntitlementStatus(business.id)
      : await getTtsEntitlementStatus(business.id);

    return {
      success: true,
      data: result,
      entitlement: nextEntitlement,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate announcement";
    console.error("Announcement generation error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

export async function getAnnouncementEntitlementStatusAction() {
  try {
    const { user, scope, business } = await resolveAnnouncementScope();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (scope?.isBranchManager) {
      return { success: false, error: "Недостаточно прав" };
    }

    if (!business) {
      return { success: false, error: "Business not found" };
    }

    const data = await getTtsEntitlementStatus(business.id);
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load TTS status";
    return { success: false, error: message };
  }
}

/**
 * Get all announcements for the current business
 */
export async function getAnnouncementsAction() {
  try {
    const { user, business } = await resolveAnnouncementScope();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!business) {
      return { success: false, error: "Business not found" };
    }

    const announcements = await db.query.voiceAnnouncements.findMany({
      where: eq(voiceAnnouncements.businessId, business.id),
      with: {
        track: true,
      },
      orderBy: (va, { desc }) => [desc(va.createdAt)],
    });

    return {
      success: true,
      data: announcements,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch announcements";
    console.error("Get announcements error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Delete an announcement and its associated track/file
 */
export async function deleteAnnouncementAction(announcementId: string) {
  try {
    const { user, scope, business } = await resolveAnnouncementScope();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    if (scope?.isBranchManager) {
      return { success: false, error: "Менеджер филиала не может удалять анонсы" };
    }

    if (!business) {
      return { success: false, error: "Business not found for this user." };
    }

    const deleteScope = createAnnouncementDeleteScope(announcementId, business.id);

    const announcement = await db.query.voiceAnnouncements.findFirst({
      where: and(
        eq(voiceAnnouncements.id, deleteScope.announcementId),
        eq(voiceAnnouncements.businessId, deleteScope.businessId)
      ),
      with: {
        track: true,
      },
    });

    if (!announcement) {
      return { success: false, error: "Announcement not found" };
    }

    if (!isAnnouncementOwnedByBusiness(announcement.businessId, deleteScope.businessId)) {
      return { success: false, error: "Forbidden" };
    }

    const isImportedPlatformAnnouncement = Boolean(announcement.platformAnnouncementId);

    // 1. Delete file from storage only for business-owned originals.
    if (!isImportedPlatformAnnouncement && announcement.track.fileUrl) {
      const ref = parseStorageObjectRef(announcement.track.fileUrl, "announcements");
      if (ref.fileName) {
        try {
          await deleteFile(ref.fileName, ref.folder);
        } catch (err) {
          console.warn("Failed to delete announcement file from storage:", err);
        }
      }
    }

    // 2. Delete from database (cascade will handle voice_announcements)
    await db.delete(tracks).where(eq(tracks.id, announcement.trackId));

    revalidatePath("/dashboard/announcements");
    revalidatePath("/dashboard/player");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete announcement";
    console.error("Delete announcement error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get the configuration status of TTS providers
 */
export async function getTtsProvidersStatusAction() {
  try {
    return {
      success: true,
      data: {
        google: await isProviderConfigured("google"),
        sberbank: await isProviderConfigured("sberbank"),
      }
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch TTS provider status",
    };
  }
}

/**
 * Return built-in announcement templates grouped by seasonal/business packs.
 */
export async function getAnnouncementTemplatesAction() {
  try {
    const { user } = await resolveAnnouncementScope();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const dbTemplates = await db.query.announcementTemplates.findMany({
      where: eq(announcementTemplates.isPublished, true),
      orderBy: [asc(announcementTemplates.sortOrder), desc(announcementTemplates.createdAt)],
    });

    if (dbTemplates.length > 0) {
      return {
        success: true,
        data: dbTemplates.map((t) => ({
          id: t.id,
          pack: t.pack,
          packLabel: t.packLabel,
          name: t.name,
          title: t.title,
          text: t.text,
          provider: t.provider === "google" ? "google" : "sberbank",
        })),
      };
    }

    return {
      success: true,
      data: ANNOUNCEMENT_TEMPLATES,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load announcement templates",
    };
  }
}

// Rate limit: track preview timestamps per business
const previewRateLimitMap = new Map<string, number[]>();
const PREVIEW_LIMIT = 3;
const PREVIEW_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a TTS preview without consuming credits or saving to storage.
 * Returns base64-encoded audio for inline playback.
 * Rate limited to 3 previews per hour per business.
 */
export async function previewVoiceAnnouncementAction(input: {
  text: string;
  ssmlText?: string;
  voiceName: string;
  speakingRate?: number;
  pitch?: number;
  languageCode?: string;
  provider?: "google" | "sberbank";
}) {
  try {
    const { user, scope, business } = await resolveAnnouncementScope();

    if (!user) return { success: false, error: "Unauthorized" };
    if (scope?.isBranchManager) return { success: false, error: "Менеджер филиала не может создавать превью" };
    if (!business) return { success: false, error: "Business not found" };

    if (!input.text || input.text.length === 0) {
      return { success: false, error: "Текст не должен быть пустым." };
    }
    if (input.text.length > 500) {
      return { success: false, error: "Текст не должен превышать 500 символов." };
    }

    const hasSsml = Boolean(input.ssmlText && input.ssmlText.trim().length > 0);
    if (hasSsml && (input.provider || "google") !== "google") {
      return { success: false, error: "SSML поддерживается только для Google Cloud TTS" };
    }

    if (hasSsml && (input.ssmlText?.length || 0) > 3000) {
      return { success: false, error: "SSML не должен превышать 3000 символов" };
    }

    // Rate limiting
    const now = Date.now();
    const key = business.id;
    const timestamps = previewRateLimitMap.get(key) ?? [];
    const recent = timestamps.filter((t) => now - t < PREVIEW_WINDOW_MS);

    if (recent.length >= PREVIEW_LIMIT) {
      return { success: false, error: `Лимит превью: ${PREVIEW_LIMIT} в час. Попробуйте позже.` };
    }

    const ttsRequest: TTSRequest = {
      text: input.text,
      ssml: hasSsml ? input.ssmlText : undefined,
      voiceName: input.voiceName,
      languageCode: input.languageCode || "ru-RU",
      speakingRate: input.speakingRate,
      pitch: input.pitch,
      provider: input.provider || "google",
    };

    const audioBuffer = await generateSpeech(ttsRequest);

    // Update rate limit
    recent.push(now);
    previewRateLimitMap.set(key, recent);

    // Return base64 audio for inline playback
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return {
      success: true,
      data: {
        audioBase64: base64Audio,
        mimeType: "audio/mpeg",
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка генерации превью";
    console.error("Preview generation error:", error);
    return { success: false, error: message };
  }
}
