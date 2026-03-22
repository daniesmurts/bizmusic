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
        { subscriptionStatus: 'desc' }, // ACTIVE (1) is after INACTIVE (0) in this schema, so desc puts ACTIVE first
        { updatedAt: 'desc' }
      ],
      select: {
        id: true,
        legalName: true,
        subscriptionStatus: true,
        locations: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            name: true,
            address: true,
            createdAt: true
          }
        },
        playlists: {
          select: {
            id: true,
            name: true,
            updatedAt: true,
            _count: {
              select: { tracks: true }
            }
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
        { subscriptionStatus: 'desc' }, 
        { updatedAt: 'desc' }
      ],
      select: {
        id: true,
        legalName: true,
        inn: true,
        ogrn: true,
        kpp: true,
        address: true,
        subscriptionStatus: true,
        licenses: {
          orderBy: { issuedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            pdfUrl: true,
            signingName: true,
            issuedAt: true
          }
        },
        locations: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
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
