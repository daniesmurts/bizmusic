"use server";

import { db } from "@/db";
import { businesses, locations, licenses, playlistTracks, tracks } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

function formatDurationRu(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const totalMinutes = Math.floor(safeSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}Ч ${String(minutes).padStart(2, "0")}М`;
}

export async function getDashboardDataAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
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

    // Fetch playlists with track counts separately
    const playlistsList = await Promise.all(business.playlists.map(async (p) => {
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
    }));

    const totalTrackCount = playlistsList.reduce((acc, p) => acc + p.trackCount, 0);

    return {
      success: true,
      data: {
        businessId: business.id,
        businessName: business.legalName,
        locations: business.locations,
        playlists: playlistsList,
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
