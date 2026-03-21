import { prisma } from "@/lib/prisma";
import { tbank } from "@/lib/payments/tbank";
import { getPlanBySlug } from "@/lib/payments/plans";

/**
 * Daily script to process expiring trials and charge cards
 */
async function processRecurringPayments() {
  console.log("Starting recurring payment processing...");
  
  const now = new Date();
  
  // 1. Find businesses whose trial ends today (or in the past) and have no active subscription extension yet
  // Also must have a rebillId
  const businessesToCharge = await (prisma as any).business.findMany({
    where: {
      trialEndsAt: {
        lte: now,
      },
      rebillId: {
        not: null,
      },
      subscriptionStatus: "ACTIVE",
      subscriptionExpiresAt: {
        lte: now,
      }
    },
  });

  console.log(`Found ${businessesToCharge.length} businesses to charge.`);

  for (const business of businessesToCharge) {
    try {
      if (!business.currentPlanSlug) {
        console.error(`Business ${business.id} has no plan slug. Skipping.`);
        continue;
      }

      const plan = getPlanBySlug(business.currentPlanSlug);
      if (!plan) {
        console.error(`Plan ${business.currentPlanSlug} not found. Skipping.`);
        continue;
      }

      console.log(`Charging business ${business.id} for plan ${plan.name} (${plan.monthlyPrice / 100} RUB)`);

      // 1. Init a new payment for the full amount
      const orderId = `RECURRING_${business.id}_${Date.now()}`;
      const initResult = await tbank.init({
        Amount: plan.monthlyPrice,
        OrderId: orderId,
        Description: `Subscription Payment - ${plan.name}`,
        CustomerKey: business.userId,
      });

      if (!initResult.Success) {
         throw new Error(`Init failed: ${initResult.Message}`);
      }

      // 2. Charge using RebillId
      if (!business.rebillId) continue; // Safety check
      
      const chargeResult = await tbank.charge({
        PaymentId: initResult.PaymentId,
        RebillId: business.rebillId,
      });

      if (chargeResult.Success && (chargeResult.Status === "CONFIRMED" || chargeResult.Status === "AUTHORIZED")) {
        // Success! Extend subscription by 1 month
        const newExpiry = new Date();
        newExpiry.setMonth(newExpiry.getMonth() + 1);

        await (prisma as any).business.update({
          where: { id: business.id },
          data: {
            subscriptionExpiresAt: newExpiry,
            subscriptionStatus: "ACTIVE",
          },
        });

        // Record successful payment
        await (prisma as any).payment.create({
          data: {
            businessId: business.id,
            amount: plan.monthlyPrice,
            status: "CONFIRMED",
            orderId: orderId,
            tbankPaymentId: chargeResult.PaymentId,
            recurrent: true,
            rebillId: (business as any).rebillId,
          },
        });

        console.log(`Successfully charged and extended subscription for ${business.id}`);
      } else {
        console.error(`Charge failed for ${business.id}: ${chargeResult.Message || chargeResult.Status}`);
        // Handle failure (e.g., mark subscription as EXPIRED or INACTIVE)
        await prisma.business.update({
          where: { id: business.id },
          data: { subscriptionStatus: "INACTIVE" },
        });
      }
    } catch (error) {
      console.error(`Error processing business ${business.id}:`, error);
    }
  }

  console.log("Finished recurring payment processing.");
}

// Run the script
processRecurringPayments()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
