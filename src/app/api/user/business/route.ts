import { getAuthUser } from "@/lib/auth/get-user";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const user = await getAuthUser();

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
        cardMask: true,
        cardExpiry: true,
        ttsMonthlyUsed: true,
        ttsMonthlyPeriodStart: true,
        ttsMonthlyPeriodEnd: true,
        aiMonthlyUsed: true,
        aiMonthlyPeriodStart: true,
        aiMonthlyPeriodEnd: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        licenses: {
          orderBy: (l, { desc }) => [desc(l.issuedAt)],
          limit: 1,
        }
      }
    });

    if (!business) {
      return NextResponse.json({ error: "No business found" }, { status: 404 });
    }

    return NextResponse.json(business);
  } catch (error: unknown) {
    console.error("[API/Business] Error:", error);
    const responseBody: { error: string; details?: string } = { error: "Internal Server Error" };
    if (process.env.NODE_ENV !== 'production') {
      responseBody.details = error instanceof Error ? error.message : String(error);
    }
    return NextResponse.json(responseBody, { status: 500 });
  }
}
