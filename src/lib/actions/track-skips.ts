"use server";

import { db } from "@/db";
import { trackSkips, locations } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { resolveAccessScope } from "@/lib/auth/scope";

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

    const scope = await resolveAccessScope(user.id);
    if (!scope) {
      return { success: false, error: "Unauthorized: Please log in to skip tracks" };
    }

    let finalBusinessId = businessId ?? scope.businessId ?? null;
    let finalLocationId = locationId ?? null;

    if (scope.isBranchManager) {
      if (!scope.businessId || !scope.assignedLocationId) {
        return { success: false, error: "Филиал не назначен" };
      }

      if (finalLocationId && finalLocationId !== scope.assignedLocationId) {
        return { success: false, error: "Недостаточно прав для этой локации" };
      }

      finalBusinessId = scope.businessId;
      finalLocationId = scope.assignedLocationId;
    } else if (finalLocationId) {
      const location = await db.query.locations.findFirst({
        where: and(eq(locations.id, finalLocationId), eq(locations.businessId, finalBusinessId || "")),
        columns: { id: true },
      });

      if (!location) {
        return { success: false, error: "Некорректная локация" };
      }
    }

    // Insert skip event
    const [skipLog] = await db.insert(trackSkips).values({
      trackId,
      userId: user.id,
      businessId: finalBusinessId || null,
      locationId: finalLocationId,
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
