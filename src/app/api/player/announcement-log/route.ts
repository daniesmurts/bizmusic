import { NextResponse } from "next/server";
import { db } from "@/db";
import { announcementPlayLogs, voiceAnnouncements, businesses, locations, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { announcementId, trackId, locationId, wasSkipped, listenDurationSec } = body;

    if (!announcementId || !trackId) {
      return NextResponse.json({ success: false, error: "Missing announcementId or trackId" }, { status: 400 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { id: true, role: true, assignedLocationId: true },
    });

    if (!dbUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Resolve business scope
    let finalBusinessId: string | null = null;
    let finalLocationId: string | null = locationId || null;

    if (dbUser.role === "STAFF") {
      if (!dbUser.assignedLocationId) {
        return NextResponse.json({ success: false, error: "Staff not assigned to a branch" }, { status: 403 });
      }
      const assignedLocation = await db.query.locations.findFirst({
        where: eq(locations.id, dbUser.assignedLocationId),
        columns: { id: true, businessId: true },
      });
      if (!assignedLocation) {
        return NextResponse.json({ success: false, error: "Assigned branch unavailable" }, { status: 403 });
      }
      finalLocationId = assignedLocation.id;
      finalBusinessId = assignedLocation.businessId;
    } else {
      const userBusiness = await db.query.businesses.findFirst({
        where: eq(businesses.userId, user.id),
        columns: { id: true },
      });
      if (userBusiness) finalBusinessId = userBusiness.id;
    }

    if (!finalBusinessId) {
      return NextResponse.json({ success: false, error: "No business context" }, { status: 403 });
    }

    // Validate location belongs to this business
    if (finalLocationId) {
      const loc = await db.query.locations.findFirst({
        where: and(eq(locations.id, finalLocationId), eq(locations.businessId, finalBusinessId)),
        columns: { id: true },
      });
      if (!loc) {
        return NextResponse.json({ success: false, error: "Invalid location for this business" }, { status: 403 });
      }
    }

    // Validate announcement belongs to this business
    const announcement = await db.query.voiceAnnouncements.findFirst({
      where: and(
        eq(voiceAnnouncements.id, announcementId),
        eq(voiceAnnouncements.businessId, finalBusinessId)
      ),
      columns: { id: true },
    });

    if (!announcement) {
      return NextResponse.json({ success: false, error: "Announcement not found or access denied" }, { status: 404 });
    }

    const [log] = await db.insert(announcementPlayLogs).values({
      announcementId,
      trackId,
      businessId: finalBusinessId,
      locationId: finalLocationId,
      wasSkipped: Boolean(wasSkipped),
      listenDurationSec: Math.max(0, Math.round(Number(listenDurationSec) || 0)),
    }).returning();

    return NextResponse.json({ success: true, data: log });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to log announcement play";
    console.error("Announcement log API error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
