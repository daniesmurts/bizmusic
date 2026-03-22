"use server";

import { db } from "@/db";
import { playLogs, businesses, tracks, locations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { AdminPlayLog } from "@/types/admin";

/**
 * Log a track play event
 */
export async function logPlayAction(trackId: string, businessId?: string, locationId?: string) {
  try {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please log in to play music" };
    }

    // Verify ownership of the business/location if provided
    if (businessId) {
      const business = await db.query.businesses.findFirst({
        where: eq(businesses.id, businessId),
        columns: { userId: true }
      });
      if (!business || business.userId !== user.id) {
        return { success: false, error: "Forbidden: Unauthorized business association" };
      }
    }

    const [playLog] = await db.insert(playLogs).values({
      trackId,
      businessId,
      locationId: locationId || null,
    }).returning();

    // Revalidate the content page to update play counts (Removed to reduce server load)
    // revalidatePath("/admin/content");

    return {
      success: true,
      data: playLog,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to log play";
    console.error("Play logging error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Fetch all play logs for audit
 */
export async function getPlayLogsAction(limit: number = 50) {
  try {
    const logs = await db.query.playLogs.findMany({
      limit: limit,
      orderBy: [desc(playLogs.playedAt)],
      with: {
        track: {
          columns: {
            title: true,
            artist: true,
          },
        },
        business: {
          columns: {
            legalName: true,
          },
        },
        location: {
          columns: {
            name: true,
          },
        },
      },
    });

    return { success: true, data: logs as unknown as AdminPlayLog[] };
  } catch (error: unknown) {
    console.error("Error fetching play logs:", error);
    return { success: false, error: "Не удалось загрузить логи воспроизведения" };
  }
}
