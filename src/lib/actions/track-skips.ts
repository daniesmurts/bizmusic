"use server";

import { db } from "@/db";
import { trackSkips, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function logTrackSkipAction({
  trackId,
  userId,
  businessId,
  locationId,
  playedAt,
  device,
  reason,
}: {
  trackId: string;
  userId?: string;
  businessId?: string;
  locationId?: string;
  playedAt?: Date;
  device?: string;
  reason?: string;
}) {
  try {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized: Please log in to skip tracks" };
    }

    // Optionally resolve businessId if not provided
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

    // Insert skip event
    const [skipLog] = await db.insert(trackSkips).values({
      trackId,
      userId: user.id,
      businessId: finalBusinessId || null,
      locationId: locationId || null,
      playedAt: playedAt || null,
      device: device || null,
      reason: reason || null,
    }).returning();

    return {
      success: true,
      data: skipLog,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to log skip";
    console.error("Track skip logging error:", error);
    return {
      success: false,
      error: message,
    };
  }
}
