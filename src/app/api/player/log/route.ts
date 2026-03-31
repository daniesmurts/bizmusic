import { NextResponse } from "next/server";
import { db } from "@/db";
import { playLogs, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
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

    // 1. Resolve businessId if not provided
    let finalBusinessId = businessId;
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

    const [playLog] = await db.insert(playLogs).values({
      trackId,
      businessId: finalBusinessId || null,
      locationId: locationId || null,
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
