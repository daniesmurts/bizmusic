import { NextResponse } from "next/server";
import { db } from "@/db";
import { trackSkips } from "@/db/schema";

export async function POST(req: Request) {
  try {
    const { businessId, trackId, reason } = await req.json();
    
    if (!businessId || !trackId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    await db.insert(trackSkips).values({
      businessId,
      trackId,
      reason: reason || "User skipped track",
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
