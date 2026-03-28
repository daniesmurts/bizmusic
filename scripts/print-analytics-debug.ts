// Print recent play_logs and payments for analytics debugging
import { db } from "@/db";
import { playLogs, payments } from "@/db/schema";
import { gte, eq, and, desc } from "drizzle-orm";

async function printRecentAnalyticsData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

  const recentPlays = await db.query.playLogs.findMany({
    where: gte(playLogs.playedAt, thirtyDaysAgo),
    orderBy: [desc(playLogs.playedAt)],
  });
  const recentPayments = await db.query.payments.findMany({
    where: and(eq(payments.status, "CONFIRMED"), gte(payments.createdAt, oneYearAgo)),
    orderBy: [desc(payments.createdAt)],
  });
  console.log("Recent play_logs (last 30 days):", recentPlays);
  console.log("Recent payments (last 12 months):", recentPayments);
}

printRecentAnalyticsData().catch(console.error);