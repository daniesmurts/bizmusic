import { tbank } from "@/lib/payments/tbank";
import { db } from "@/db";
import {
  payments, businesses, users, ttsCreditLots, licenses, brandVoiceModels,
  referralAgents, referralConversions, commissionLedger,
} from "@/db/schema";
import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { generateLicenseAction } from "@/lib/actions/licenses";
import { grantPlatformAnnouncementToBusiness } from "@/lib/actions/platform-announcements";
import { validateBusinessLegalData } from "@/lib/validation/business";
import { buildRateLimitHeaders, checkRateLimit, getRequestIp } from "@/lib/middleware/rate-limit";
import {
  extractCreditsFromPaymentMetadata,
  isConfirmedPaymentStatus,
  shouldCreateCreditLot,
} from "@/lib/payments/webhook-credit-pack";

function getCurrentMonthBounds(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { start, end };
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // 1. Verify HMAC token FIRST — reject unauthenticated requests before any processing
    if (!tbank.checkNotificationToken(data)) {
      return new NextResponse("Invalid token", { status: 400 });
    }

    const { OrderId, Status, PaymentId, RebillId, ErrorCode, Amount, Pan, ExpDate } = data;

    // 2. Rate limit (keyed on verified fields only after HMAC passes)
    const rateLimitKey = `webhook:${getRequestIp(req)}:${String(OrderId || "unknown")}:${String(PaymentId || "unknown")}`;
    const rateLimit = checkRateLimit({
      key: rateLimitKey,
      maxRequests: 30,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return new NextResponse("Too many requests", {
        status: 429,
        headers: buildRateLimitHeaders(rateLimit.retryAfterSeconds),
      });
    }

    // 3. Validate required fields
    if (!OrderId || !Status || !PaymentId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // 3. Find the payment in DB
    const payment = await db.query.payments.findFirst({
      where: eq(payments.orderId, OrderId),
      with: { business: true },
    });

    if (!payment) {
      return new NextResponse("Payment not found", { status: 404 });
    }

    let wasAlreadyConfirmed = isConfirmedPaymentStatus(payment.status);

    // 5. Validate amount matches what we initiated
    if (typeof Amount === "number" && Amount !== payment.amount) {
      console.error(`[Webhook] Amount mismatch for ${OrderId}: expected ${payment.amount}, got ${Amount}`);
      return new NextResponse("Amount mismatch", { status: 400 });
    }

    // 6. Update payment status
    if (isConfirmedPaymentStatus(Status)) {
      const confirmationTransition = await db
        .update(payments)
        .set({
          status: Status,
          rebillId: RebillId || null,
          errorCode: ErrorCode || null,
          tbankPaymentId: PaymentId,
        })
        .where(
          and(
            eq(payments.orderId, OrderId),
            notInArray(payments.status, ["CONFIRMED", "AUTHORIZED"]),
          ),
        )
        .returning({ id: payments.id });

      wasAlreadyConfirmed = confirmationTransition.length === 0;
    } else {
      await db
        .update(payments)
        .set({
          status: Status,
          rebillId: RebillId || null,
          errorCode: ErrorCode || null,
          tbankPaymentId: PaymentId,
        })
        .where(eq(payments.orderId, OrderId));
    }

    // 7. Handle successful confirmation
    if (isConfirmedPaymentStatus(Status)) {
      if (payment.paymentType === "credit_pack") {
        const existingLot = await db.query.ttsCreditLots.findFirst({
          where: eq(ttsCreditLots.paymentId, payment.id),
          columns: { id: true },
        });

        if (shouldCreateCreditLot(payment.paymentType, Status, Boolean(existingLot))) {
          const metadata = payment.metadata ?? {};
          let rawCredits = 0;
          try {
            rawCredits = extractCreditsFromPaymentMetadata(metadata);
          } catch {
            console.error(`[Webhook] Invalid credits metadata for payment ${payment.id}`);
            return new NextResponse("Invalid credits metadata", { status: 400 });
          }

          const purchasedAt = new Date();
          const expiresAt = new Date(purchasedAt);
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);

          await db.insert(ttsCreditLots).values({
            businessId: payment.businessId,
            creditsTotal: rawCredits,
            creditsRemaining: rawCredits,
            purchasedAt,
            expiresAt,
            paymentId: payment.id,
          });
        }

        return new NextResponse("OK");
      }

      if (payment.paymentType === "announcement_purchase") {
        const metadata = payment.metadata ?? {};
        const platformAnnouncementId = typeof metadata.platformAnnouncementId === "string"
          ? metadata.platformAnnouncementId
          : null;

        if (!platformAnnouncementId) {
          console.error(`[Webhook] Missing platformAnnouncementId metadata for payment ${payment.id}`);
          return new NextResponse("Invalid announcement metadata", { status: 400 });
        }

        if (!wasAlreadyConfirmed) {
          await grantPlatformAnnouncementToBusiness({
            businessId: payment.businessId,
            platformAnnouncementId,
            paymentId: payment.id,
            pricePaidKopeks: payment.amount,
          });
        }

        return new NextResponse("OK");
      }

      if (payment.paymentType === "brand_voice_setup") {
        if (wasAlreadyConfirmed) {
          return new NextResponse("OK");
        }

        const metadata = payment.metadata ?? {};
        const modelId = typeof metadata.modelId === "string" ? metadata.modelId : null;
        const tier = typeof metadata.tier === "string" ? metadata.tier : null;
        const monthlyCharsRaw = typeof metadata.monthlyChars === "number"
          ? metadata.monthlyChars
          : Number(metadata.monthlyChars ?? 0);
        const monthlyChars = Number.isFinite(monthlyCharsRaw) ? Math.max(0, Math.floor(monthlyCharsRaw)) : 0;

        if (!modelId || !tier || monthlyChars <= 0) {
          console.error(`[Webhook] Invalid Brand Voice setup metadata for payment ${payment.id}`);
          return new NextResponse("Invalid brand voice setup metadata", { status: 400 });
        }

        const model = await db.query.brandVoiceModels.findFirst({
          where: eq(brandVoiceModels.id, modelId),
          with: { actor: true },
        });

        if (!model || model.businessId !== payment.businessId) {
          return new NextResponse("Brand Voice model not found", { status: 404 });
        }

        await db.update(brandVoiceModels)
          .set({
            setupPaymentId: payment.id,
            subscriptionTier: tier,
            monthlyCharsLimit: monthlyChars,
            status: model.actor.consentAcceptedAt && !model.actor.consentRevokedAt
              ? "SAMPLES_PENDING"
              : "CONSENT_PENDING",
            errorMessage: null,
          })
          .where(eq(brandVoiceModels.id, model.id));

        const { start, end } = getCurrentMonthBounds(new Date());
        await db.update(businesses)
          .set({
            brandVoiceMonthlyUsed: 0,
            brandVoiceMonthlyPeriodStart: start,
            brandVoiceMonthlyPeriodEnd: end,
          })
          .where(eq(businesses.id, payment.businessId));

        return new NextResponse("OK");
      }

      if (payment.paymentType === "brand_voice_monthly") {
        if (wasAlreadyConfirmed) {
          return new NextResponse("OK");
        }

        const metadata = payment.metadata ?? {};
        const modelId = typeof metadata.modelId === "string" ? metadata.modelId : null;
        const monthlyCharsRaw = typeof metadata.monthlyChars === "number"
          ? metadata.monthlyChars
          : Number(metadata.monthlyChars ?? 0);
        const monthlyChars = Number.isFinite(monthlyCharsRaw) ? Math.max(0, Math.floor(monthlyCharsRaw)) : 0;

        if (!modelId || monthlyChars <= 0) {
          console.error(`[Webhook] Invalid Brand Voice monthly metadata for payment ${payment.id}`);
          return new NextResponse("Invalid brand voice monthly metadata", { status: 400 });
        }

        const model = await db.query.brandVoiceModels.findFirst({
          where: eq(brandVoiceModels.id, modelId),
        });

        if (!model || model.businessId !== payment.businessId) {
          return new NextResponse("Brand Voice model not found", { status: 404 });
        }

        const now = new Date();
        const { start, end } = getCurrentMonthBounds(now);

        await db.update(brandVoiceModels)
          .set({
            monthlyCharsLimit: monthlyChars,
            monthlyCharsUsed: 0,
            monthlyPeriodStart: start,
            monthlyPeriodEnd: end,
            errorMessage: null,
          })
          .where(eq(brandVoiceModels.id, model.id));

        await db.update(businesses)
          .set({
            brandVoiceMonthlyUsed: 0,
            brandVoiceMonthlyPeriodStart: start,
            brandVoiceMonthlyPeriodEnd: end,
            brandVoiceOverageCharsPurchased: 0, // \u0421\u0431\u0440\u043e\u0441 \u043e\u0432\u0435\u0440\u0434\u0440\u0430\u0444\u0442\u0430 \u043f\u0440\u0438 \u043f\u0440\u043e\u0434\u043b\u0435\u043d\u0438\u0438
          })
          .where(eq(businesses.id, payment.businessId));

        return new NextResponse("OK");
      }

      if (payment.paymentType === "brand_voice_overage") {
        if (wasAlreadyConfirmed) {
          return new NextResponse("OK");
        }

        const metadata = payment.metadata ?? {};
        const overageCharsRaw = typeof metadata.overageChars === "number"
          ? metadata.overageChars
          : Number(metadata.overageChars ?? 0);
        const overageChars = Number.isFinite(overageCharsRaw) ? Math.max(0, Math.floor(overageCharsRaw)) : 0;

        if (overageChars <= 0) {
          console.error(`[Webhook] Invalid Brand Voice overage metadata for payment ${payment.id}`);
          return new NextResponse("Invalid brand voice overage metadata", { status: 400 });
        }

        await db.update(businesses)
          .set({
            brandVoiceOverageCharsPurchased: sql`"brandVoiceOverageCharsPurchased" + ${overageChars}`,
          })
          .where(eq(businesses.id, payment.businessId));

        return new NextResponse("OK");
      }

      if (wasAlreadyConfirmed) {
        return new NextResponse("OK");
      }

      const trialDurationDays = 7;
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDurationDays);

      const metadata = payment.metadata ?? {};
      const planSlug = typeof metadata.planSlug === "string" ? metadata.planSlug : payment.business.currentPlanSlug;
      const interval = metadata.interval === "yearly" ? "yearly" : "monthly";

      const legalValidation = validateBusinessLegalData(
        {
          inn: payment.business.inn,
          legalName: payment.business.legalName,
          address: payment.business.address,
        },
        { requireAll: true }
      );

      // Activate subscription and save plan info (moved from startFreeTrial)
      await db.update(businesses)
        .set({
          rebillId: RebillId || undefined,
          cardMask: Pan || undefined,
          cardExpiry: ExpDate || undefined,
          currentPlanSlug: planSlug,
          billingInterval: interval,
          trialEndsAt: trialEndsAt,
          subscriptionExpiresAt: trialEndsAt,
          subscriptionStatus: "ACTIVE",
          cancelAtPeriodEnd: false,
        })
        .where(eq(businesses.id, payment.businessId));

      // Generate license once after first successful activation.
      // Webhooks may be retried, so check if a valid license already exists.
      let generatedLicenseUrl: string | null = null;
      try {
        const latestLicense = await db.query.licenses.findFirst({
          where: eq(licenses.businessId, payment.businessId),
          orderBy: (licenses, { desc }) => [desc(licenses.issuedAt)],
        });

        if (!latestLicense && legalValidation.isValid) {
          const generationResult = await generateLicenseAction(payment.businessId);
          if (!generationResult.success) {
            console.error("[Webhook] License generation failed:", generationResult.error);
          } else {
            generatedLicenseUrl = generationResult.data?.pdfUrl || null;
          }
        }

        if (!legalValidation.isValid) {
          console.error(
            `[Webhook] Missing business legal fields for license generation (businessId=${payment.businessId}): ${legalValidation.error}`
          );
        }
      } catch (licenseError) {
        console.error("[Webhook] Unexpected license generation error:", licenseError);
      }

      // Send activation email — fire-and-forget so T-Bank gets a fast 200 OK
      db.query.users.findFirst({ where: eq(users.id, payment.business.userId) }).then((user) => {
        if (!user?.email) return;
        const trialEndFormatted = trialEndsAt.toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        return sendEmail({
          to: user.email,
          subject: "Подписка активирована — Бизмюзик",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Подписка активирована!</h1>
              <p>Здравствуйте!</p>
              <p>Ваш платёж успешно обработан. Пробный период активен до <strong>${trialEndFormatted}</strong>.</p>
              <p>Теперь вам доступен полный функционал платформы BizMusic для легального музыкального оформления вашего заведения.</p>
              ${generatedLicenseUrl ? `<p>Лицензионный пакет уже сформирован: <a href="${generatedLicenseUrl}">Скачать PDF</a></p>` : ""}
              <p style="margin-top: 24px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://bizmuzik.ru'}/dashboard"
                   style="background: #c6f135; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Перейти в кабинет
                </a>
              </p>
              <p style="color: #999; font-size: 12px; margin-top: 32px;">© Бизмюзик — легальная музыка для бизнеса</p>
            </div>
          `,
        });
      }).catch((emailError) => {
        console.error("[Webhook] Failed to send activation email:", emailError);
      });

      // --- REFERRAL COMMISSION BLOCK ---
      try {
        const userId = payment.business.userId;

        const userRow = await db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: { referredByAgentId: true },
        });

        if (userRow?.referredByAgentId) {
          const agentId = userRow.referredByAgentId;

          const agent = await db.query.referralAgents.findFirst({
            where: eq(referralAgents.id, agentId),
            columns: { commissionRate: true },
          });

          if (agent) {
            const amountKopecks = payment.amount;
            const commissionKopecks = Math.floor(amountKopecks * agent.commissionRate);

            const existingConversion = await db.query.referralConversions.findFirst({
              where: eq(referralConversions.referredUserId, userId),
              columns: { id: true },
            });

            let conversionId: string;
            if (!existingConversion) {
              const [newConversion] = await db.insert(referralConversions).values({
                agentId,
                referredUserId: userId,
                businessId: payment.businessId,
                status: "trial",
                firstPaymentAt: new Date(),
              }).returning({ id: referralConversions.id });
              conversionId = newConversion.id;
            } else {
              conversionId = existingConversion.id;
            }

            const periodDate = new Date();
            periodDate.setDate(1);
            periodDate.setHours(0, 0, 0, 0);
            const periodMonth = periodDate.toISOString().split("T")[0];

            await db.insert(commissionLedger).values({
              agentId,
              conversionId,
              periodMonth,
              subscriptionAmountKopecks: amountKopecks,
              commissionAmountKopecks: commissionKopecks,
              status: "pending",
            }).onConflictDoNothing();
          }
        }
      } catch (err) {
        console.error("[referral] commission error:", err);
      }
      // --- END REFERRAL COMMISSION BLOCK ---
    }

    // Handle refund/reversal — clawback commissions within 30 days
    if (Status === "REFUNDED" || Status === "REVERSED") {
      try {
        const userId = payment.business.userId;

        const conversion = await db.query.referralConversions.findFirst({
          where: and(
            eq(referralConversions.referredUserId, userId),
            inArray(referralConversions.status, ["trial", "active"])
          ),
          columns: { id: true, firstPaymentAt: true },
        });

        if (conversion) {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const isWithinClawback =
            conversion.firstPaymentAt && conversion.firstPaymentAt > thirtyDaysAgo;

          if (isWithinClawback) {
            await db.update(commissionLedger)
              .set({ status: "clawed_back" })
              .where(and(
                eq(commissionLedger.conversionId, conversion.id),
                inArray(commissionLedger.status, ["pending", "approved"])
              ));
          }

          await db.update(referralConversions)
            .set({ status: "churned" })
            .where(eq(referralConversions.id, conversion.id));
        }
      } catch (err) {
        console.error("[referral] clawback error:", err);
      }
    }

    // T-Bank requires 'OK' response to acknowledge notification
    return new NextResponse("OK");
  } catch (error) {
    console.error("Payment notification error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
