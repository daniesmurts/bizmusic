import { db } from "@/db";
import { commissionLedger, referralConversions } from "@/db/schema";
import { and, eq, inArray, lt, isNotNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import crypto from "crypto";

function verifyCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (authHeader.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
}

export async function GET(req: Request) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trialConversions = await db.query.referralConversions.findMany({
    where: and(
      eq(referralConversions.status, "trial"),
      isNotNull(referralConversions.firstPaymentAt),
      lt(referralConversions.firstPaymentAt, thirtyDaysAgo)
    ),
    columns: { id: true },
  });

  if (trialConversions.length === 0) {
    return NextResponse.json({ approved: 0 });
  }

  const conversionIds = trialConversions.map((c) => c.id);

  await db.update(referralConversions)
    .set({ status: "active" })
    .where(inArray(referralConversions.id, conversionIds));

  const updated = await db.update(commissionLedger)
    .set({ status: "approved" })
    .where(and(
      eq(commissionLedger.status, "pending"),
      inArray(commissionLedger.conversionId, conversionIds)
    ))
    .returning({ id: commissionLedger.id });

  return NextResponse.json({ approved: updated.length });
}
