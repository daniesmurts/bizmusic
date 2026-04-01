"use server";

import { db } from "@/db";
import { businesses, locations, licenses, playlistTracks, tracks, playlists, users } from "@/db/schema";
import { eq, desc, sql, or, inArray } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { resolveAccessScope } from "@/lib/auth/scope";

function formatDurationRu(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const totalMinutes = Math.floor(safeSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}Ч ${String(minutes).padStart(2, "0")}М`;
}

async function processPlaylist(p: { id: string; name: string }) {
  const [{ count, totalDurationSeconds }] = await db
    .select({
      count: sql`count(${playlistTracks.id})`.mapWith(Number),
      totalDurationSeconds: sql`coalesce(sum(${tracks.duration}), 0)`.mapWith(Number),
    })
    .from(playlistTracks)
    .leftJoin(tracks, eq(playlistTracks.trackId, tracks.id))
    .where(eq(playlistTracks.playlistId, p.id));

  return {
    id: p.id,
    name: p.name,
    trackCount: count || 0,
    durationSeconds: totalDurationSeconds || 0,
    duration: formatDurationRu(totalDurationSeconds || 0),
  };
}

export async function getDashboardDataAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const scope = await resolveAccessScope(user.id);

    // STAFF (branch managers): return a limited dataset scoped to their assigned location
    if (scope?.isBranchManager) {
      if (!scope.businessId || !scope.assignedLocationId) {
        return { success: false, error: "Филиал не назначен. Обратитесь к администратору." };
      }

      const [business, assignedLocation] = await Promise.all([
        db.query.businesses.findFirst({
          where: eq(businesses.id, scope.businessId),
          columns: { id: true, legalName: true, subscriptionStatus: true },
          with: {
            playlists: { columns: { id: true, name: true } },
          },
        }),
        db.query.locations.findFirst({
          where: eq(locations.id, scope.assignedLocationId),
          columns: { id: true, name: true, address: true, createdAt: true, updatedAt: true, businessId: true, deviceId: true },
        }),
      ]);

      if (!business || !assignedLocation) {
        return { success: false, error: "Данные филиала не найдены" };
      }

      const staffPlaylists = await Promise.all(business.playlists.map(processPlaylist));

      return {
        success: true,
        data: {
          businessId: business.id,
          businessName: business.legalName,
          locations: [assignedLocation],
          playlists: staffPlaylists,
          globalPlaylists: [],
          stats: { locationCount: 1, trackCount: 0, licenseStatus: business.subscriptionStatus },
        },
      };
    }

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.userId, user.id),
      orderBy: [desc(businesses.subscriptionStatus), desc(businesses.updatedAt)],
      with: {
        locations: {
          orderBy: [desc(locations.createdAt)],
          limit: 5,
        },
        playlists: {
          columns: {
            id: true,
            name: true,
          }
        },
        licenses: {
          columns: { documentStatus: true, pdfUrl: true },
          orderBy: [desc(licenses.issuedAt)],
          limit: 1,
        },
      }
    });

    if (!business) {
      return {
        success: true,
        data: {
          locations: [],
          stats: {
            locationCount: 0,
            trackCount: 0,
            licenseStatus: "INACTIVE"
          }
        }
      };
    }

    // Find all businesses owned by ADMIN or CREATOR users to include their playlists as curated
    const admins = await db.select({ id: users.id })
      .from(users)
      .where(or(eq(users.role, "ADMIN"), eq(users.userType, "CREATOR")));
    
    const adminUserIds = admins.map(u => u.id);
    
    let adminBusinessIds: string[] = [];
    if (adminUserIds.length > 0) {
      const adminBiz = await db.select({ id: businesses.id })
        .from(businesses)
        .where(inArray(businesses.userId, adminUserIds));
      adminBusinessIds = adminBiz.map(b => b.id);
    }

    // Fetch global (admin) playlists where businessId is null OR belongs to an admin business
    const globalPlaylistsFromDb = await db.query.playlists.findMany({
      where: (p, { isNull, inArray, or }) => {
        const conditions = [isNull(p.businessId)];
        if (adminBusinessIds.length > 0) {
          conditions.push(inArray(p.businessId, adminBusinessIds));
        }
        return or(...conditions);
      },
      columns: {
        id: true,
        name: true,
        businessId: true,
      }
    });

    // filter out playlists that already belong to THIS specific business (from the current logged in business context)
    const filteredGlobalPlaylists = globalPlaylistsFromDb.filter(p => p.businessId !== business.id);

    // Fetch playlists with track counts separately
    const playlistsList = await Promise.all(business.playlists.map(processPlaylist));
    const globalPlaylistsList = await Promise.all(filteredGlobalPlaylists.map(processPlaylist));

    const totalTrackCount = playlistsList.reduce((acc, p) => acc + p.trackCount, 0);

    return {
      success: true,
      data: {
        businessId: business.id,
        businessName: business.legalName,
        locations: business.locations,
        playlists: playlistsList,
        globalPlaylists: globalPlaylistsList,
        stats: {
          locationCount: business.locations.length,
          trackCount: totalTrackCount,
          licenseStatus: (() => {
            const lic = business.licenses?.[0];
            if (business.subscriptionStatus === 'ACTIVE' || lic?.documentStatus === 'READY' || lic?.pdfUrl) return 'ACTIVE';
            if (lic?.documentStatus === 'GENERATING') return 'GENERATING';
            if (lic?.documentStatus === 'FAILED') return 'FAILED';
            return business.subscriptionStatus;
          })(),
        }
      }
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch dashboard data";
    console.error("Get dashboard data error:", error);
    return {
      success: false,
      error: message
    };
  }
}

export async function getBusinessDetailsAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Not authenticated" };

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.userId, user.id),
      orderBy: [desc(businesses.subscriptionStatus), desc(businesses.updatedAt)],
      with: {
        licenses: {
          orderBy: [desc(licenses.issuedAt)],
          limit: 1,
        },
        locations: true,
      }
    });

    if (!business) return { success: true, data: null };

    return {
      success: true,
      data: business
    };
  } catch (error: unknown) {
    console.error("Get business details error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to fetch details" };
  }
}
