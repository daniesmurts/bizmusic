"use server";

import { db } from "@/db";
import { businesses, locations, playlists, licenses, playlistTracks } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

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
        }
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
      const [{ count }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(playlistTracks)
        .where(eq(playlistTracks.playlistId, p.id));
      
      return {
        id: p.id,
        name: p.name,
        trackCount: count || 0
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
          licenseStatus: business.subscriptionStatus
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
  } catch (error: any) {
    console.error("Get business details error:", error);
    return { success: false, error: error.message || "Failed to fetch details" };
  }
}
