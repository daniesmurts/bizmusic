import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await (prisma as any).business.findFirst({
      where: { userId: user.id },
      select: { id: true, legalName: true, currentPlanSlug: true }
    });

    if (!business) {
      return NextResponse.json({ error: "No business found" }, { status: 404 });
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error("Fetch business error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
