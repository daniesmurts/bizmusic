"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { businesses, locationPlaylistAssignments, locations, playlists, users } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";

async function resolveOwnerScope() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, businessId: null, isBranchManager: false };

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { id: true, role: true },
  });

  if (!dbUser) return { user: null, businessId: null, isBranchManager: false };
  if (dbUser.role === "STAFF") return { user: dbUser, businessId: null, isBranchManager: true };

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.userId, dbUser.id),
    columns: { id: true },
  });

  return { user: dbUser, businessId: business?.id ?? null, isBranchManager: false };
}

export async function getLocationPlaylistAssignmentsAction() {
  try {
    const scope = await resolveOwnerScope();
    if (!scope.user || !scope.businessId) return { success: false, error: "Unauthorized" };

    const locationRows = await db.query.locations.findMany({
      where: eq(locations.businessId, scope.businessId),
      columns: { id: true, name: true, address: true },
    });

    const playlistRows = await db.query.playlists.findMany({
      where: eq(playlists.businessId, scope.businessId),
      columns: { id: true, name: true },
    });

    const assignments = await db.query.locationPlaylistAssignments.findMany({
      where: eq(locationPlaylistAssignments.businessId, scope.businessId),
      columns: { locationId: true, playlistId: true },
    });

    const byLocation = new Map(assignments.map((a) => [a.locationId, a.playlistId]));

    return {
      success: true,
      data: {
        locations: locationRows.map((l) => ({ ...l, playlistId: byLocation.get(l.id) ?? null })),
        playlists: playlistRows,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось загрузить назначения";
    return { success: false, error: message };
  }
}

export async function upsertLocationPlaylistAssignmentAction(locationId: string, playlistId: string) {
  try {
    const scope = await resolveOwnerScope();
    if (!scope.user || !scope.businessId) return { success: false, error: "Unauthorized" };
    if (scope.isBranchManager) return { success: false, error: "Недостаточно прав" };

    const [ownedLocation, ownedPlaylist] = await Promise.all([
      db.query.locations.findFirst({
        where: and(eq(locations.id, locationId), eq(locations.businessId, scope.businessId)),
        columns: { id: true },
      }),
      db.query.playlists.findFirst({
        where: and(eq(playlists.id, playlistId), eq(playlists.businessId, scope.businessId)),
        columns: { id: true },
      }),
    ]);

    if (!ownedLocation) return { success: false, error: "Филиал не найден" };
    if (!ownedPlaylist) return { success: false, error: "Плейлист не найден" };

    const existing = await db.query.locationPlaylistAssignments.findFirst({
      where: eq(locationPlaylistAssignments.locationId, locationId),
      columns: { id: true },
    });

    if (existing) {
      await db.update(locationPlaylistAssignments)
        .set({
          playlistId,
          updatedByUserId: scope.user.id,
          updatedAt: new Date(),
        })
        .where(eq(locationPlaylistAssignments.id, existing.id));
    } else {
      await db.insert(locationPlaylistAssignments).values({
        businessId: scope.businessId,
        locationId,
        playlistId,
        updatedByUserId: scope.user.id,
      });
    }

    revalidatePath("/dashboard/branches");
    revalidatePath("/dashboard/announcements/bulk");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось сохранить назначение";
    return { success: false, error: message };
  }
}

export async function getAssignmentsForLocationsAction(locationIds: string[]) {
  try {
    const scope = await resolveOwnerScope();
    if (!scope.user || !scope.businessId) return { success: false, error: "Unauthorized" };

    const rows = await db.query.locationPlaylistAssignments.findMany({
      where: and(
        eq(locationPlaylistAssignments.businessId, scope.businessId),
        inArray(locationPlaylistAssignments.locationId, locationIds)
      ),
      columns: { locationId: true, playlistId: true },
    });

    return { success: true, data: rows };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось получить назначения";
    return { success: false, error: message };
  }
}
