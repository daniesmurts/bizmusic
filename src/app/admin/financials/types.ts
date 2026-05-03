// ─── Financial Dashboard Types ──────────────────────────────────────────────────

export interface PlatformSettingsData {
  id: string;
  tierBusinessPrice: number;      // kopeks
  tierContentPrice: number;       // kopeks
  tierBusinessProPrice: number;   // kopeks
  tierBusinessPlusPrice: number;  // kopeks
  paymentProcessingFeePercent: number;
  taxRatePercent: number;
  ambassadorCommissionPercent: number;
  minimumPayoutThresholdKopeks: number;
  payoutDay: string;
  infrastructureCostKopeks: number;
  updatedAt: string;
}

export interface LiveData {
  subscribersByTier: Record<string, number>;
  totalActiveSubscribers: number;
  activeAmbassadors: number;
  totalPayoutsKopeks: number;
}

export interface TierConfig {
  slug: string;
  name: string;
  priceField: keyof PlatformSettingsData;
}

export const TIER_CONFIGS: TierConfig[] = [
  { slug: "business", name: "Бизнес", priceField: "tierBusinessPrice" },
  { slug: "content", name: "Контент", priceField: "tierContentPrice" },
  { slug: "business-pro", name: "Бизнес Про", priceField: "tierBusinessProPrice" },
  { slug: "business-plus", name: "Бизнес+", priceField: "tierBusinessPlusPrice" },
];

// ─── Calculation Helpers ────────────────────────────────────────────────────────

export interface TierMetrics {
  slug: string;
  name: string;
  priceKopeks: number;
  subscriberCount: number;
  revenue: number;          // kopeks
  ambassadorCut: number;    // kopeks
  processingFee: number;    // kopeks
  tax: number;              // kopeks
  netPerSubscriber: number; // kopeks
  netMarginPercent: number;
}

export interface PnLMetrics {
  mrr: number;                // kopeks
  ambassadorPayouts: number;  // kopeks
  processingFee: number;      // kopeks
  tax: number;                // kopeks
  infrastructureCost: number; // kopeks
  totalCosts: number;         // kopeks
  netProfit: number;          // kopeks
  netMarginPercent: number;
  breakEvenSubscribers: number;
  currentSubscribers: number;
  tierMetrics: TierMetrics[];
}

export interface RateOverrides {
  commissionPercent?: number;
  processingFeePercent?: number;
  taxPercent?: number;
}

export function calculatePnL(
  settings: PlatformSettingsData,
  subscribersByTier: Record<string, number>,
  infrastructureOverride?: number, // kopeks override for scenario mode
  rateOverrides?: RateOverrides,
): PnLMetrics {
  const commissionRate = (rateOverrides?.commissionPercent ?? settings.ambassadorCommissionPercent) / 100;
  const processingRate = (rateOverrides?.processingFeePercent ?? settings.paymentProcessingFeePercent) / 100;
  const taxRate = (rateOverrides?.taxPercent ?? settings.taxRatePercent) / 100;
  const infra = infrastructureOverride ?? settings.infrastructureCostKopeks;

  const tierMetrics: TierMetrics[] = TIER_CONFIGS.map((tier) => {
    const priceKopeks = settings[tier.priceField] as number;
    const count = subscribersByTier[tier.slug] || 0;
    const revenue = priceKopeks * count;
    const ambassadorCut = Math.round(revenue * commissionRate);
    const processingFee = Math.round(revenue * processingRate);
    const tax = Math.round(revenue * taxRate);
    const totalDeductions = ambassadorCut + processingFee + tax;
    const netPerSubscriber = count > 0 ? Math.round((revenue - totalDeductions) / count) : priceKopeks - Math.round(priceKopeks * (commissionRate + processingRate + taxRate));
    const netMarginPercent = priceKopeks > 0
      ? Math.round(((priceKopeks - Math.round(priceKopeks * (commissionRate + processingRate + taxRate))) / priceKopeks) * 10000) / 100
      : 0;

    return {
      slug: tier.slug,
      name: tier.name,
      priceKopeks,
      subscriberCount: count,
      revenue,
      ambassadorCut,
      processingFee,
      tax,
      netPerSubscriber,
      netMarginPercent,
    };
  });

  const mrr = tierMetrics.reduce((sum, t) => sum + t.revenue, 0);
  const ambassadorPayouts = tierMetrics.reduce((sum, t) => sum + t.ambassadorCut, 0);
  const processingFee = tierMetrics.reduce((sum, t) => sum + t.processingFee, 0);
  const tax = tierMetrics.reduce((sum, t) => sum + t.tax, 0);
  const totalCosts = ambassadorPayouts + processingFee + tax + infra;
  const netProfit = mrr - totalCosts;
  const netMarginPercent = mrr > 0 ? Math.round((netProfit / mrr) * 10000) / 100 : 0;

  // Break-even: fixed infra cost / weighted avg net per subscriber
  const totalSubscribers = tierMetrics.reduce((sum, t) => sum + t.subscriberCount, 0);
  let weightedAvgNet = 0;
  if (totalSubscribers > 0) {
    const totalNetRevenue = tierMetrics.reduce(
      (sum, t) => sum + (t.netPerSubscriber * t.subscriberCount),
      0
    );
    weightedAvgNet = totalNetRevenue / totalSubscribers;
  } else {
    // Use equal-weight average across tiers
    const avgNet = tierMetrics.reduce((sum, t) => sum + t.netPerSubscriber, 0) / tierMetrics.length;
    weightedAvgNet = avgNet;
  }

  const breakEvenSubscribers = weightedAvgNet > 0 ? Math.ceil(infra / weightedAvgNet) : 0;

  return {
    mrr,
    ambassadorPayouts,
    processingFee,
    tax,
    infrastructureCost: infra,
    totalCosts,
    netProfit,
    netMarginPercent,
    breakEvenSubscribers,
    currentSubscribers: totalSubscribers,
    tierMetrics,
  };
}

// ─── Formatting Helpers ─────────────────────────────────────────────────────────

/** Format kopeks to rubles string with Russian locale. E.g. 149000 → "1 490 ₽" */
export function formatRubles(kopeks: number): string {
  const rubles = kopeks / 100;
  return new Intl.NumberFormat("ru-RU", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(rubles) + " ₽";
}

/** Format kopeks to short display. E.g. 14900000 → "149K ₽" */
export function formatRublesShort(kopeks: number): string {
  const rubles = kopeks / 100;
  if (rubles >= 1_000_000) {
    return (rubles / 1_000_000).toFixed(1).replace(".0", "") + "M ₽";
  }
  if (rubles >= 1_000) {
    return (rubles / 1_000).toFixed(1).replace(".0", "") + "K ₽";
  }
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(rubles) + " ₽";
}

/** Format a percentage value nicely */
export function formatPercent(value: number): string {
  return value.toFixed(2).replace(/\.?0+$/, "") + "%";
}

export const PAYOUT_DAYS: { value: string; label: string }[] = [
  { value: "monday", label: "Понедельник" },
  { value: "tuesday", label: "Вторник" },
  { value: "wednesday", label: "Среда" },
  { value: "thursday", label: "Четверг" },
  { value: "friday", label: "Пятница" },
  { value: "saturday", label: "Суббота" },
  { value: "sunday", label: "Воскресенье" },
];
