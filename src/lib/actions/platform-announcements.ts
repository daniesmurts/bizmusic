"use server";

import * as mm from "music-metadata";
import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  businessAnnouncementAcquisitions,
  businesses,
  platformAnnouncementProducts,
  tracks,
  users,
  voiceAnnouncements,
} from "@/db/schema";
import { generateSpeech, type TTSRequest } from "@/lib/tts";
import {
  deleteFile,
  generateUniqueFileName,
  getDownloadSignedUrl,
  getFilePublicUrl,
  parseStorageObjectRef,
  uploadFileBuffer,
} from "@/lib/supabase-storage";
import { createClient } from "@/utils/supabase/server";

type AccessModel = "FREE" | "PAID";
type SourceType = "UPLOAD" | "TTS";

type PlatformAnnouncementProductWithTrack = typeof platformAnnouncementProducts.$inferSelect & {
  track: typeof tracks.$inferSelect;
};

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { id: true, role: true },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  return dbUser;
}

async function getCurrentBusiness() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.userId, user.id),
  });

  return business ?? null;
}

async function resolveTrackUrls(track: typeof tracks.$inferSelect) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isFullUrl = track.fileUrl.startsWith("http");
  const fileRef = parseStorageObjectRef(track.fileUrl, "announcements");
  const fallbackUrl = isFullUrl || !supabaseUrl
    ? track.fileUrl
    : getFilePublicUrl(fileRef.fileName, fileRef.folder);

  try {
    const streamUrl = await getDownloadSignedUrl(fileRef.fileName, fileRef.folder, 3600);
    return {
      ...track,
      fileUrl: fallbackUrl,
      streamUrl,
    };
  } catch {
    return {
      ...track,
      fileUrl: fallbackUrl,
    };
  }
}

async function getPlatformProductById(platformAnnouncementId: string) {
  return db.query.platformAnnouncementProducts.findFirst({
    where: eq(platformAnnouncementProducts.id, platformAnnouncementId),
    with: { track: true },
  });
}

function normalizePaidPrice(accessModel: AccessModel, priceKopeks?: number | null) {
  if (accessModel === "FREE") {
    return 0;
  }

  const safePrice = Math.max(0, Math.floor(priceKopeks ?? 0));
  if (safePrice <= 0) {
    throw new Error("Для платного анонса укажите цену больше 0");
  }

  return safePrice;
}

async function ensureImportedAnnouncement(params: {
  businessId: string;
  product: PlatformAnnouncementProductWithTrack;
}) {
  const existingImported = await db.query.voiceAnnouncements.findFirst({
    where: and(
      eq(voiceAnnouncements.businessId, params.businessId),
      eq(voiceAnnouncements.platformAnnouncementId, params.product.id)
    ),
    with: { track: true },
  });

  if (existingImported) {
    return existingImported;
  }

  const [importedTrack] = await db.insert(tracks).values({
    title: params.product.track.title,
    artist: params.product.track.artist,
    fileUrl: params.product.track.fileUrl,
    duration: params.product.track.duration,
    bpm: params.product.track.bpm,
    genre: params.product.track.genre,
    moodTags: Array.from(new Set([...(params.product.track.moodTags ?? []), "announcement", "platform"])),
    isExplicit: params.product.track.isExplicit,
    isFeatured: false,
    isAnnouncement: true,
    businessId: params.businessId,
    energyLevel: params.product.track.energyLevel,
    artistId: params.product.track.artistId,
    coverUrl: params.product.track.coverUrl,
  }).returning();

  const [importedAnnouncement] = await db.insert(voiceAnnouncements).values({
    businessId: params.businessId,
    trackId: importedTrack.id,
    platformAnnouncementId: params.product.id,
    text: params.product.transcript || params.product.track.title,
    languageCode: params.product.languageCode,
    provider: params.product.provider,
    voiceName: params.product.voiceName,
    speakingRate: params.product.speakingRate,
    pitch: params.product.pitch,
  }).returning();

  return importedAnnouncement;
}

export async function grantPlatformAnnouncementToBusiness(params: {
  businessId: string;
  platformAnnouncementId: string;
  paymentId?: string | null;
  pricePaidKopeks?: number;
}) {
  const product = await getPlatformProductById(params.platformAnnouncementId);
  if (!product) {
    throw new Error("Платформенный анонс не найден");
  }

  const importedAnnouncement = await ensureImportedAnnouncement({
    businessId: params.businessId,
    product,
  });

  const existingAcquisition = await db.query.businessAnnouncementAcquisitions.findFirst({
    where: and(
      eq(businessAnnouncementAcquisitions.businessId, params.businessId),
      eq(businessAnnouncementAcquisitions.platformAnnouncementId, params.platformAnnouncementId)
    ),
  });

  if (existingAcquisition) {
    const [updated] = await db.update(businessAnnouncementAcquisitions)
      .set({
        paymentId: params.paymentId ?? existingAcquisition.paymentId,
        pricePaidKopeks: Math.max(existingAcquisition.pricePaidKopeks, params.pricePaidKopeks ?? 0),
        importedAnnouncementId: importedAnnouncement.id,
        claimedAt: existingAcquisition.claimedAt ?? new Date(),
      })
      .where(eq(businessAnnouncementAcquisitions.id, existingAcquisition.id))
      .returning();

    revalidatePath("/dashboard/announcements");
    revalidatePath("/products/voice-announcements");

    return {
      acquisition: updated,
      importedAnnouncement,
    };
  }

  const [acquisition] = await db.insert(businessAnnouncementAcquisitions).values({
    businessId: params.businessId,
    platformAnnouncementId: params.platformAnnouncementId,
    paymentId: params.paymentId ?? null,
    pricePaidKopeks: Math.max(0, params.pricePaidKopeks ?? 0),
    importedAnnouncementId: importedAnnouncement.id,
  }).returning();

  revalidatePath("/dashboard/announcements");
  revalidatePath("/products/voice-announcements");

  return {
    acquisition,
    importedAnnouncement,
  };
}

export async function createPlatformAnnouncementUploadAction(input: {
  title: string;
  fileUrl: string;
  duration: number;
  description?: string;
  transcript?: string;
  accessModel: AccessModel;
  priceKopeks?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
  coverUrl?: string;
}) {
  try {
    const admin = await requireAdminUser();
    const priceKopeks = normalizePaidPrice(input.accessModel, input.priceKopeks);

    const result = await db.transaction(async (tx) => {
      const [track] = await tx.insert(tracks).values({
        title: input.title,
        artist: "BizMusic",
        fileUrl: input.fileUrl,
        duration: Math.round(input.duration),
        genre: "Announcement",
        moodTags: ["announcement", "platform"],
        isAnnouncement: true,
        isFeatured: false,
        coverUrl: input.coverUrl,
      }).returning();

      const [product] = await tx.insert(platformAnnouncementProducts).values({
        trackId: track.id,
        createdByUserId: admin.id,
        description: input.description,
        transcript: input.transcript,
        accessModel: input.accessModel,
        priceKopeks,
        isFeatured: input.isFeatured ?? false,
        isPublished: input.isPublished ?? true,
        sourceType: "UPLOAD",
      }).returning();

      return { ...product, track };
    });

    revalidatePath("/admin/content");
    revalidatePath("/products/voice-announcements");

    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось создать платформенный анонс";
    return { success: false, error: message };
  }
}

export async function createPlatformAnnouncementTtsAction(input: {
  title: string;
  text: string;
  description?: string;
  accessModel: AccessModel;
  priceKopeks?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
  languageCode?: string;
  provider?: "google" | "sberbank";
  voiceName: string;
  speakingRate?: number;
  pitch?: number;
}) {
  try {
    const admin = await requireAdminUser();
    const priceKopeks = normalizePaidPrice(input.accessModel, input.priceKopeks);

    const ttsRequest: TTSRequest = {
      text: input.text,
      voiceName: input.voiceName,
      languageCode: input.languageCode || "ru-RU",
      speakingRate: input.speakingRate,
      pitch: input.pitch,
      provider: input.provider || "sberbank",
    };

    const audioBuffer = await generateSpeech(ttsRequest);
    const metadata = await mm.parseBuffer(audioBuffer, "audio/mpeg");
    const duration = Math.round(metadata.format.duration || 0);
    const fileName = generateUniqueFileName(`${input.title.replace(/\s+/g, "_")}.mp3`);
    const publicUrl = await uploadFileBuffer(audioBuffer, fileName, "announcements");

    const result = await db.transaction(async (tx) => {
      const [track] = await tx.insert(tracks).values({
        title: input.title,
        artist: "BizMusic",
        fileUrl: publicUrl,
        duration,
        genre: "Announcement",
        moodTags: ["announcement", "platform"],
        isAnnouncement: true,
        isFeatured: false,
      }).returning();

      const [product] = await tx.insert(platformAnnouncementProducts).values({
        trackId: track.id,
        createdByUserId: admin.id,
        description: input.description,
        transcript: input.text,
        languageCode: ttsRequest.languageCode || "ru-RU",
        provider: ttsRequest.provider || "sberbank",
        voiceName: input.voiceName,
        speakingRate: input.speakingRate || 1,
        pitch: input.pitch || 0,
        accessModel: input.accessModel,
        priceKopeks,
        isFeatured: input.isFeatured ?? false,
        isPublished: input.isPublished ?? true,
        sourceType: "TTS",
      }).returning();

      return { ...product, track };
    });

    revalidatePath("/admin/content");
    revalidatePath("/products/voice-announcements");

    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось создать платформенный анонс";
    return { success: false, error: message };
  }
}

export async function updatePlatformAnnouncementAction(input: {
  id: string;
  title?: string;
  description?: string | null;
  transcript?: string | null;
  accessModel?: AccessModel;
  priceKopeks?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
}) {
  try {
    await requireAdminUser();

    const existing = await getPlatformProductById(input.id);
    if (!existing) {
      return { success: false, error: "Анонс не найден" };
    }

    const nextAccessModel = input.accessModel ?? existing.accessModel;
    const nextPrice = normalizePaidPrice(nextAccessModel, input.priceKopeks ?? existing.priceKopeks);

    if (input.title !== undefined) {
      await db.update(tracks)
        .set({ title: input.title })
        .where(eq(tracks.id, existing.trackId));
    }

    const [updated] = await db.update(platformAnnouncementProducts)
      .set({
        description: input.description === undefined ? existing.description : input.description,
        transcript: input.transcript === undefined ? existing.transcript : input.transcript,
        accessModel: nextAccessModel,
        priceKopeks: nextPrice,
        isFeatured: input.isFeatured ?? existing.isFeatured,
        isPublished: input.isPublished ?? existing.isPublished,
      })
      .where(eq(platformAnnouncementProducts.id, input.id))
      .returning();

    revalidatePath("/admin/content");
    revalidatePath("/products/voice-announcements");

    return { success: true, data: updated };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось обновить платформенный анонс";
    return { success: false, error: message };
  }
}

export async function deletePlatformAnnouncementAction(platformAnnouncementId: string) {
  try {
    await requireAdminUser();

    const product = await db.query.platformAnnouncementProducts.findFirst({
      where: eq(platformAnnouncementProducts.id, platformAnnouncementId),
      with: {
        track: true,
        acquisitions: {
          columns: { id: true },
          limit: 1,
        },
      },
    });

    if (!product) {
      return { success: false, error: "Анонс не найден" };
    }

    if (product.acquisitions.length > 0) {
      return {
        success: false,
        error: "У анонса уже есть приобретения. Снимите его с публикации вместо удаления.",
      };
    }

    const fileRef = parseStorageObjectRef(product.track.fileUrl, "announcements");
    if (fileRef.fileName) {
      try {
        await deleteFile(fileRef.fileName, fileRef.folder);
      } catch {
        // Ignore storage cleanup failures and still remove DB rows.
      }
    }

    await db.delete(tracks).where(eq(tracks.id, product.trackId));

    revalidatePath("/admin/content");
    revalidatePath("/products/voice-announcements");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось удалить платформенный анонс";
    return { success: false, error: message };
  }
}

export async function getAdminPlatformAnnouncementsAction() {
  try {
    await requireAdminUser();

    const items = await db.query.platformAnnouncementProducts.findMany({
      orderBy: [desc(platformAnnouncementProducts.createdAt)],
      with: {
        track: true,
        acquisitions: true,
      },
    });

    const data = await Promise.all(items.map(async (item) => ({
      ...item,
      acquisitionCount: item.acquisitions.length,
      track: await resolveTrackUrls(item.track),
    })));

    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось загрузить платформенные анонсы";
    return { success: false, error: message };
  }
}

export async function getFeaturedPlatformAnnouncementsAction(limit: number = 6) {
  try {
    const business = await getCurrentBusiness();

    const products = await db.query.platformAnnouncementProducts.findMany({
      where: and(
        eq(platformAnnouncementProducts.isFeatured, true),
        eq(platformAnnouncementProducts.isPublished, true)
      ),
      orderBy: [desc(platformAnnouncementProducts.sortOrder), desc(platformAnnouncementProducts.createdAt)],
      limit,
      with: { track: true },
    });

    const acquisitionMap = new Map<string, typeof businessAnnouncementAcquisitions.$inferSelect>();
    if (business && products.length > 0) {
      const acquisitions = await db.query.businessAnnouncementAcquisitions.findMany({
        where: and(
          eq(businessAnnouncementAcquisitions.businessId, business.id),
          inArray(businessAnnouncementAcquisitions.platformAnnouncementId, products.map((item) => item.id))
        ),
      });
      acquisitions.forEach((item) => acquisitionMap.set(item.platformAnnouncementId, item));
    }

    const data = await Promise.all(products.map(async (product) => {
      const acquisition = acquisitionMap.get(product.id) ?? null;
      return {
        ...product,
        owned: Boolean(acquisition),
        acquisition,
        track: await resolveTrackUrls(product.track),
      };
    }));

    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось загрузить подборку анонсов";
    return { success: false, error: message };
  }
}

export async function claimFreePlatformAnnouncementAction(platformAnnouncementId: string) {
  try {
    const business = await getCurrentBusiness();
    if (!business) {
      return { success: false, error: "Авторизация обязательна" };
    }

    const product = await getPlatformProductById(platformAnnouncementId);
    if (!product || !product.isPublished) {
      return { success: false, error: "Анонс недоступен" };
    }

    if (product.accessModel !== "FREE") {
      return { success: false, error: "Этот анонс доступен только после покупки" };
    }

    const result = await grantPlatformAnnouncementToBusiness({
      businessId: business.id,
      platformAnnouncementId,
      pricePaidKopeks: 0,
    });

    return { success: true, data: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось добавить анонс в библиотеку";
    return { success: false, error: message };
  }
}

export async function getBusinessAnnouncementsLibraryAction() {
  try {
    const business = await getCurrentBusiness();
    if (!business) {
      return { success: false, error: "Unauthorized" };
    }

    const announcements = await db.query.voiceAnnouncements.findMany({
      where: eq(voiceAnnouncements.businessId, business.id),
      with: {
        track: true,
        platformAnnouncement: true,
      },
      orderBy: [desc(voiceAnnouncements.createdAt)],
    });

    const mapped = await Promise.all(announcements.map(async (item) => ({
      ...item,
      track: await resolveTrackUrls(item.track),
    })));

    return {
      success: true,
      data: {
        generatedByBusiness: mapped.filter((item) => !item.platformAnnouncementId),
        fromPlatform: mapped.filter((item) => Boolean(item.platformAnnouncementId)),
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось загрузить библиотеку анонсов";
    return { success: false, error: message };
  }
}