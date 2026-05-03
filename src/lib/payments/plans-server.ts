import { db } from "@/db";
import { platformSettings } from "@/db/schema";
import { PLANS } from "./plans";

/**
 * Build a plan-slug → price mapping from platform_settings values.
 * The yearly price is calculated as monthly × 12 × 0.8 (20% discount).
 */
export function buildPlanPricesFromSettings(settings: {
  tierBusinessPrice: number;
  tierContentPrice: number;
  tierBusinessProPrice: number;
  tierBusinessPlusPrice: number;
}): Record<string, { monthlyPrice: number; yearlyPrice: number }> {
  return {
    business: {
      monthlyPrice: settings.tierBusinessPrice,
      yearlyPrice: Math.round(settings.tierBusinessPrice * 12 * 0.8),
    },
    content: {
      monthlyPrice: settings.tierContentPrice,
      yearlyPrice: Math.round(settings.tierContentPrice * 12 * 0.8),
    },
    "business-pro": {
      monthlyPrice: settings.tierBusinessProPrice,
      yearlyPrice: Math.round(settings.tierBusinessProPrice * 12 * 0.8),
    },
    "business-plus": {
      monthlyPrice: settings.tierBusinessPlusPrice,
      yearlyPrice: Math.round(settings.tierBusinessPlusPrice * 12 * 0.8),
    },
  };
}

/**
 * Server-only: Fetch live plan prices from platform_settings.
 * Falls back to static PLANS if the DB query fails.
 */
export async function getLivePlanPricing(): Promise<Record<string, { monthlyPrice: number; yearlyPrice: number }>> {
  try {
    const rows = await db.select().from(platformSettings).limit(1);
    if (rows.length > 0) {
      return buildPlanPricesFromSettings(rows[0]);
    }
  } catch (err) {
    console.error("[getLivePlanPricing] Failed to fetch from DB, using static PLANS:", err);
  }

  // Fallback to static PLANS
  return Object.fromEntries(
    Object.entries(PLANS).map(([slug, plan]) => [
      slug,
      { monthlyPrice: plan.monthlyPrice, yearlyPrice: plan.yearlyPrice },
    ])
  );
}
