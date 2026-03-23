import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, payments } from "@/db/schema";
import { eq, and, lte, isNotNull, desc } from "drizzle-orm";
import { tbank } from "@/lib/payments/tbank";
import { PLANS } from "@/lib/payments/plans";

export const dynamic = 'force-dynamic';

const MAX_BILLING_RETRIES = 3;

export async function GET(req: Request) {
  try {
    // 1. Security: always require CRON_SECRET
    const authHeader = req.headers.get("authorization");
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const now = new Date();

    // 2. Find businesses that are ACTIVE, have a RebillId, and are past their expiration date.
    // (Since we sync trialEndsAt and subscriptionExpiresAt at the same time upon trial creation, 
    // simply checking subscriptionExpiresAt <= now handles both trial conversions and monthly renewals.)
    const dueBusinesses = await db.query.businesses.findMany({
      where: and(
        eq(businesses.subscriptionStatus, "ACTIVE"),
        isNotNull(businesses.rebillId),
        lte(businesses.subscriptionExpiresAt, now)
      )
    });

    const results = [];

    // 3. Process each due subscription
    for (const business of dueBusinesses) {
      try {
        const planSlug = business.currentPlanSlug || "content"; // Fallback to content tier if null
        const plan = PLANS[planSlug];
        
        if (!plan) {
          throw new Error(`Invalid plan slug: ${planSlug}`);
        }

        const shortBizId = business.id.replace(/-/g, "").substring(0, 10);
        const orderId = `REN_${shortBizId}_${Date.now()}`;
        const safeCustomerKey = business.userId.replace(/-/g, "").substring(0, 36);

        const priceToCharge = business.billingInterval === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

        // A. Initialize the recurring payment
        const initResult = await tbank.init({
          Amount: priceToCharge,
          OrderId: orderId,
          Description: `Продление подписки - ${plan.name} (${business.billingInterval === "yearly" ? "Год" : "Месяц"})`,
          Recurrent: 'Y',
          CustomerKey: safeCustomerKey,
        });

        if (!initResult.Success || !initResult.PaymentId) {
          throw new Error(`Init Failed: ${initResult.Message} - ${initResult.Details}`);
        }

        // B. Charge the saved card
        const chargeResult = await tbank.charge({
          PaymentId: initResult.PaymentId,
          RebillId: business.rebillId!,
        });

        // C. Record the payment in database
        await db.insert(payments).values({
          businessId: business.id,
          amount: priceToCharge,
          status: chargeResult.Success ? "CONFIRMED" : "REJECTED",
          tbankPaymentId: initResult.PaymentId,
          orderId: orderId,
          recurrent: true,
          rebillId: business.rebillId,
          errorCode: chargeResult.ErrorCode !== "0" ? chargeResult.ErrorCode : null,
        });

        if (chargeResult.Success) {
          // Success: Extend subscription by interval using proper month arithmetic
          const nextExpiration = new Date();
          if (business.billingInterval === "yearly") {
            nextExpiration.setFullYear(nextExpiration.getFullYear() + 1);
          } else {
            nextExpiration.setMonth(nextExpiration.getMonth() + 1);
          }

          await db.update(businesses)
            .set({
              subscriptionExpiresAt: nextExpiration,
              updatedAt: new Date()
            })
            .where(eq(businesses.id, business.id));

          results.push({ businessId: business.id, status: "renewed" });
        } else {
          // Failure: Check how many recent consecutive failures before locking out
          const recentFailures = await db.query.payments.findMany({
            where: and(
              eq(payments.businessId, business.id),
              eq(payments.status, "REJECTED")
            ),
            orderBy: [desc(payments.createdAt)],
            limit: MAX_BILLING_RETRIES,
          });

          if (recentFailures.length >= MAX_BILLING_RETRIES) {
            // Too many consecutive failures — expire the subscription
            await db.update(businesses)
              .set({
                subscriptionStatus: "EXPIRED",
                updatedAt: new Date()
              })
              .where(eq(businesses.id, business.id));
            results.push({ businessId: business.id, status: "expired", error: `${MAX_BILLING_RETRIES} consecutive failures` });
          } else {
            // Not enough failures yet — leave ACTIVE for next cron retry
            results.push({ businessId: business.id, status: "retry_pending", error: chargeResult.Message });
          }
        }

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[Cron] Error billing business ${business.id}:`, msg);
        results.push({ businessId: business.id, status: "error", error: msg });
      }
    }

    return NextResponse.json({
      success: true,
      processed: dueBusinesses.length,
      results
    });

  } catch (error) {
    console.error("[Cron] Uncaught billing error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
