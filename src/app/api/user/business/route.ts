import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await (prisma.business as any).findFirst({
      where: { userId: user.id },
      select: { 
        id: true, 
        legalName: true, 
        currentPlanSlug: true,
        subscriptionStatus: true,
        inn: true,
        kpp: true,
        address: true,
        licenses: {
          orderBy: { issuedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!business) {
      return NextResponse.json({ error: "No business found" }, { status: 404 });
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error("[API/Business] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
