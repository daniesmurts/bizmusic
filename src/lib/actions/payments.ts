"use server";

import { db } from "@/db";
import { businesses, payments, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { tbank } from "@/lib/payments/tbank";
import { getPlanBySlug, getTtsTokenPackById } from "@/lib/payments/plans";
import { createClient } from "@/utils/supabase/server";
import { sendEmail } from "@/lib/email";

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
    with: { business: { columns: { userId: true } } },
  });

  // Ensure the user owns the business associated with this payment
  if (!payment || payment.business.userId !== user.id) return undefined;

  return payment.status;
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
