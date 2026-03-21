import { tbank } from "@/lib/payments/tbank";
import { prisma } from "@/lib/prisma";
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
    const payment = await prisma.payment.findUnique({
      where: { orderId: OrderId },
      include: { business: true },
    });

    if (!payment) {
      return new NextResponse("Payment not found", { status: 404 });
    }

    // 3. Update payment status
    await prisma.payment.update({
      where: { orderId: OrderId },
      data: {
        status: Status,
        rebillId: RebillId,
        errorCode: ErrorCode,
        tbankPaymentId: PaymentId,
      },
    });

    // 4. Handle trial activation on successful confirmation
    if (Status === "CONFIRMED" || Status === "AUTHORIZED") {
      const trialDurationDays = 14;
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDurationDays);

      await prisma.business.update({
        where: { id: payment.businessId },
        data: {
          rebillId: RebillId,
          trialEndsAt: trialEndsAt,
          subscriptionExpiresAt: trialEndsAt,
          subscriptionStatus: "ACTIVE",
        },
      });
      
      console.log(`Trial activated for business ${payment.businessId} until ${trialEndsAt.toISOString()}`);
    }

    // T-Bank requires 'OK' response to acknowledge notification
    return new NextResponse("OK");
  } catch (error) {
    console.error("Payment notification error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
