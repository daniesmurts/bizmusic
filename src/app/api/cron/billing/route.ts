import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, payments, users } from "@/db/schema";
import { eq, and, lte, isNotNull, desc } from "drizzle-orm";
import { tbank } from "@/lib/payments/tbank";
import { PLANS } from "@/lib/payments/plans";
import { getLivePlanPricing } from "@/lib/payments/plans-server";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

function verifyCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (authHeader.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
}

export const dynamic = 'force-dynamic';

const MAX_BILLING_RETRIES = 3;

export async function GET(req: Request) {
  try {
    // 1. Security: always require CRON_SECRET
    if (!verifyCronSecret(req)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const now = new Date();

    // 2. Fetch LIVE prices from platform_settings (falls back to static PLANS)
    const livePrices = await getLivePlanPricing();
    console.log("[Cron] Live pricing loaded:", Object.entries(livePrices).map(([k, v]) => `${k}=${v.monthlyPrice}`).join(", "));

    // 3. Find businesses that are ACTIVE, have a RebillId, and are past their expiration date.
    // Refactored to join with users to avoid N+1 queries in the loop and prevent 
    // lateral join issues (Issue 5).
    const dueBusinesses = await db
      .select({
        business: businesses,
        owner: users,
      })
      .from(businesses)
      .leftJoin(users, eq(businesses.userId, users.id))
      .where(and(
        eq(businesses.subscriptionStatus, "ACTIVE"),
        isNotNull(businesses.rebillId),
        lte(businesses.subscriptionExpiresAt, now)
      ));

    const results = [];

    // 3. Process each due subscription
    for (const { business, owner } of dueBusinesses) {
      try {
        if (!owner?.email) {
          throw new Error(`Owner email not found for business ${business.id}`);
        }
        const planSlug = business.currentPlanSlug || "content"; // Fallback to content tier if null
        const plan = PLANS[planSlug];
        const livePrice = livePrices[planSlug];
        
        if (!plan && !livePrice) {
          throw new Error(`Invalid plan slug: ${planSlug}`);
        }

        const shortBizId = business.id.replace(/-/g, "").substring(0, 10);
        const orderId = `REN_${shortBizId}_${Date.now()}`;
        const safeCustomerKey = business.userId.replace(/-/g, "").substring(0, 36);

        // Use live DB prices; fall back to static PLANS if DB returned nothing for this slug
        const pricing = livePrice || { monthlyPrice: plan.monthlyPrice, yearlyPrice: plan.yearlyPrice };
        const priceToCharge = business.billingInterval === "yearly" ? pricing.yearlyPrice : pricing.monthlyPrice;
        
        // --- NEW: Handle scheduled cancellation ---
        if (business.cancelAtPeriodEnd) {
          console.log(`[Cron] Business ${business.id} has cancelAtPeriodEnd set. Expiring subscription.`);
          await db.update(businesses)
            .set({
              subscriptionStatus: "EXPIRED",
              cancelAtPeriodEnd: false,
              updatedAt: new Date()
            })
            .where(eq(businesses.id, business.id));
          
          results.push({ businessId: business.id, status: "expired_on_request" });

          // Send expiration email
          try {
            if (owner.email) {
              const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizmuzik.ru";
              await sendEmail({
                to: owner.email,
                subject: "Срок действия лицензии истекает — Бизмюзик",
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #333;">Подписка завершена</h1>
                    <p>Здравствуйте!</p>
                    <p>Ваша подписка BizMusic завершена, как вы и запланировали. Доступ к музыкальным каталогам приостановлен.</p>
                    <p>Если вы хотите возобновить подписку, вы можете сделать это в любой момент.</p>
                    <p style="margin-top: 24px;">
                      <a href="${appUrl}/dashboard/subscription"
                         style="background: #c6f135; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                        Возобновить подписку
                      </a>
                    </p>
                    <p style="color: #999; font-size: 12px; margin-top: 32px;">© BizMusic — легальная музыка для бизнеса</p>
                  </div>
                `,
              });
            }
          } catch (emailError) {
            console.error("[Cron] Failed to send expiration email:", emailError);
          }

          continue; // Skip initialization and charging
        }
        // ------------------------------------------

        // A. Initialize the recurring payment
        const initResult = await tbank.init({
          Amount: priceToCharge,
          OrderId: orderId,
          Description: `Продление подписки - ${plan?.name || planSlug} (${business.billingInterval === "yearly" ? "Год" : "Месяц"})`,
          Recurrent: 'Y',
          CustomerKey: safeCustomerKey,
          Receipt: {
            Email: owner.email,
            Taxation: 'usn_income_outcome',
            Items: [
              {
                Name: `Продление подписки - ${plan?.name || planSlug} (${business.billingInterval === "yearly" ? "Год" : "Месяц"})`,
                Price: priceToCharge,
                Quantity: 1,
                Amount: priceToCharge,
                Tax: 'none',
                PaymentMethod: 'full_prepayment',
                PaymentObject: 'service'
              }
            ]
          }
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
          paymentType: "subscription",
          recurrent: true,
          rebillId: business.rebillId,
          errorCode: chargeResult.ErrorCode !== "0" ? chargeResult.ErrorCode : null,
        });

        if (chargeResult.Success) {
          // Extend from the current period end (not now) to avoid losing time when cron runs late
          const nextExpiration = new Date(business.subscriptionExpiresAt!);
          if (business.billingInterval === "yearly") {
            nextExpiration.setFullYear(nextExpiration.getFullYear() + 1);
          } else {
            nextExpiration.setMonth(nextExpiration.getMonth() + 1);
          }

          // Calculate new monthly usage period bounds
          const newPeriodStart = new Date(Date.UTC(
            nextExpiration.getUTCFullYear(),
            nextExpiration.getUTCMonth() - (business.billingInterval === "yearly" ? 12 : 1),
            nextExpiration.getUTCDate(), 0, 0, 0, 0
          ));
          const periodStartForCounters = new Date(Math.max(newPeriodStart.getTime(), now.getTime()));

          await db.update(businesses)
            .set({
              subscriptionExpiresAt: nextExpiration,
              cardMask: chargeResult.Pan || business.cardMask,
              cardExpiry: chargeResult.ExpDate || business.cardExpiry,
              // Reset monthly usage counters for new billing period
              ttsMonthlyUsed: 0,
              ttsMonthlyPeriodStart: periodStartForCounters,
              ttsMonthlyPeriodEnd: nextExpiration,
              aiMonthlyUsed: 0,
              aiMonthlyPeriodStart: periodStartForCounters,
              aiMonthlyPeriodEnd: nextExpiration,
              updatedAt: new Date()
            })
            .where(eq(businesses.id, business.id));

          results.push({ businessId: business.id, status: "renewed" });

          // Send renewal confirmation email
          try {
            if (owner?.email) {
              const nextExpiryFormatted = nextExpiration.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
              const amountFormatted = (priceToCharge / 100).toLocaleString("ru-RU");
              await sendEmail({
                to: owner.email,
                subject: "Подписка продлена — BizMusic",
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #333;">Подписка продлена!</h1>
                    <p>Здравствуйте!</p>
                    <p>Мы успешно списали <strong>${amountFormatted} ₽</strong> за продление подписки <strong>${plan.name}</strong>.</p>
                    <p>Следующая дата продления: <strong>${nextExpiryFormatted}</strong>.</p>
                    <p style="margin-top: 24px;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://bizmuzik.ru'}/dashboard"
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
            console.error("[Cron] Failed to send renewal email:", emailError);
          }
        } else {
          // Failure: Count consecutive recent failures (stop at first non-REJECTED)
          const recentPayments = await db.query.payments.findMany({
            where: eq(payments.businessId, business.id),
            orderBy: [desc(payments.createdAt)],
            limit: MAX_BILLING_RETRIES + 1,
          });
          let consecutiveFailures = 0;
          for (const p of recentPayments) {
            if (p.status === "REJECTED") {
              consecutiveFailures++;
            } else {
              break;
            }
          }
          const recentFailures = { length: consecutiveFailures };

          if (recentFailures.length >= MAX_BILLING_RETRIES) {
            // Too many consecutive failures — expire the subscription
            await db.update(businesses)
              .set({
                subscriptionStatus: "EXPIRED",
                updatedAt: new Date()
              })
              .where(eq(businesses.id, business.id));
            results.push({ businessId: business.id, status: "expired", error: `${MAX_BILLING_RETRIES} consecutive failures` });

            // Send subscription expired due to payment failure email
            try {
              if (owner?.email) {
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizmuzik.ru";
                await sendEmail({
                  to: owner.email,
                  subject: "Подписка приостановлена — требуется действие",
                  html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                      <h1 style="color: #e53e3e;">Подписка приостановлена</h1>
                      <p>Здравствуйте!</p>
                      <p>Нам не удалось списать средства за продление подписки после ${MAX_BILLING_RETRIES} попыток. Доступ к сервису приостановлен.</p>
                      <p>Пожалуйста, обновите платёжные данные, чтобы восстановить доступ.</p>
                      <p style="margin-top: 24px;">
                        <a href="${appUrl}/dashboard/subscription"
                           style="background: #e53e3e; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                          Обновить способ оплаты
                        </a>
                      </p>
                      <p style="color: #999; font-size: 12px; margin-top: 32px;">© BizMusic — легальная музыка для бизнеса</p>
                    </div>
                  `,
                });
              }
            } catch (emailError) {
              console.error("[Cron] Failed to send expiration email:", emailError);
            }
          } else {
            // Not enough failures yet — leave ACTIVE for next cron retry
            results.push({ businessId: business.id, status: "retry_pending", error: chargeResult.Message });

            // Send payment failure warning on first failure only
            if (recentFailures.length === 1) {
              try {
                if (owner?.email) {
                  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizmuzik.ru";
                  await sendEmail({
                    to: owner.email,
                    subject: "Ошибка оплаты — проверьте карту",
                    html: `
                      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #dd6b20;">Не удалось списать средства</h1>
                        <p>Здравствуйте!</p>
                        <p>При попытке продлить вашу подписку произошла ошибка списания. Мы повторим попытку автоматически.</p>
                        <p>Пожалуйста, убедитесь, что на карте достаточно средств, или обновите платёжные данные.</p>
                        <p style="margin-top: 24px;">
                          <a href="${appUrl}/dashboard/subscription"
                             style="background: #dd6b20; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                            Проверить подписку
                          </a>
                        </p>
                        <p style="color: #999; font-size: 12px; margin-top: 32px;">© BizMusic — легальная музыка для бизнеса</p>
                      </div>
                    `,
                  });
                }
              } catch (emailError) {
                console.error("[Cron] Failed to send retry warning email:", emailError);
              }
            }
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
