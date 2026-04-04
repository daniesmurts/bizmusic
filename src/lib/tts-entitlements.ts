import { db } from "@/db";
import { brandVoiceModels, brandVoiceUsageEvents, businesses, ttsCreditLots, ttsUsageEvents } from "@/db/schema";
import { getPlanBySlug } from "@/lib/payments/plans";
import { and, asc, eq, gt, sql } from "drizzle-orm";

type TtsDbExecutor = Pick<typeof db, "query" | "update" | "select" | "insert">;

type BusinessEntitlementState = {
  id: string;
  currentPlanSlug: string | null;
  subscriptionStatus: "INACTIVE" | "ACTIVE" | "EXPIRED";
  ttsMonthlyUsed: number;
  ttsMonthlyPeriodStart: Date | null;
  ttsMonthlyPeriodEnd: Date | null;
  brandVoiceMonthlyUsed: number;
  brandVoiceMonthlyPeriodStart: Date | null;
  brandVoiceMonthlyPeriodEnd: Date | null;
  brandVoiceOverageCharsPurchased: number;
};

export interface TtsEntitlementStatus {
  monthlyLimit: number;
  monthlyUsed: number;
  monthlyRemaining: number;
  paidTokens: number;
  nextMonthlyResetAt: Date | null;
  nearestPackExpiryAt: Date | null;
  canGenerate: boolean;
  denialReason?: string;
}

export interface BrandVoiceEntitlementStatus {
  monthlyLimit: number;
  monthlyUsed: number;
  monthlyRemaining: number;
  overageCharsPurchased: number;
  nextMonthlyResetAt: Date | null;
  canGenerate: boolean;
  denialReason?: string;
}

interface ConsumeCreditParams {
  business: BusinessEntitlementState;
  announcementId: string;
  provider: "google" | "sberbank";
  charsCount: number;
  now?: Date;
}

interface ConsumeBrandVoiceCharsParams {
  business: BusinessEntitlementState;
  modelId: string;
  announcementId?: string;
  provider: string;
  charsCount: number;
  now?: Date;
}

interface CreditLotCandidate {
  id: string;
  creditsRemaining: number;
  expiresAt: Date;
  createdAt: Date;
}

export function getMonthBounds(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { start, end };
}

export function getMonthlyLimitForPlan(
  planSlug: string | null,
  subscriptionStatus: "INACTIVE" | "ACTIVE" | "EXPIRED"
): number {
  if (subscriptionStatus !== "ACTIVE") {
    return 0;
  }

  const plan = planSlug ? getPlanBySlug(planSlug) : undefined;
  return plan?.ttsMonthlyLimit ?? 0;
}

export function getBrandVoiceMonthlyLimitForPlan(
  planSlug: string | null,
  subscriptionStatus: "INACTIVE" | "ACTIVE" | "EXPIRED"
): number {
  if (subscriptionStatus !== "ACTIVE") {
    return 0;
  }

  const plan = planSlug ? getPlanBySlug(planSlug) : undefined;
  return plan?.brandVoiceMonthlyLimit ?? 0;
}

function getMonthlyLimitForBusiness(business: BusinessEntitlementState): number {
  return getMonthlyLimitForPlan(business.currentPlanSlug, business.subscriptionStatus);
}

function getBrandVoiceMonthlyLimitForBusiness(business: BusinessEntitlementState): number {
  return getBrandVoiceMonthlyLimitForPlan(business.currentPlanSlug, business.subscriptionStatus);
}

async function getBrandVoiceModelLimitForBusiness(businessId: string): Promise<number> {
  const rows = await db
    .select({
      maxLimit: sql<number>`coalesce(max(${brandVoiceModels.monthlyCharsLimit}), 0)`,
    })
    .from(brandVoiceModels)
    .where(eq(brandVoiceModels.businessId, businessId));

  return rows[0]?.maxLimit ?? 0;
}

export function pickNextCreditLot(lots: CreditLotCandidate[], now: Date): CreditLotCandidate | null {
  const available = lots
    .filter((lot) => lot.creditsRemaining > 0 && lot.expiresAt > now)
    .sort((a, b) => {
      const expiryDiff = a.expiresAt.getTime() - b.expiresAt.getTime();
      if (expiryDiff !== 0) return expiryDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

  return available[0] ?? null;
}

async function getPaidTokensTotal(businessId: string, now: Date): Promise<number> {
  const rows = await db
    .select({
      total: sql<number>`coalesce(sum(${ttsCreditLots.creditsRemaining}), 0)`,
    })
    .from(ttsCreditLots)
    .where(
      and(
        eq(ttsCreditLots.businessId, businessId),
        gt(ttsCreditLots.creditsRemaining, 0),
        gt(ttsCreditLots.expiresAt, now)
      )
    );

  return rows[0]?.total ?? 0;
}

async function getNearestPackExpiryAt(businessId: string, now: Date): Promise<Date | null> {
  const rows = await db
    .select({
      expiresAt: ttsCreditLots.expiresAt,
    })
    .from(ttsCreditLots)
    .where(
      and(
        eq(ttsCreditLots.businessId, businessId),
        gt(ttsCreditLots.creditsRemaining, 0),
        gt(ttsCreditLots.expiresAt, now)
      )
    )
    .orderBy(asc(ttsCreditLots.expiresAt))
    .limit(1);

  return rows[0]?.expiresAt ?? null;
}

async function resetMonthlyWindowIfNeeded(business: BusinessEntitlementState, now: Date): Promise<void> {
  const { start, end } = getMonthBounds(now);
  const periodEnded = !business.ttsMonthlyPeriodEnd || now >= business.ttsMonthlyPeriodEnd;
  const periodNotInitialized = !business.ttsMonthlyPeriodStart;

  // Only reset TTS (plan-based, calendar-month). BV period is managed exclusively by the payment webhook.
  if (!periodEnded && !periodNotInitialized) {
    return;
  }

  await db
    .update(businesses)
    .set({
      ttsMonthlyUsed: 0,
      ttsMonthlyPeriodStart: start,
      ttsMonthlyPeriodEnd: end,
    })
    .where(eq(businesses.id, business.id));
}

export async function getBusinessEntitlementState(businessId: string, now: Date = new Date()): Promise<BusinessEntitlementState> {
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: {
      id: true,
      currentPlanSlug: true,
      subscriptionStatus: true,
      ttsMonthlyUsed: true,
      ttsMonthlyPeriodStart: true,
      ttsMonthlyPeriodEnd: true,
      brandVoiceMonthlyUsed: true,
      brandVoiceMonthlyPeriodStart: true,
      brandVoiceMonthlyPeriodEnd: true,
      brandVoiceOverageCharsPurchased: true,
    },
  });

  if (!business) {
    throw new Error("Business not found.");
  }

  await resetMonthlyWindowIfNeeded(business, now);

  const refreshed = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: {
      id: true,
      currentPlanSlug: true,
      subscriptionStatus: true,
      ttsMonthlyUsed: true,
      ttsMonthlyPeriodStart: true,
      ttsMonthlyPeriodEnd: true,
      brandVoiceMonthlyUsed: true,
      brandVoiceMonthlyPeriodStart: true,
      brandVoiceMonthlyPeriodEnd: true,
      brandVoiceOverageCharsPurchased: true,
    },
  });

  if (!refreshed) {
    throw new Error("Business not found after entitlement refresh.");
  }

  return refreshed;
}

export async function getTtsEntitlementStatus(businessId: string): Promise<TtsEntitlementStatus> {
  const now = new Date();
  const business = await getBusinessEntitlementState(businessId, now);
  const monthlyLimit = getMonthlyLimitForBusiness(business);
  const monthlyRemaining = Math.max(0, monthlyLimit - business.ttsMonthlyUsed);
  const paidTokens = await getPaidTokensTotal(businessId, now);
  const nearestPackExpiryAt = await getNearestPackExpiryAt(businessId, now);

  const canGenerate = monthlyRemaining > 0 || paidTokens > 0;
  const denialReason = canGenerate
    ? undefined
    : "Ежемесячный лимит исчерпан и пакетные токены отсутствуют. Приобретите пакет токенов.";

  return {
    monthlyLimit,
    monthlyUsed: business.ttsMonthlyUsed,
    monthlyRemaining,
    paidTokens,
    nextMonthlyResetAt: business.ttsMonthlyPeriodEnd,
    nearestPackExpiryAt,
    canGenerate,
    denialReason,
  };
}

export async function getBrandVoiceEntitlementStatus(businessId: string): Promise<BrandVoiceEntitlementStatus> {
  const now = new Date();
  const business = await getBusinessEntitlementState(businessId, now);
  const planMonthlyLimit = getBrandVoiceMonthlyLimitForBusiness(business);
  const modelMonthlyLimit = await getBrandVoiceModelLimitForBusiness(businessId);
  const monthlyLimit = Math.max(planMonthlyLimit, modelMonthlyLimit);
  // BV period is payment-based: only active if period exists and hasn't expired
  const periodActive =
    Boolean(business.brandVoiceMonthlyPeriodEnd) &&
    now < business.brandVoiceMonthlyPeriodEnd!;
  const overageCharsPurchased = business.brandVoiceOverageCharsPurchased ?? 0;
  const effectiveLimit = monthlyLimit + overageCharsPurchased;
  const effectiveRemaining = Math.max(0, effectiveLimit - business.brandVoiceMonthlyUsed);
  const canGenerate = periodActive && effectiveRemaining > 0;

  return {
    monthlyLimit,
    monthlyUsed: business.brandVoiceMonthlyUsed,
    monthlyRemaining: Math.max(0, monthlyLimit - business.brandVoiceMonthlyUsed),
    overageCharsPurchased,
    nextMonthlyResetAt: business.brandVoiceMonthlyPeriodEnd,
    canGenerate,
    denialReason: canGenerate
      ? undefined
      : !periodActive
        ? "Ежемесячная подписка Brand Voice истекла или не активирована. Оформите подписку."
        : "Ежемесячный лимит Brand Voice исчерпан. Обновите тариф или докупите дополнительные символы.",
  };
}

export async function consumeTtsGenerationCredit(
  executor: TtsDbExecutor,
  params: ConsumeCreditParams
): Promise<{ sourceType: "monthly" | "pack" }> {
  const now = params.now ?? new Date();
  const currentBusiness = await executor.query.businesses.findFirst({
    where: eq(businesses.id, params.business.id),
    columns: {
      id: true,
      currentPlanSlug: true,
      subscriptionStatus: true,
      ttsMonthlyUsed: true,
      ttsMonthlyPeriodStart: true,
      ttsMonthlyPeriodEnd: true,
      brandVoiceMonthlyUsed: true,
      brandVoiceMonthlyPeriodStart: true,
      brandVoiceMonthlyPeriodEnd: true,
      brandVoiceOverageCharsPurchased: true,
    },
  });

  if (!currentBusiness) {
    throw new Error("Business not found during credit consumption.");
  }

  const monthlyLimit = getMonthlyLimitForBusiness(currentBusiness);

  if (monthlyLimit > currentBusiness.ttsMonthlyUsed) {
    await executor
      .update(businesses)
      .set({
        ttsMonthlyUsed: currentBusiness.ttsMonthlyUsed + 1,
      })
      .where(eq(businesses.id, currentBusiness.id));

    await executor.insert(ttsUsageEvents).values({
      businessId: params.business.id,
      announcementId: params.announcementId,
      provider: params.provider,
      sourceType: "monthly",
      consumedCredits: 1,
      charsCount: params.charsCount,
    });

    return { sourceType: "monthly" };
  }

  const lots = await executor
    .select({
      id: ttsCreditLots.id,
      creditsRemaining: ttsCreditLots.creditsRemaining,
      expiresAt: ttsCreditLots.expiresAt,
      createdAt: ttsCreditLots.createdAt,
    })
    .from(ttsCreditLots)
    .where(
      and(
        eq(ttsCreditLots.businessId, params.business.id),
        gt(ttsCreditLots.creditsRemaining, 0),
        gt(ttsCreditLots.expiresAt, now)
      )
    )
    .orderBy(asc(ttsCreditLots.expiresAt), asc(ttsCreditLots.createdAt))
    .limit(1);

  const lot = pickNextCreditLot(lots, now);
  if (!lot) {
    throw new Error("Лимит генерации исчерпан. Приобретите пакет токенов.");
  }

  await executor
    .update(ttsCreditLots)
    .set({
      creditsRemaining: Math.max(0, lot.creditsRemaining - 1),
    })
    .where(eq(ttsCreditLots.id, lot.id));

  await executor.insert(ttsUsageEvents).values({
    businessId: params.business.id,
    announcementId: params.announcementId,
    provider: params.provider,
    sourceType: "pack",
    consumedCredits: 1,
    charsCount: params.charsCount,
  });

  return { sourceType: "pack" };
}

export async function consumeBrandVoiceGenerationChars(
  executor: TtsDbExecutor,
  params: ConsumeBrandVoiceCharsParams
): Promise<void> {
  const now = params.now ?? new Date();
  const currentBusiness = await executor.query.businesses.findFirst({
    where: eq(businesses.id, params.business.id),
    columns: {
      id: true,
      currentPlanSlug: true,
      subscriptionStatus: true,
      ttsMonthlyUsed: true,
      ttsMonthlyPeriodStart: true,
      ttsMonthlyPeriodEnd: true,
      brandVoiceMonthlyUsed: true,
      brandVoiceMonthlyPeriodStart: true,
      brandVoiceMonthlyPeriodEnd: true,
      brandVoiceOverageCharsPurchased: true,
    },
  });

  if (!currentBusiness) {
    throw new Error("Business not found during Brand Voice credit consumption.");
  }

  const periodEnded =
    !currentBusiness.brandVoiceMonthlyPeriodEnd || now >= currentBusiness.brandVoiceMonthlyPeriodEnd;
  const periodNotInitialized = !currentBusiness.brandVoiceMonthlyPeriodStart;

  // Enforce payment-based period — no silent calendar reset
  if (periodNotInitialized) {
    throw new Error("Нет активной подписки Brand Voice. Оформите ежемесячную подписку Brand Voice.");
  }
  if (periodEnded) {
    throw new Error("Срок подписки Brand Voice истёк. Продлите подписку в разделе Brand Voice.");
  }

  const monthlyUsed = currentBusiness.brandVoiceMonthlyUsed;

  const model = await executor.query.brandVoiceModels.findFirst({
    where: and(eq(brandVoiceModels.id, params.modelId), eq(brandVoiceModels.businessId, currentBusiness.id)),
    columns: { monthlyCharsLimit: true },
  });

  const planMonthlyLimit = getBrandVoiceMonthlyLimitForBusiness(currentBusiness);
  const modelMonthlyLimit = model?.monthlyCharsLimit ?? 0;
  const baseMonthlyLimit = Math.max(planMonthlyLimit, modelMonthlyLimit);
  const overagePurchased = currentBusiness.brandVoiceOverageCharsPurchased ?? 0;
  const monthlyLimit = baseMonthlyLimit + overagePurchased;
  const charsToConsume = Math.max(0, Math.floor(params.charsCount));

  if (monthlyUsed + charsToConsume > monthlyLimit) {
    throw new Error("Недостаточно Brand Voice символов в текущем месяце. Докупите дополнительные символы.");
  }

  await executor
    .update(businesses)
    .set({
      brandVoiceMonthlyUsed: monthlyUsed + charsToConsume,
    })
    .where(eq(businesses.id, currentBusiness.id));

  await executor.insert(brandVoiceUsageEvents).values({
    businessId: params.business.id,
    modelId: params.modelId,
    announcementId: params.announcementId,
    provider: params.provider,
    charsCount: charsToConsume,
  });
}
