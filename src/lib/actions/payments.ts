"use server";

import { db } from "@/db";
import { businesses, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { tbank } from "@/lib/payments/tbank";
import { getPlanBySlug } from "@/lib/payments/plans";
import { createClient } from "@/utils/supabase/server";

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

    // Create payment record and update business plan in a single transaction
    await db.transaction(async (tx) => {
      await tx.insert(payments).values({
        businessId,
        amount: 100,
        status: "NEW",
        orderId: orderId,
        tbankPaymentId: initResult.PaymentId,
        recurrent: true,
      });

      // Store selected plan/interval for the webhook to activate on confirmation
      await tx.update(businesses)
        .set({ 
          currentPlanSlug: planSlug,
          billingInterval: interval,
        })
        .where(eq(businesses.id, businessId));
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
