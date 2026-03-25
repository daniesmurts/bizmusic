import { db } from "@/db";
import { businesses, ttsCreditLots, aiUsageEvents } from "@/db/schema";
import { getPlanBySlug } from "@/lib/payments/plans";
import { and, asc, eq, gt, sql } from "drizzle-orm";

type AiDbExecutor = Pick<typeof db, "query" | "update" | "select" | "insert">;

type BusinessAiEntitlementState = {
  id: string;
  currentPlanSlug: string | null;
  subscriptionStatus: "INACTIVE" | "ACTIVE" | "EXPIRED";
  aiMonthlyUsed: number;
  aiMonthlyPeriodStart: Date | null;
  aiMonthlyPeriodEnd: Date | null;
};

export interface AiEntitlementStatus {
  monthlyLimit: number;
  monthlyUsed: number;
  monthlyRemaining: number;
  paidTokens: number;
  nextMonthlyResetAt: Date | null;
  nearestPackExpiryAt: Date | null;
  canAssist: boolean;
  denialReason?: string;
}

interface ConsumeAiCreditParams {
  businessId: string;
  provider: "groq";
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

export function getAiMonthlyLimitForPlan(
  planSlug: string | null,
  subscriptionStatus: "INACTIVE" | "ACTIVE" | "EXPIRED"
): number {
  if (subscriptionStatus !== "ACTIVE") {
    return 0;
  }

  const plan = planSlug ? getPlanBySlug(planSlug) : undefined;
  return plan?.aiMonthlyLimit ?? 0;
}

function getAiMonthlyLimitForBusiness(business: BusinessAiEntitlementState): number {
  return getAiMonthlyLimitForPlan(business.currentPlanSlug, business.subscriptionStatus);
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

async function resetAiMonthlyWindowIfNeeded(business: BusinessAiEntitlementState, now: Date): Promise<void> {
  const { start, end } = getMonthBounds(now);
  const periodEnded = !business.aiMonthlyPeriodEnd || now >= business.aiMonthlyPeriodEnd;
  const periodNotInitialized = !business.aiMonthlyPeriodStart;

  if (!periodEnded && !periodNotInitialized) {
    return;
  }

  await db
    .update(businesses)
    .set({
      aiMonthlyUsed: 0,
      aiMonthlyPeriodStart: start,
      aiMonthlyPeriodEnd: end,
    })
    .where(eq(businesses.id, business.id));
}

export async function getBusinessAiEntitlementState(businessId: string, now: Date = new Date()): Promise<BusinessAiEntitlementState> {
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: {
      id: true,
      currentPlanSlug: true,
      subscriptionStatus: true,
      aiMonthlyUsed: true,
      aiMonthlyPeriodStart: true,
      aiMonthlyPeriodEnd: true,
    },
  });

  if (!business) {
    throw new Error("Business not found.");
  }

  await resetAiMonthlyWindowIfNeeded(business, now);

  const refreshed = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: {
      id: true,
      currentPlanSlug: true,
      subscriptionStatus: true,
      aiMonthlyUsed: true,
      aiMonthlyPeriodStart: true,
      aiMonthlyPeriodEnd: true,
    },
  });

  if (!refreshed) {
    throw new Error("Business not found after entitlement refresh.");
  }

  return refreshed;
}

export async function getAiEntitlementStatus(businessId: string): Promise<AiEntitlementStatus> {
  const now = new Date();
  const business = await getBusinessAiEntitlementState(businessId, now);
  const monthlyLimit = getAiMonthlyLimitForBusiness(business);
  const monthlyRemaining = Math.max(0, monthlyLimit - business.aiMonthlyUsed);
  const paidTokens = await getPaidTokensTotal(businessId, now);
  const nearestPackExpiryAt = await getNearestPackExpiryAt(businessId, now);

  const canAssist = monthlyRemaining > 0 || paidTokens > 0;
  const denialReason = canAssist
    ? undefined
    : "Месячный лимит помощи ИИ исчерпан и токены не приобретены. Приобретите пакет токенов.";

  return {
    monthlyLimit,
    monthlyUsed: business.aiMonthlyUsed,
    monthlyRemaining,
    paidTokens,
    nextMonthlyResetAt: business.aiMonthlyPeriodEnd,
    nearestPackExpiryAt,
    canAssist,
    denialReason,
  };
}

export async function consumeAiAssistCredit(
  executor: AiDbExecutor,
  params: ConsumeAiCreditParams
): Promise<{ sourceType: "monthly" | "pack" }> {
  const now = params.now ?? new Date();
  const currentBusiness = await executor.query.businesses.findFirst({
    where: eq(businesses.id, params.businessId),
    columns: {
      id: true,
      currentPlanSlug: true,
      subscriptionStatus: true,
      aiMonthlyUsed: true,
      aiMonthlyPeriodStart: true,
      aiMonthlyPeriodEnd: true,
    },
  });

  if (!currentBusiness) {
    throw new Error("Business not found during AI credit consumption.");
  }

  const monthlyLimit = getAiMonthlyLimitForBusiness(currentBusiness);

  if (monthlyLimit > currentBusiness.aiMonthlyUsed) {
    await executor
      .update(businesses)
      .set({
        aiMonthlyUsed: currentBusiness.aiMonthlyUsed + 1,
      })
      .where(eq(businesses.id, currentBusiness.id));

    await executor.insert(aiUsageEvents).values({
      businessId: params.businessId,
      provider: params.provider,
      sourceType: "monthly",
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
        eq(ttsCreditLots.businessId, params.businessId),
        gt(ttsCreditLots.creditsRemaining, 0),
        gt(ttsCreditLots.expiresAt, now)
      )
    )
    .orderBy(asc(ttsCreditLots.expiresAt), asc(ttsCreditLots.createdAt))
    .limit(1);

  const lot = pickNextCreditLot(lots, now);
  if (!lot) {
    throw new Error("Лимит помощи ИИ исчерпан. Приобретите пакет токенов.");
  }

  await executor
    .update(ttsCreditLots)
    .set({
      creditsRemaining: Math.max(0, lot.creditsRemaining - 1),
    })
    .where(eq(ttsCreditLots.id, lot.id));

  await executor.insert(aiUsageEvents).values({
    businessId: params.businessId,
    provider: params.provider,
    sourceType: "pack",
    charsCount: params.charsCount,
  });

  return { sourceType: "pack" };
}
