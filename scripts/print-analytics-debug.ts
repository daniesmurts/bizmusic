// Print recent play_logs and payments for analytics debugging
import { db } from "@/db";
import { playLogs, payments } from "@/db/schema";

async function printRecentAnalyticsData() {
  const recentPlays = await db.query.playLogs.findMany({
    where: (pl) => pl.playedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    orderBy: (pl) => pl.playedAt,
  });
  const recentPayments = await db.query.payments.findMany({
    where: (p) => p.status === "CONFIRMED" && p.createdAt > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    orderBy: (p) => p.createdAt,
  });
  console.log("Recent play_logs (last 30 days):", recentPlays);
  console.log("Recent payments (last 12 months):", recentPayments);
}

printRecentAnalyticsData().catch(console.error);