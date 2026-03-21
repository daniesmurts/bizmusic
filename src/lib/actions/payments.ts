"use server";

import { prisma } from "@/lib/prisma";
import { tbank } from "@/lib/payments/tbank";
import { getPlanBySlug } from "@/lib/payments/plans";
import { revalidatePath } from "next/cache";

export async function startFreeTrial(businessId: string, planSlug: string) {
  const plan = getPlanBySlug(planSlug);
  if (!plan) throw new Error("Plan not found");

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { user: true },
  });

  if (!business) throw new Error("Business not found");

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
  await (prisma as any).payment.create({
    data: {
      businessId,
      amount: 100,
      status: "NEW",
      orderId: orderId,
      tbankPaymentId: initResult.PaymentId,
      recurrent: true,
    },
  });

  // Update business with selected plan
  await (prisma as any).business.update({
    where: { id: businessId },
    data: { currentPlanSlug: planSlug }
  });

  return { paymentUrl: initResult.PaymentURL };
}

export async function getPaymentStatus(orderId: string) {
  const payment = await prisma.payment.findUnique({
    where: { orderId },
  });

  return payment?.status;
}
