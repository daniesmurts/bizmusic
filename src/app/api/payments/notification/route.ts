import { tbank } from "@/lib/payments/tbank";
import { db } from "@/db";
import { payments, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 1. Validate required fields exist
    const { OrderId, Status, PaymentId, RebillId, ErrorCode, Amount } = data;
    if (!OrderId || !Status || !PaymentId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // 2. Verify token
    if (!tbank.checkNotificationToken(data)) {
      return new NextResponse("Invalid token", { status: 400 });
    }

    // 3. Find the payment in DB
    const payment = await db.query.payments.findFirst({
      where: eq(payments.orderId, OrderId),
      with: { business: true },
    });

    if (!payment) {
      return new NextResponse("Payment not found", { status: 404 });
    }

    // 4. Idempotency: skip if already processed
    if (payment.status === "CONFIRMED" || payment.status === "AUTHORIZED") {
      return new NextResponse("OK");
    }

    // 5. Validate amount matches what we initiated
    if (typeof Amount === "number" && Amount !== payment.amount) {
      console.error(`[Webhook] Amount mismatch for ${OrderId}: expected ${payment.amount}, got ${Amount}`);
      return new NextResponse("Amount mismatch", { status: 400 });
    }

    // 6. Update payment status
    await db.update(payments)
      .set({
        status: Status,
        rebillId: RebillId || null,
        errorCode: ErrorCode || null,
        tbankPaymentId: PaymentId,
      })
      .where(eq(payments.orderId, OrderId));

    // 7. Handle trial activation on successful confirmation
    if (Status === "CONFIRMED" || Status === "AUTHORIZED") {
      const trialDurationDays = 14;
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDurationDays);

      // Activate subscription and save plan info (moved from startFreeTrial)
      await db.update(businesses)
        .set({
          rebillId: RebillId || undefined,
          trialEndsAt: trialEndsAt,
          subscriptionExpiresAt: trialEndsAt,
          subscriptionStatus: "ACTIVE",
        })
        .where(eq(businesses.id, payment.businessId));

      // TODO: Auto-generate license PDF via generateLicenseAction
      // TODO: Send activation email notification
    }

    // T-Bank requires 'OK' response to acknowledge notification
    return new NextResponse("OK");
  } catch (error) {
    console.error("Payment notification error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
