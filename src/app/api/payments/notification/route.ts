import { tbank } from "@/lib/payments/tbank";
import { db } from "@/db";
import { payments, businesses, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

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
          cancelAtPeriodEnd: false,
        })
        .where(eq(businesses.id, payment.businessId));

      // TODO: Auto-generate license PDF via generateLicenseAction

      // Send activation email notification
      try {
        const user = await db.query.users.findFirst({
          where: eq(users.id, payment.business.userId),
        });
        if (user?.email) {
          const trialEndFormatted = trialEndsAt.toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
          await sendEmail({
            to: user.email,
            subject: "Подписка активирована — BizMusic",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Подписка активирована!</h1>
                <p>Здравствуйте!</p>
                <p>Ваш платёж успешно обработан. Пробный период активен до <strong>${trialEndFormatted}</strong>.</p>
                <p>Теперь вам доступен полный функционал платформы BizMusic для легального музыкального оформления вашего заведения.</p>
                <p style="margin-top: 24px;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://bizmusic.ru'}/dashboard" 
                     style="background: #c6f135; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                    Перейти в кабинет
                  </a>
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 32px;">© BizMusic — легальная музыка для бизнеса</p>
              </div>
            `,
          });
        }
      } catch (emailError) {
        // Don't fail the webhook if email sending fails
        console.error("[Webhook] Failed to send activation email:", emailError);
      }
    }

    // T-Bank requires 'OK' response to acknowledge notification
    return new NextResponse("OK");
  } catch (error) {
    console.error("Payment notification error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
