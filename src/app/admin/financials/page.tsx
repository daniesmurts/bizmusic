import { db } from "@/db";
import { platformSettings, businesses, referralAgents, commissionLedger } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { FinancialDashboardClient } from "./FinancialDashboardClient";
import type { PlatformSettingsData, LiveData } from "./types";

export const dynamic = "force-dynamic";

export default async function AdminFinancialsPage() {
  // Get or create singleton settings row
  let settingsRows = await db.select().from(platformSettings).limit(1);
  if (settingsRows.length === 0) {
    const [created] = await db
      .insert(platformSettings)
      .values({ id: "singleton" })
      .returning();
    settingsRows = [created];
  }
  const settings = settingsRows[0];

  // Subscriber counts by plan slug
  const subscriberRows = await db
    .select({
      planSlug: businesses.currentPlanSlug,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(businesses)
    .where(eq(businesses.subscriptionStatus, "ACTIVE"))
    .groupBy(businesses.currentPlanSlug);

  const subscribersByTier: Record<string, number> = {};
  let totalActiveSubscribers = 0;
  for (const row of subscriberRows) {
    const slug = row.planSlug || "unknown";
    subscribersByTier[slug] = row.count;
    totalActiveSubscribers += row.count;
  }

  // Active ambassador count
  const [ambassadorRow] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(referralAgents)
    .where(eq(referralAgents.status, "active"));

  // Total paid commissions
  const [payoutsRow] = await db
    .select({
      total: sql<number>`coalesce(sum(${commissionLedger.commissionAmountKopecks}), 0)`,
    })
    .from(commissionLedger)
    .where(eq(commissionLedger.status, "paid"));

  const settingsData: PlatformSettingsData = {
    ...settings,
    updatedAt: settings.updatedAt.toISOString(),
  };

  const liveData: LiveData = {
    subscribersByTier,
    totalActiveSubscribers,
    activeAmbassadors: ambassadorRow?.count ?? 0,
    totalPayoutsKopeks: payoutsRow?.total ?? 0,
  };

  return <FinancialDashboardClient initialSettings={settingsData} initialLiveData={liveData} />;
}
