import { NextResponse } from "next/server";
import { db } from "@/db";
import { playLogs, businesses, locations, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized: Please log in to play music" }, { status: 401 });
    }

    const body = await request.json();
    const { trackId, businessId, locationId } = body;

    if (!trackId) {
      return NextResponse.json({ success: false, error: "Missing trackId" }, { status: 400 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: {
        id: true,
        role: true,
        assignedLocationId: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 });
    }

    // 1. Resolve business and location scope for current user.
    let finalBusinessId = businessId;
    let finalLocationId = locationId || null;

    if (dbUser.role === "STAFF") {
      if (!dbUser.assignedLocationId) {
        return NextResponse.json({ success: false, error: "Staff account is not assigned to a branch" }, { status: 403 });
      }

      const assignedLocation = await db.query.locations.findFirst({
        where: eq(locations.id, dbUser.assignedLocationId),
        columns: { id: true, businessId: true },
      });

      if (!assignedLocation) {
        return NextResponse.json({ success: false, error: "Assigned branch is unavailable" }, { status: 403 });
      }

      if (finalLocationId && finalLocationId !== assignedLocation.id) {
        return NextResponse.json({ success: false, error: "Forbidden: Staff can access only assigned branch" }, { status: 403 });
      }

      if (finalBusinessId && finalBusinessId !== assignedLocation.businessId) {
        return NextResponse.json({ success: false, error: "Forbidden: Invalid business scope" }, { status: 403 });
      }

      finalLocationId = assignedLocation.id;
      finalBusinessId = assignedLocation.businessId;
    }

    if (!finalBusinessId) {
      const userBusiness = await db.query.businesses.findFirst({
        where: eq(businesses.userId, user.id),
        columns: { id: true }
      });
      if (userBusiness) {
        finalBusinessId = userBusiness.id;
      }
    }

    // 2. Verify ownership if businessId was explicitly provided by caller
    if (finalBusinessId && businessId) {
      const business = await db.query.businesses.findFirst({
        where: eq(businesses.id, finalBusinessId),
        columns: { userId: true }
      });
      if (!business || business.userId !== user.id) {
        return NextResponse.json({ success: false, error: "Forbidden: Unauthorized business association" }, { status: 403 });
      }
    }

    // 3. Validate location ownership to avoid cross-business attribution spoofing.
    if (finalLocationId) {
      if (!finalBusinessId) {
        return NextResponse.json({ success: false, error: "Missing business context for location" }, { status: 400 });
      }

      const location = await db.query.locations.findFirst({
        where: and(eq(locations.id, finalLocationId), eq(locations.businessId, finalBusinessId)),
        columns: { id: true },
      });

      if (!location) {
        return NextResponse.json({ success: false, error: "Forbidden: Invalid location for this business" }, { status: 403 });
      }
    }

    const [playLog] = await db.insert(playLogs).values({
      trackId,
      businessId: finalBusinessId || null,
      locationId: finalLocationId,
    }).returning();

    return NextResponse.json({
      success: true,
      data: playLog,
    });
  } catch (error: any) {
    console.error("Play logging API error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to log play",
    }, { status: 500 });
  }
}
