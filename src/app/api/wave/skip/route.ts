import { NextResponse } from "next/server";
import { db } from "@/db";
import { trackSkips } from "@/db/schema";
import { getAuthUser } from "@/lib/auth/get-user";
import { resolveAccessScope } from "@/lib/auth/scope";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, trackId, reason } = await req.json();

    if (!businessId || !trackId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const scope = await resolveAccessScope(user.id);
    if (!scope || (scope.role !== "ADMIN" && scope.businessId !== businessId)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await db.insert(trackSkips).values({
      businessId,
      trackId,
      reason: typeof reason === "string" ? reason.slice(0, 255) : "User skipped track",
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
