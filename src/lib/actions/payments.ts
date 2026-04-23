"use server";

import { db } from "@/db";
import {
  brandVoiceModels,
  businessAnnouncementAcquisitions,
  businesses,
  payments,
  platformAnnouncementProducts,
  users,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { tbank } from "@/lib/payments/tbank";
import { getPlanBySlug, getTtsTokenPackById } from "@/lib/payments/plans";
import { createClient } from "@/utils/supabase/server";
import { sendEmail } from "@/lib/email";
import { validateBusinessLegalData } from "@/lib/validation/business";

const BRAND_VOICE_TIERS = {
  starter: {
    setupKopeks: 2_500_000,
    monthlyKopeks: 390_000,
    monthlyChars: 10_000,
    overageKopeksPer1000: 9_000,
    label: "Старт",
  },
  business: {
    setupKopeks: 3_500_000,
    monthlyKopeks: 790_000,
    monthlyChars: 50_000,
    overageKopeksPer1000: 7_000,
    label: "Бизнес",
  },
  enterprise: {
    setupKopeks: 6_000_000,
    monthlyKopeks: 1_490_000,
    monthlyChars: 250_000,
    overageKopeksPer1000: 5_000,
    label: "Корпоратив",
  },
} as const;

type BrandVoiceTier = keyof typeof BRAND_VOICE_TIERS;

export async function startFreeTrial(businessId: string, planSlug: string, interval: "monthly" | "yearly" = "monthly") {
  try {
    const plan = getPlanBySlug(planSlug);
    if (!plan) return { success: false, error: "Тариф не найден" };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Авторизация обязательна" };
    }

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
      with: { user: true },
    });

    if (!business) {
      return { success: false, error: "Бизнес не найден" };
    }

    if (business.userId !== user.id) {
      return { success: false, error: "Отказано в доступе: вы не являетесь владельцем" };
    }

    if (business.subscriptionStatus === "ACTIVE") {
      return { success: false, error: "У вас уже есть активная подписка. Для смены тарифа обратитесь в поддержку." };
    }

    const legalValidation = validateBusinessLegalData(
      {
        inn: business.inn,
        legalName: business.legalName,
        address: business.address,
      },
      { requireAll: true }
    );

    if (!legalValidation.isValid) {
      return {
        success: false,
        error: `${legalValidation.error || "Перед покупкой заполните обязательные реквизиты компании"}. Перейдите в /dashboard/setup`,
      };
    }

    // Checking if TBANK API keys exist
    if (!process.env.TBANK_TERMINAL_KEY || !process.env.TBANK_PASSWORD) {
      console.error("Missing T-Bank credentials in environment.");
      return { success: false, error: "Платежный шлюз не настроен (Отсутствуют ключи T-Bank)" };
    }

    // Create a pending payment record. T-Bank strictly requires OrderId to be <= 36 characters.
    const shortBizId = businessId.replace(/-/g, "").substring(0, 10);
    const orderId = `TRL_${shortBizId}_${Date.now()}`;
    const safeCustomerKey = business.userId.replace(/-/g, "").substring(0, 36);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizmuzik.ru";
    
    // 1.00 RUB for verification (100 kopeks)
    const initResult = await tbank.init({
      Amount: 100,
      OrderId: orderId,
      Description: `Верификация карты - ${plan.name}`,
      ...(process.env.TBANK_TEST_MODE === 'true' ? {} : { Recurrent: 'Y' }),
      CustomerKey: safeCustomerKey,
      SuccessURL: `${appUrl}/dashboard/subscription/success?orderId=${orderId}`,
      FailURL: `${appUrl}/dashboard/subscription/failure?orderId=${orderId}`,
      NotificationURL: `${appUrl}/api/payments/notification`,
      Receipt: {
        Email: user.email,
        Taxation: 'usn_income_outcome',
        Items: [
          {
            Name: `Верификация карты - ${plan.name}`,
            Price: 100,
            Quantity: 1,
            Amount: 100,
            Tax: 'none',
            PaymentMethod: 'full_prepayment',
            PaymentObject: 'service'
          }
        ]
      },
      DATA: {
          planSlug: planSlug,
          businessId: businessId,
          interval: interval
      }
    });

    if (!initResult.Success) {
      console.error("T-Bank Init Failed:", initResult);
      return { success: false, error: initResult.Message || initResult.Details || "Ошибка инициализации платежа" };
    }

    await db.insert(payments).values({
      businessId,
      amount: 100,
      status: "NEW",
      orderId: orderId,
      tbankPaymentId: initResult.PaymentId,
      paymentType: "subscription",
      metadata: {
        planSlug,
        interval,
      },
      recurrent: true,
    });

    return { 
      success: true, 
      paymentUrl: initResult.PaymentURL 
    };
  } catch (error: unknown) {
    console.error("Payment action error:", error);
    const message = error instanceof Error ? error.message : "Внутренняя ошибка сервера";
    return { success: false, error: message };
  }
}

export async function getPaymentStatus(orderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return undefined;

  const payment = await db.query.payments.findFirst({
    where: eq(payments.orderId, orderId),
    with: { business: { columns: { userId: true, trialEndsAt: true } } },
  });

  // Ensure the user owns the business associated with this payment
  if (!payment || payment.business.userId !== user.id) return undefined;

  return {
    status: payment.status,
    trialEndsAt: payment.business.trialEndsAt?.toISOString() ?? null,
  };
}

export async function cancelSubscription(businessId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Авторизация обязательна" };
    }

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
    });

    if (!business) {
      return { success: false, error: "Бизнес не найден" };
    }

    if (business.userId !== user.id) {
      return { success: false, error: "Отказано в доступе: вы не являетесь владельцем" };
    }

    if (business.subscriptionStatus !== "ACTIVE") {
      return { success: false, error: "Нет активной подписки для отмены" };
    }

    await db.update(businesses)
      .set({ cancelAtPeriodEnd: true })
      .where(eq(businesses.id, businessId));

    // Send cancellation confirmation email
    try {
      const owner = await db.query.users.findFirst({ where: eq(users.id, business.userId) });
      if (owner?.email) {
        const expiryFormatted = business.subscriptionExpiresAt
          ? business.subscriptionExpiresAt.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
          : "конца оплаченного периода";
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizmuzik.ru";
        await sendEmail({
          to: owner.email,
          subject: "Автопродление отключено — BizMusic",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Автопродление отключено</h1>
              <p>Здравствуйте!</p>
              <p>Вы отменили автопродление подписки. Ваш доступ сохранится до <strong>${expiryFormatted}</strong>.</p>
              <p>Если вы передумаете, вы можете возобновить подписку в любой момент в личном кабинете.</p>
              <p style="margin-top: 24px;">
                <a href="${appUrl}/dashboard/subscription"
                   style="background: #c6f135; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Управление подпиской
                </a>
              </p>
              <p style="color: #999; font-size: 12px; margin-top: 32px;">© BizMusic — легальная музыка для бизнеса</p>
            </div>
          `,
        });
      }
    } catch (emailError) {
      console.error("[CancelSub] Failed to send email:", emailError);
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Cancel subscription error:", error);
    const message = error instanceof Error ? error.message : "Внутренняя ошибка сервера";
    return { success: false, error: message };
  }
}

export async function reactivateSubscription(businessId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Авторизация обязательна" };
    }

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
    });

    if (!business) {
      return { success: false, error: "Бизнес не найден" };
    }

    if (business.userId !== user.id) {
      return { success: false, error: "Отказано в доступе: вы не являетесь владельцем" };
    }

    if (business.subscriptionStatus !== "ACTIVE" || !business.cancelAtPeriodEnd) {
      return { success: false, error: "Подписка не ожидает отмены" };
    }

    await db.update(businesses)
      .set({ cancelAtPeriodEnd: false })
      .where(eq(businesses.id, businessId));

    // Send reactivation confirmation email
    try {
      const owner = await db.query.users.findFirst({ where: eq(users.id, business.userId) });
      if (owner?.email) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizmuzik.ru";
        await sendEmail({
          to: owner.email,
          subject: "Подписка восстановлена — BizMusic",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Автопродление восстановлено!</h1>
              <p>Здравствуйте!</p>
              <p>Вы возобновили автопродление подписки. Она будет автоматически продлена по окончании текущего периода.</p>
              <p style="margin-top: 24px;">
                <a href="${appUrl}/dashboard/subscription"
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
      console.error("[ReactivateSub] Failed to send email:", emailError);
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Reactivate subscription error:", error);
    const message = error instanceof Error ? error.message : "Внутренняя ошибка сервера";
    return { success: false, error: message };
  }
}

export async function removePaymentMethod(businessId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Авторизация обязательна" };
    }

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
    });

    if (!business) {
      return { success: false, error: "Бизнес не найден" };
    }

    if (business.userId !== user.id) {
      return { success: false, error: "Отказано в доступе: вы не являетесь владельцем" };
    }

    // If subscription is ACTIVE, schedule cancellation at period end
    // since without a rebillId the cron billing can't charge
    const updateData: Record<string, unknown> = {
      rebillId: null,
      cardMask: null,
      cardExpiry: null,
      updatedAt: new Date(),
    };
    if (business.subscriptionStatus === "ACTIVE") {
      updateData.cancelAtPeriodEnd = true;
    }

    await db.update(businesses)
      .set(updateData)
      .where(eq(businesses.id, businessId));

    return { success: true };
  } catch (error: unknown) {
    console.error("Remove payment method error:", error);
    const message = error instanceof Error ? error.message : "Внутренняя ошибка сервера";
    return { success: false, error: message };
  }
}

export async function startBrandVoiceSetupPaymentAction(modelId: string, tier: BrandVoiceTier) {
  try {
    const tierConfig = BRAND_VOICE_TIERS[tier];
    if (!tierConfig) {
      return { success: false, error: "Неизвестный тариф Brand Voice" };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Авторизация обязательна" };
    }

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.userId, user.id),
      with: { user: true },
    });

    if (!business) {
      return { success: false, error: "Бизнес не найден" };
    }

    const model = await db.query.brandVoiceModels.findFirst({
      where: and(eq(brandVoiceModels.id, modelId), eq(brandVoiceModels.businessId, business.id)),
      with: { actor: true },
    });

    if (!model) {
      return { success: false, error: "Модель Brand Voice не найдена" };
    }

    if (!process.env.TBANK_TERMINAL_KEY || !process.env.TBANK_PASSWORD) {
      return { success: false, error: "Платежный шлюз не настроен" };
    }

    const shortBizId = business.id.replace(/-/g, "").substring(0, 10);
    const orderId = `BVS_${shortBizId}_${Date.now()}`;
    const safeCustomerKey = business.userId.replace(/-/g, "").substring(0, 36);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizmuzik.ru";

    const initResult = await tbank.init({
      Amount: tierConfig.setupKopeks,
      OrderId: orderId,
      Description: `Brand Voice setup: ${tierConfig.label}`,
      Recurrent: "N",
      CustomerKey: safeCustomerKey,
      SuccessURL: `${appUrl}/dashboard/brand-voice?setup=success`,
      FailURL: `${appUrl}/dashboard/brand-voice?setup=failed`,
      NotificationURL: `${appUrl}/api/payments/notification`,
      Receipt: {
        Email: user.email,
        Taxation: "usn_income_outcome",
        Items: [
          {
            Name: `Brand Voice Setup ${tierConfig.label}`,
            Price: tierConfig.setupKopeks,
            Quantity: 1,
            Amount: tierConfig.setupKopeks,
            Tax: "none",
            PaymentMethod: "full_prepayment",
            PaymentObject: "service",
          },
        ],
      },
      DATA: {
        type: "brand_voice_setup",
        modelId,
        tier,
        monthlyChars: String(tierConfig.monthlyChars),
        businessId: business.id,
      },
    });

    if (!initResult.Success) {
      return {
        success: false,
        error: initResult.Message || initResult.Details || "Ошибка инициализации платежа",
      };
    }

    await db.insert(payments).values({
      businessId: business.id,
      amount: tierConfig.setupKopeks,
      status: "NEW",
      orderId,
      tbankPaymentId: initResult.PaymentId,
      paymentType: "brand_voice_setup",
      metadata: {
        modelId,
        tier,
        monthlyChars: tierConfig.monthlyChars,
      },
      recurrent: false,
    });

    return {
      success: true,
      paymentUrl: initResult.PaymentURL,
    };
  } catch (error: unknown) {
    console.error("Start Brand Voice setup payment error:", error);
    const message = error instanceof Error ? error.message : "Внутренняя ошибка сервера";
    return { success: false, error: message };
  }
}

export async function purchaseBrandVoiceMonthlyAction(modelId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Авторизация обязательна" };
    }

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.userId, user.id),
      with: { user: true },
    });

    if (!business) {
      return { success: false, error: "Бизнес не найден" };
    }

    const model = await db.query.brandVoiceModels.findFirst({
      where: and(eq(brandVoiceModels.id, modelId), eq(brandVoiceModels.businessId, business.id)),
    });

    if (!model || !model.subscriptionTier) {
      return { success: false, error: "Модель Brand Voice не настроена для продления" };
    }

    const tier = model.subscriptionTier as BrandVoiceTier;
    const tierConfig = BRAND_VOICE_TIERS[tier];
    if (!tierConfig) {
      return { success: false, error: "Неизвестный тариф модели" };
    }

    if (!process.env.TBANK_TERMINAL_KEY || !process.env.TBANK_PASSWORD) {
      return { success: false, error: "Платежный шлюз не настроен" };
    }

    const shortBizId = business.id.replace(/-/g, "").substring(0, 10);
    const orderId = `BVM_${shortBizId}_${Date.now()}`;
    const safeCustomerKey = business.userId.replace(/-/g, "").substring(0, 36);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizmuzik.ru";

    const initResult = await tbank.init({
      Amount: tierConfig.monthlyKopeks,
      OrderId: orderId,
      Description: `Brand Voice monthly: ${tierConfig.label}`,
      Recurrent: "N",
      CustomerKey: safeCustomerKey,
      SuccessURL: `${appUrl}/dashboard/brand-voice?monthly=success`,
      FailURL: `${appUrl}/dashboard/brand-voice?monthly=failed`,
      NotificationURL: `${appUrl}/api/payments/notification`,
      Receipt: {
        Email: user.email,
        Taxation: "usn_income_outcome",
        Items: [
          {
            Name: `Brand Voice ${tierConfig.label} - месячный лимит`,
            Price: tierConfig.monthlyKopeks,
            Quantity: 1,
            Amount: tierConfig.monthlyKopeks,
            Tax: "none",
            PaymentMethod: "full_prepayment",
            PaymentObject: "service",
          },
        ],
      },
      DATA: {
        type: "brand_voice_monthly",
        modelId,
        tier,
        monthlyChars: String(tierConfig.monthlyChars),
        businessId: business.id,
      },
    });

    if (!initResult.Success) {
      return {
        success: false,
        error: initResult.Message || initResult.Details || "Ошибка инициализации платежа",
      };
    }

    await db.insert(payments).values({
      businessId: business.id,
      amount: tierConfig.monthlyKopeks,
      status: "NEW",
      orderId,
      tbankPaymentId: initResult.PaymentId,
      paymentType: "brand_voice_monthly",
      metadata: {
        modelId,
        tier,
        monthlyChars: tierConfig.monthlyChars,
      },
      recurrent: false,
    });

    return {
      success: true,
      paymentUrl: initResult.PaymentURL,
    };
  } catch (error: unknown) {
    console.error("Purchase Brand Voice monthly error:", error);
    const message = error instanceof Error ? error.message : "Внутренняя ошибка сервера";
    return { success: false, error: message };
  }
}

/**
 * \u0414\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u0441\u0438\u043c\u0432\u043e\u043b\u044b Brand Voice \u043f\u043e\u0432\u0435\u0440\u0445 \u043c\u0435\u0441\u044f\u0447\u043d\u043e\u0433\u043e \u043b\u0438\u043c\u0438\u0442\u0430 (\u043e\u0432\u0435\u0440\u0434\u0440\u0430\u0444\u0442).
 * blocksCount \u2014 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0431\u043b\u043e\u043a\u043e\u0432 \u043f\u043e 1000 \u0441\u0438\u043c\u0432\u043e\u043b\u043e\u0432.
 */
export async function purchaseBrandVoiceOverageAction(modelId: string, blocksCount: number) {
  try {
    if (!Number.isFinite(blocksCount) || blocksCount < 1 || blocksCount > 1000) {
      return { success: false, error: "\u041d\u0435\u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u043e\u0435 \u043a\u043e\u043b\u0438\u0447\u0435\u0441\u0442\u0432\u043e \u0431\u043b\u043e\u043a\u043e\u0432" };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "\u0410\u0432\u0442\u043e\u0440\u0438\u0437\u0430\u0446\u0438\u044f \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u0430" };

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.userId, user.id),
      with: { user: true },
    });
    if (!business) return { success: false, error: "\u0411\u0438\u0437\u043d\u0435\u0441 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d" };

    const model = await db.query.brandVoiceModels.findFirst({
      where: and(eq(brandVoiceModels.id, modelId), eq(brandVoiceModels.businessId, business.id)),
    });
    if (!model || !model.subscriptionTier) {
      return { success: false, error: "\u041c\u043e\u0434\u0435\u043b\u044c Brand Voice \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430" };
    }

    const tier = model.subscriptionTier as BrandVoiceTier;
    const tierConfig = BRAND_VOICE_TIERS[tier];
    if (!tierConfig) return { success: false, error: "\u041d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043d\u044b\u0439 \u0442\u0430\u0440\u0438\u0444 \u043c\u043e\u0434\u0435\u043b\u0438" };

    const totalKopeks = tierConfig.overageKopeksPer1000 * blocksCount;
    const overageChars = blocksCount * 1_000;

    if (!process.env.TBANK_TERMINAL_KEY || !process.env.TBANK_PASSWORD) {
      return { success: false, error: "\u041f\u043b\u0430\u0442\u0435\u0436\u043d\u044b\u0439 \u0448\u043b\u044e\u0437 \u043d\u0435 \u043d\u0430\u0441\u0442\u0440\u043e\u0435\u043d" };
    }

    const shortBizId = business.id.replace(/-/g, "").substring(0, 10);
    const orderId = `BVO_${shortBizId}_${Date.now()}`;
    const safeCustomerKey = business.userId.replace(/-/g, "").substring(0, 36);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizmuzik.ru";

    const initResult = await tbank.init({
      Amount: totalKopeks,
      OrderId: orderId,
      Description: `Brand Voice \u043e\u0432\u0435\u0440\u0434\u0440\u0430\u0444\u0442: ${overageChars.toLocaleString("ru-RU")} \u0441\u0438\u043c\u0432\u043e\u043b\u043e\u0432`,
      Recurrent: "N",
      CustomerKey: safeCustomerKey,
      SuccessURL: `${appUrl}/dashboard/brand-voice?overage=success`,
      FailURL: `${appUrl}/dashboard/brand-voice?overage=failed`,
      NotificationURL: `${appUrl}/api/payments/notification`,
      Receipt: {
        Email: user.email,
        Taxation: "usn_income_outcome",
        Items: [
          {
            Name: `Brand Voice \u043e\u0432\u0435\u0440\u0434\u0440\u0430\u0444\u0442 ${overageChars.toLocaleString("ru-RU")} \u0441\u0438\u043c.`,
            Price: tierConfig.overageKopeksPer1000,
            Quantity: blocksCount,
            Amount: totalKopeks,
            Tax: "none",
            PaymentMethod: "full_prepayment",
            PaymentObject: "service",
          },
        ],
      },
      DATA: {
        type: "brand_voice_overage",
        modelId,
        overageChars: String(overageChars),
        businessId: business.id,
      },
    });

    if (!initResult.Success) {
      return { success: false, error: initResult.Message || initResult.Details || "\u041e\u0448\u0438\u0431\u043a\u0430 \u0438\u043d\u0438\u0446\u0438\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u0438 \u043f\u043b\u0430\u0442\u0435\u0436\u0430" };
    }

    await db.insert(payments).values({
      businessId: business.id,
      amount: totalKopeks,
      status: "NEW",
      orderId,
      tbankPaymentId: initResult.PaymentId,
      paymentType: "brand_voice_overage",
      metadata: { modelId, overageChars },
      recurrent: false,
    });

    return { success: true, paymentUrl: initResult.PaymentURL };
  } catch (error: unknown) {
    console.error("Purchase Brand Voice overage error:", error);
    return { success: false, error: error instanceof Error ? error.message : "\u0412\u043d\u0443\u0442\u0440\u0435\u043d\u043d\u044f\u044f \u043e\u0448\u0438\u0431\u043a\u0430" };
  }
}

export async function purchaseTtsTokensAction(
  packId: "pack-5" | "pack-10" | "pack-25" | "pack-50"
) {
  try {
    const pack = getTtsTokenPackById(packId);
    if (!pack) {
      return { success: false, error: "Пакет токенов не найден" };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Авторизация обязательна" };
    }

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.userId, user.id),
      with: { user: true },
    });

    if (!business) {
      return { success: false, error: "Бизнес не найден" };
    }

    if (!process.env.TBANK_TERMINAL_KEY || !process.env.TBANK_PASSWORD) {
      return { success: false, error: "Платежный шлюз не настроен" };
    }

    const shortBizId = business.id.replace(/-/g, "").substring(0, 10);
    const orderId = `TOK_${shortBizId}_${Date.now()}`;
    const safeCustomerKey = business.userId.replace(/-/g, "").substring(0, 36);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizmuzik.ru";

    const initResult = await tbank.init({
      Amount: pack.price,
      OrderId: orderId,
      Description: `Пакет TTS: ${pack.label}`,
      Recurrent: "N",
      CustomerKey: safeCustomerKey,
      SuccessURL: `${appUrl}/dashboard/announcements?tokens=success`,
      FailURL: `${appUrl}/dashboard/announcements?tokens=failed`,
      NotificationURL: `${appUrl}/api/payments/notification`,
      Receipt: {
        Email: user.email,
        Taxation: "usn_income_outcome",
        Items: [
          {
            Name: `Пакет TTS ${pack.label}`,
            Price: pack.price,
            Quantity: 1,
            Amount: pack.price,
            Tax: "none",
            PaymentMethod: "full_prepayment",
            PaymentObject: "service",
          },
        ],
      },
      DATA: {
        type: "token_pack",
        packId: pack.id,
        businessId: business.id,
      },
    });

    if (!initResult.Success) {
      return {
        success: false,
        error: initResult.Message || initResult.Details || "Ошибка инициализации платежа",
      };
    }

    await db.insert(payments).values({
      businessId: business.id,
      amount: pack.price,
      status: "NEW",
      orderId,
      tbankPaymentId: initResult.PaymentId,
      paymentType: "token_pack",
      metadata: {
        packId: pack.id,
      },
      recurrent: false,
    });

    return {
      success: true,
      paymentUrl: initResult.PaymentURL,
    };
  } catch (error: unknown) {
    console.error("Purchase TTS tokens error:", error);
    const message = error instanceof Error ? error.message : "Внутренняя ошибка сервера";
    return { success: false, error: message };
  }
}

export async function purchasePlatformAnnouncementAction(platformAnnouncementId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Авторизация обязательна" };
    }

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.userId, user.id),
      with: { user: true },
    });

    if (!business) {
      return { success: false, error: "Бизнес не найден" };
    }

    const product = await db.query.platformAnnouncementProducts.findFirst({
      where: eq(platformAnnouncementProducts.id, platformAnnouncementId),
      with: { track: true },
    });

    if (!product || !product.isPublished) {
      return { success: false, error: "Анонс недоступен" };
    }

    if (product.accessModel !== "PAID") {
      return { success: false, error: "Этот анонс доступен бесплатно" };
    }

    const existingAcquisition = await db.query.businessAnnouncementAcquisitions.findFirst({
      where: and(
        eq(businessAnnouncementAcquisitions.businessId, business.id),
        eq(businessAnnouncementAcquisitions.platformAnnouncementId, platformAnnouncementId)
      ),
      columns: { id: true },
    });

    if (existingAcquisition) {
      return { success: false, error: "Этот анонс уже есть в вашей библиотеке" };
    }

    if (!process.env.TBANK_TERMINAL_KEY || !process.env.TBANK_PASSWORD) {
      return { success: false, error: "Платежный шлюз не настроен" };
    }

    const shortBizId = business.id.replace(/-/g, "").substring(0, 10);
    const orderId = `ANN_${shortBizId}_${Date.now()}`;
    const safeCustomerKey = business.userId.replace(/-/g, "").substring(0, 36);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizmuzik.ru";

    const initResult = await tbank.init({
      Amount: product.priceKopeks,
      OrderId: orderId,
      Description: `Готовый анонс: ${product.track.title}`,
      Recurrent: "N",
      CustomerKey: safeCustomerKey,
      SuccessURL: `${appUrl}/dashboard/announcements?announcement=success`,
      FailURL: `${appUrl}/dashboard/announcements?announcement=failed`,
      NotificationURL: `${appUrl}/api/payments/notification`,
      Receipt: {
        Email: user.email,
        Taxation: "usn_income_outcome",
        Items: [
          {
            Name: `Готовый анонс ${product.track.title}`,
            Price: product.priceKopeks,
            Quantity: 1,
            Amount: product.priceKopeks,
            Tax: "none",
            PaymentMethod: "full_prepayment",
            PaymentObject: "service",
          },
        ],
      },
      DATA: {
        type: "announcement_purchase",
        platformAnnouncementId,
        businessId: business.id,
      },
    });

    if (!initResult.Success) {
      return {
        success: false,
        error: initResult.Message || initResult.Details || "Ошибка инициализации платежа",
      };
    }

    await db.insert(payments).values({
      businessId: business.id,
      amount: product.priceKopeks,
      status: "NEW",
      orderId,
      tbankPaymentId: initResult.PaymentId,
      paymentType: "announcement_purchase",
      metadata: {
        platformAnnouncementId,
      },
      recurrent: false,
    });

    return {
      success: true,
      paymentUrl: initResult.PaymentURL,
    };
  } catch (error: unknown) {
    console.error("Purchase platform announcement error:", error);
    const message = error instanceof Error ? error.message : "Внутренняя ошибка сервера";
    return { success: false, error: message };
  }
}
