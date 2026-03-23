import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, licenses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.userId, user.id),
      columns: {
        id: true,
        inn: true,
        ogrn: true,
        kpp: true,
        legalName: true,
        address: true,
        phone: true,
        contactPerson: true,
        businessType: true,
        businessCategory: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
        trialEndsAt: true,
        currentPlanSlug: true,
        cancelAtPeriodEnd: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        licenses: {
          orderBy: [desc(licenses.issuedAt)],
          limit: 1,
        }
      }
    });

    if (!business) {
      return NextResponse.json({ error: "No business found" }, { status: 404 });
    }

    return NextResponse.json(business);
  } catch (error: any) {
    console.error("[API/Business] Error:", error);
    const responseBody: any = { error: "Internal Server Error" };
    if (process.env.NODE_ENV !== 'production') {
      responseBody.details = error instanceof Error ? error.message : String(error);
    }
    return NextResponse.json(responseBody, { status: 500 });
  }
}
