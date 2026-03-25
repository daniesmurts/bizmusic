import { db } from "@/db";
import { businesses, ttsCreditLots, ttsUsageEvents } from "@/db/schema";
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
};

export interface TtsEntitlementStatus {
  monthlyLimit: number;
  monthlyUsed: number;
  monthlyRemaining: number;
  paidCredits: number;
  nextMonthlyResetAt: Date | null;
  nearestPackExpiryAt: Date | null;
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

function getMonthlyLimitForBusiness(business: BusinessEntitlementState): number {
  return getMonthlyLimitForPlan(business.currentPlanSlug, business.subscriptionStatus);
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

async function getPaidCreditsTotal(businessId: string, now: Date): Promise<number> {
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
  const paidCredits = await getPaidCreditsTotal(businessId, now);
  const nearestPackExpiryAt = await getNearestPackExpiryAt(businessId, now);

  const canGenerate = monthlyRemaining > 0 || paidCredits > 0;
  const denialReason = canGenerate
    ? undefined
    : "Ежемесячный лимит исчерпан и пакетные кредиты отсутствуют. Приобретите пакет кредитов.";

  return {
    monthlyLimit,
    monthlyUsed: business.ttsMonthlyUsed,
    monthlyRemaining,
    paidCredits,
    nextMonthlyResetAt: business.ttsMonthlyPeriodEnd,
    nearestPackExpiryAt,
    canGenerate,
    denialReason,
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
    throw new Error("Лимит генерации исчерпан. Приобретите пакет кредитов.");
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
