"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function getDashboardDataAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const business = await prisma.business.findFirst({
      where: { userId: user.id },
      orderBy: [
        { subscriptionStatus: 'asc' }, // ACTIVE is before INACTIVE in some enum orders, but let's use updatedAt for sure
        { updatedAt: 'desc' }
      ],
      include: {
        locations: {
          orderBy: { createdAt: "desc" },
          take: 5
        },
        playlists: {
          include: {
            _count: {
              select: { tracks: true }
            }
          }
        }
      }
    });

    console.log(`[DashboardData] User: ${user.email}, Business Found: ${!!business}, Status: ${business?.subscriptionStatus}`);

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
    const trackCount = business.playlists.reduce((acc, p) => acc + p._count.tracks, 0);

    return {
      success: true,
      data: {
        businessId: business.id,
        businessName: business.legalName,
        locations: business.locations,
        playlists: business.playlists.map(p => ({
          id: p.id,
          name: p.name,
          trackCount: p._count.tracks,
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

    const business = await prisma.business.findFirst({
      where: { userId: user.id },
      orderBy: [
        { subscriptionStatus: 'asc' }, 
        { updatedAt: 'desc' }
      ],
      include: {
        licenses: {
          orderBy: { issuedAt: 'desc' },
          take: 1
        },
        locations: true
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
