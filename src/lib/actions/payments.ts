"use server";

import { db } from "@/db";
import { businesses, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { tbank } from "@/lib/payments/tbank";
import { getPlanBySlug } from "@/lib/payments/plans";

export async function startFreeTrial(businessId: string, planSlug: string) {
  const plan = getPlanBySlug(planSlug);
  if (!plan) throw new Error("Plan not found");

  const { createClient } = await import("@/utils/supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    with: { user: true },
  });

  if (!business) {
    throw new Error("Business not found");
  }

  if (business.userId !== user.id) {
    throw new Error("Forbidden: You do not own this business");
  }

  // Create a pending payment record
  const orderId = `TRIAL_${businessId}_${Date.now()}`;
  
  // 1.00 RUB for verification (100 kopeks)
  const initResult = await tbank.init({
    Amount: 100,
    OrderId: orderId,
    Description: `Free Trial Verification - ${plan.name}`,
    Recurrent: 'Y',
    CustomerKey: business.userId,
    SuccessURL: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription/success?orderId=${orderId}`,
    FailURL: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription/failure?orderId=${orderId}`,
    NotificationURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/notification`,
    DATA: {
        planSlug: planSlug,
        businessId: businessId
    }
  });

  if (!initResult.Success) {
    throw new Error(initResult.Message || "Failed to initialize payment");
  }

  // Create payment record in DB
  await db.insert(payments).values({
    businessId,
    amount: 100,
    status: "NEW",
    orderId: orderId,
    tbankPaymentId: initResult.PaymentId,
    recurrent: true,
  });

  // Update business with selected plan
  await db.update(businesses)
    .set({ currentPlanSlug: planSlug })
    .where(eq(businesses.id, businessId));

  return { paymentUrl: initResult.PaymentURL };
}

export async function getPaymentStatus(orderId: string) {
  const payment = await db.query.payments.findFirst({
    where: eq(payments.orderId, orderId),
  });

  return payment?.status;
}
