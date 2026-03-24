"use server";

import { db } from "@/db";
import { playLogs, businesses, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { AdminPlayLog } from "@/types/admin";

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

    // 1. Resolve businessId if not provided
    let finalBusinessId = businessId;
    if (!finalBusinessId) {
      const userBusiness = await db.query.businesses.findFirst({
        where: eq(businesses.userId, user.id),
        columns: { id: true }
      });
      if (userBusiness) {
        finalBusinessId = userBusiness.id;
      }
    }

    // 2. Verify ownership if businessId was explicitly provided by caller
    if (finalBusinessId && businessId) {
      const business = await db.query.businesses.findFirst({
        where: eq(businesses.id, finalBusinessId),
        columns: { userId: true }
      });
      if (!business || business.userId !== user.id) {
        return { success: false, error: "Forbidden: Unauthorized business association" };
      }
    }
    // If auto-resolved (businessId was undefined), ownership is guaranteed by the userId query above

    const [playLog] = await db.insert(playLogs).values({
      trackId,
      businessId: finalBusinessId || null,
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
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const safeLimit = Math.max(1, Math.min(Math.floor(limit), 200));

    // Get the user's record to check role
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id)
    });

    if (!userRecord) {
      return { success: false, error: "Пользователь не найден" };
    }

    let logs;

    if (userRecord.role === "ADMIN") {
      // Admins see everything
      logs = await db.query.playLogs.findMany({
        limit: safeLimit,
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
    } else {
      // Business owners only see logs for their business
      const userBusiness = await db.query.businesses.findFirst({
        where: eq(businesses.userId, user.id),
        columns: { id: true }
      });

      if (!userBusiness) {
        return { success: true, data: [] };
      }

      logs = await db.query.playLogs.findMany({
        where: eq(playLogs.businessId, userBusiness.id),
        limit: safeLimit,
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
    }

    return { success: true, data: logs as unknown as AdminPlayLog[] };
  } catch (error: unknown) {
    console.error("Error fetching play logs:", error);
    return { success: false, error: "Не удалось загрузить логи воспроизведения" };
  }
}
