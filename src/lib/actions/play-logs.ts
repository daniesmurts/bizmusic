"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { AdminPlayLog } from "@/types/admin";

/**
 * Log a track play event
 */
export async function logPlayAction(trackId: string, businessId?: string, locationId?: string) {
  try {
    const playLog = await prisma.playLog.create({
      data: {
        trackId,
        businessId,
        locationId,
      },
    });

    // Revalidate the content page to update play counts
    revalidatePath("/admin/content");

    return {
      success: true,
      data: playLog,
    };
  } catch (error: any) {
    console.error("Play logging error:", error);
    return {
      success: false,
      error: error.message || "Failed to log play",
    };
  }
}

/**
 * Fetch all play logs for audit
 */
export async function getPlayLogsAction(limit: number = 50) {
  try {
    const logs = await prisma.playLog.findMany({
      take: limit,
      orderBy: {
        playedAt: "desc",
      },
      include: {
        track: {
          select: {
            title: true,
            artist: true,
          },
        },
        business: {
          select: {
            legalName: true,
          },
        },
        location: {
          select: {
            name: true,
          },
        },
      },
    });

    return { success: true, data: logs as unknown as AdminPlayLog[] };
  } catch (error: any) {
    console.error("Error fetching play logs:", error);
    return { success: false, error: "Не удалось загрузить логи воспроизведения" };
  }
}
