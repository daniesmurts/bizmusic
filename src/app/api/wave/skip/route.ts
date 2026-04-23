import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, trackSkips } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, trackId, reason } = await req.json();

    if (!businessId || !trackId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
      columns: { userId: true },
    });

    if (!business || business.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await db.insert(trackSkips).values({
      businessId,
      trackId,
      reason: typeof reason === "string" ? reason.slice(0, 255) : "User skipped track",
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
