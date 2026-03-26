"use server";

import { db } from "@/db";
import { tracks, voiceAnnouncements, businesses } from "@/db/schema";
import { generateSpeech, TTSRequest } from "@/lib/tts";
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
  consumeTtsGenerationCredit,
  getBusinessEntitlementState,
  getTtsEntitlementStatus,
} from "@/lib/tts-entitlements";

export interface CreateAnnouncementInput {
  text: string;
  title: string;
  voiceName: string;
  speakingRate?: number;
  pitch?: number;
  languageCode?: string;
  provider?: "google" | "sberbank";
}

/**
 * Generate a voice announcement, upload to storage, and save to database
 */
export async function generateVoiceAnnouncementAction(input: CreateAnnouncementInput) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get business ID for the user
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.userId, user.id),
    });

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

    const entitlement = await getTtsEntitlementStatus(business.id);
    if (!entitlement.canGenerate) {
      return { success: false, error: entitlement.denialReason || "Лимит генераций исчерпан." };
    }

    const entitlementBusiness = await getBusinessEntitlementState(business.id);

    // 1. Generate Speech
    const ttsRequest: TTSRequest = {
      text: input.text,
      voiceName: input.voiceName,
      languageCode: input.languageCode || "ru-RU",
      speakingRate: input.speakingRate,
      pitch: input.pitch,
      provider: input.provider || "google",
    };

    const audioBuffer = await generateSpeech(ttsRequest);

    // 2. Calculate duration
    const metadata = await mm.parseBuffer(audioBuffer, "audio/mpeg");
    const duration = Math.round(metadata.format.duration || 0);

    // 3. Upload to Supabase Storage
    const fileName = generateUniqueFileName(`${input.title.replace(/\s+/g, '_')}.mp3`);
    const publicUrl = await uploadFileBuffer(audioBuffer, fileName, "announcements");

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
        text: input.text,
        languageCode: ttsRequest.languageCode!,
        provider: ttsRequest.provider!,
        voiceName: input.voiceName,
        speakingRate: input.speakingRate || 1.0,
        pitch: input.pitch || 0.0,
      }).returning();

      await consumeTtsGenerationCredit(tx, {
        business: entitlementBusiness,
        announcementId: newAnnouncement.id,
        provider: ttsRequest.provider || "google",
        charsCount: input.text.length,
      });

      return { track: newTrack, announcement: newAnnouncement };
    });

    revalidatePath("/dashboard/announcements");
    revalidatePath("/dashboard/player");

    const nextEntitlement = await getTtsEntitlementStatus(business.id);

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.userId, user.id),
      columns: { id: true },
    });

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.userId, user.id),
    });

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.userId, user.id),
    });

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
