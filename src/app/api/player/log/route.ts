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

    // Run user profile lookup + optional business/location ownership checks in parallel
    const [dbUser, userBusiness] = await Promise.all([
      db.query.users.findFirst({
        where: eq(users.id, user.id),
        columns: { id: true, role: true, assignedLocationId: true },
      }),
      // Pre-fetch the caller's own business so we don't need a second round-trip later
      !businessId
        ? db.query.businesses.findFirst({
            where: eq(businesses.userId, user.id),
            columns: { id: true },
          })
        : Promise.resolve(null),
    ]);

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

    // Use pre-fetched business if businessId was not supplied by the caller
    if (!finalBusinessId && userBusiness) {
      finalBusinessId = userBusiness.id;
    }

    // 2. Ownership + location checks — run in parallel when both are needed
    if (finalBusinessId || finalLocationId) {
      const checks: Promise<unknown>[] = [];

      // Verify explicit businessId ownership
      let businessCheck: Promise<{ userId: string } | undefined> | null = null;
      if (finalBusinessId && businessId) {
        businessCheck = db.query.businesses.findFirst({
          where: eq(businesses.id, finalBusinessId),
          columns: { userId: true },
        });
        checks.push(businessCheck);
      }

      // Validate location belongs to this business
      let locationCheck: Promise<{ id: string } | undefined> | null = null;
      if (finalLocationId) {
        if (!finalBusinessId) {
          return NextResponse.json({ success: false, error: "Missing business context for location" }, { status: 400 });
        }
        locationCheck = db.query.locations.findFirst({
          where: and(eq(locations.id, finalLocationId), eq(locations.businessId, finalBusinessId)),
          columns: { id: true },
        });
        checks.push(locationCheck);
      }

      await Promise.all(checks);

      if (businessCheck) {
        const biz = await businessCheck;
        if (!biz || biz.userId !== user.id) {
          return NextResponse.json({ success: false, error: "Forbidden: Unauthorized business association" }, { status: 403 });
        }
      }
      if (locationCheck) {
        const loc = await locationCheck;
        if (!loc) {
          return NextResponse.json({ success: false, error: "Forbidden: Invalid location for this business" }, { status: 403 });
        }
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
