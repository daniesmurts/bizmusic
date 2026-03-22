import { tbank } from "@/lib/payments/tbank";
import { db } from "@/db";
import { payments, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 1. Verify token
    if (!tbank.checkNotificationToken(data)) {
      return new NextResponse("Invalid token", { status: 400 });
    }

    const { OrderId, Status, PaymentId, RebillId, ErrorCode } = data;

    // 2. Find the payment in DB
    const payment = await db.query.payments.findFirst({
      where: eq(payments.orderId, OrderId),
      with: { business: true },
    });

    if (!payment) {
      return new NextResponse("Payment not found", { status: 404 });
    }

    // 3. Update payment status
    await db.update(payments)
      .set({
        status: Status,
        rebillId: RebillId,
        errorCode: ErrorCode,
        tbankPaymentId: PaymentId,
      })
      .where(eq(payments.orderId, OrderId));

    // 4. Handle trial activation on successful confirmation
    if (Status === "CONFIRMED" || Status === "AUTHORIZED") {
      const trialDurationDays = 14;
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDurationDays);

      await db.update(businesses)
        .set({
          rebillId: RebillId,
          trialEndsAt: trialEndsAt,
          subscriptionExpiresAt: trialEndsAt,
          subscriptionStatus: "ACTIVE",
        })
        .where(eq(businesses.id, payment.businessId));
      
      console.log(`Trial activated for business ${payment.businessId} until ${trialEndsAt.toISOString()}`);
    }

    // T-Bank requires 'OK' response to acknowledge notification
    return new NextResponse("OK");
  } catch (error) {
    console.error("Payment notification error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
