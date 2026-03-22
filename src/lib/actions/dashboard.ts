"use server";

import { db } from "@/db";
import { businesses, locations, playlists, licenses, playlistTracks } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
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
          with: {
            tracks: true,
          }
        }
      }
    });

    console.log(`[DashboardData] UserId: ${user.id}, Business Found: ${!!business}, Status: ${business?.subscriptionStatus}`);

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

    // Count tracks across all playlists belonging to this business
    const trackCount = business.playlists.reduce((acc, p) => acc + p.tracks.length, 0);

    return {
      success: true,
      data: {
        businessId: business.id,
        businessName: business.legalName,
        locations: business.locations,
        playlists: business.playlists.map(p => ({
          id: p.id,
          name: p.name,
          trackCount: p.tracks.length,
          updatedAt: p.updatedAt
        })),
        stats: {
          locationCount: business.locations.length,
          trackCount,
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
