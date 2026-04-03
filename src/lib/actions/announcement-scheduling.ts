"use server";

import { db } from "@/db";
import { waveSettings, voiceAnnouncements, tracks } from "@/db/schema";
import type { AnnouncementScheduleConfig } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { resolveAccessScope } from "@/lib/auth/scope";
import { revalidatePath } from "next/cache";
import { getDownloadSignedUrl, getFilePublicUrl, parseStorageObjectRef } from "@/lib/supabase-storage";

async function resolveBusinessScope() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const scope = await resolveAccessScope(user.id);
  if (!scope?.businessId) return null;

  return { userId: user.id, businessId: scope.businessId, role: scope.role, isBranchManager: scope.isBranchManager };
}

/**
 * Get the announcement schedule config for the current business
 */
export async function getAnnouncementScheduleAction() {
  try {
    const scope = await resolveBusinessScope();
    if (!scope) return { success: false, error: "Unauthorized" };

    const settings = await db.query.waveSettings.findFirst({
      where: eq(waveSettings.businessId, scope.businessId),
    });

    const defaultConfig: AnnouncementScheduleConfig = {
      frequency: 0,
      mode: "sequential",
      timeRules: [],
      weights: {},
    };

    return {
      success: true,
      data: {
        enabled: settings?.announcementScheduleEnabled ?? false,
        config: (settings?.announcementScheduleConfig as AnnouncementScheduleConfig) ?? defaultConfig,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка загрузки конфигурации";
    return { success: false, error: message };
  }
}

/**
 * Update the announcement schedule config
 */
export async function updateAnnouncementScheduleAction(input: {
  enabled: boolean;
  config: AnnouncementScheduleConfig;
}) {
  try {
    const scope = await resolveBusinessScope();
    if (!scope) return { success: false, error: "Unauthorized" };
    if (scope.isBranchManager) return { success: false, error: "Менеджер филиала не может настраивать расписание анонсов" };

    // Validate config
    if (input.config.frequency < 0 || input.config.frequency > 50) {
      return { success: false, error: "Частота должна быть от 0 до 50 треков" };
    }

    if (!["sequential", "random", "weighted"].includes(input.config.mode)) {
      return { success: false, error: "Неверный режим воспроизведения" };
    }

    // Validate time rules
    for (const rule of input.config.timeRules) {
      if (!/^\d{2}:\d{2}$/.test(rule.time)) {
        return { success: false, error: `Неверный формат времени: ${rule.time}` };
      }
      if (!rule.days.length) {
        return { success: false, error: "Укажите хотя бы один день для правила" };
      }
    }

    // Validate weights
    for (const weight of Object.values(input.config.weights)) {
      if (weight < 1 || weight > 10) {
        return { success: false, error: "Вес должен быть от 1 до 10" };
      }
    }

    // Upsert wave_settings
    const existing = await db.query.waveSettings.findFirst({
      where: eq(waveSettings.businessId, scope.businessId),
    });

    if (existing) {
      await db.update(waveSettings)
        .set({
          announcementScheduleEnabled: input.enabled,
          announcementScheduleConfig: input.config,
        })
        .where(eq(waveSettings.businessId, scope.businessId));
    } else {
      await db.insert(waveSettings).values({
        businessId: scope.businessId,
        announcementScheduleEnabled: input.enabled,
        announcementScheduleConfig: input.config,
      });
    }

    revalidatePath("/dashboard/announcements");
    revalidatePath("/dashboard/announcements/schedule");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка обновления расписания";
    return { success: false, error: message };
  }
}

/**
 * Get active announcements for scheduling (with stream URLs)
 */
export async function getSchedulableAnnouncementsAction() {
  try {
    const scope = await resolveBusinessScope();
    if (!scope) return { success: false, error: "Unauthorized" };

    const announcements = await db.query.voiceAnnouncements.findMany({
      where: eq(voiceAnnouncements.businessId, scope.businessId),
      with: {
        track: true,
      },
      orderBy: (va, { desc }) => [desc(va.createdAt)],
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const mapped = await Promise.all(
      announcements.map(async (a) => {
        const isFullUrl = a.track.fileUrl.startsWith("http");
        const fileRef = parseStorageObjectRef(a.track.fileUrl, "announcements");

        const fallbackUrl = isFullUrl
          ? a.track.fileUrl
          : supabaseUrl
            ? getFilePublicUrl(fileRef.fileName, fileRef.folder)
            : `/uploads/${fileRef.fileName}`;

        let streamUrl: string | undefined;
        try {
          if (!isFullUrl && supabaseUrl) {
            streamUrl = await getDownloadSignedUrl(fileRef.fileName, fileRef.folder, 3600);
          }
        } catch {
          // Fallback to public URL
        }

        return {
          id: a.id,
          trackId: a.track.id,
          title: a.track.title,
          text: a.text,
          provider: a.provider,
          voiceName: a.voiceName,
          duration: a.track.duration,
          fileUrl: fallbackUrl,
          streamUrl: streamUrl || fallbackUrl,
          announcementId: a.id, // voiceAnnouncements.id for logging
        };
      })
    );

    return { success: true, data: mapped };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка загрузки анонсов";
    return { success: false, error: message };
  }
}
