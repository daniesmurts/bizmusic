"use server";

import { db } from "@/db";
import { announcementPlayLogs, voiceAnnouncements, tracks } from "@/db/schema";
import { eq, and, gte, sql, count, avg } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { resolveAccessScope } from "@/lib/auth/scope";
import { businesses } from "@/db/schema";

async function resolveBusinessScope() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const scope = await resolveAccessScope(user.id);
  if (!scope?.businessId) return null;
  return { userId: user.id, businessId: scope.businessId, isBranchManager: scope.isBranchManager };
}

export type AnnouncementAnalyticsPeriod = "7d" | "30d" | "90d";

function getPeriodStart(period: AnnouncementAnalyticsPeriod): Date {
  const now = new Date();
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  now.setDate(now.getDate() - days);
  now.setHours(0, 0, 0, 0);
  return now;
}

export interface AnnouncementStatRow {
  announcementId: string;
  trackId: string;
  title: string;
  provider: string;
  voiceName: string;
  totalPlays: number;
  skippedPlays: number;
  completedPlays: number;
  skipRate: number; // 0–100
  avgListenDurationSec: number;
}

export interface HourlyBucket {
  hour: number; // 0–23
  plays: number;
}

export interface AnnouncementAnalyticsData {
  period: AnnouncementAnalyticsPeriod;
  totalPlays: number;
  totalSkipped: number;
  overallSkipRate: number;
  announcementStats: AnnouncementStatRow[];
  hourlyDistribution: HourlyBucket[];
}

/**
 * Get announcement analytics for the current business
 */
export async function getAnnouncementAnalyticsAction(
  period: AnnouncementAnalyticsPeriod = "30d"
) {
  try {
    const scope = await resolveBusinessScope();
    if (!scope) return { success: false, error: "Unauthorized" };

    const periodStart = getPeriodStart(period);

    // 1. Per-announcement aggregates
    const rows = await db
      .select({
        announcementId: announcementPlayLogs.announcementId,
        trackId: announcementPlayLogs.trackId,
        totalPlays: count(announcementPlayLogs.id),
        skippedPlays: sql<number>`SUM(CASE WHEN ${announcementPlayLogs.wasSkipped} THEN 1 ELSE 0 END)::int`,
        avgListenDurationSec: avg(announcementPlayLogs.listenDurationSec),
      })
      .from(announcementPlayLogs)
      .where(
        and(
          eq(announcementPlayLogs.businessId, scope.businessId),
          gte(announcementPlayLogs.playedAt, periodStart)
        )
      )
      .groupBy(announcementPlayLogs.announcementId, announcementPlayLogs.trackId);

    // 2. Fetch track metadata for the announcement IDs we have
    const announcementIds = rows.map((r) => r.announcementId);

    let announcementMeta: Map<string, { title: string; provider: string; voiceName: string }> = new Map();

    if (announcementIds.length > 0) {
      const metas = await db.query.voiceAnnouncements.findMany({
        where: (va, { inArray }) => inArray(va.id, announcementIds),
        with: { track: { columns: { id: true, title: true } } },
        columns: { id: true, provider: true, voiceName: true },
      });
      for (const m of metas) {
        announcementMeta.set(m.id, {
          title: m.track?.title ?? "Без названия",
          provider: m.provider,
          voiceName: m.voiceName,
        });
      }
    }

    // 3. Build stat rows
    const announcementStats: AnnouncementStatRow[] = rows.map((r) => {
      const meta = announcementMeta.get(r.announcementId);
      const total = Number(r.totalPlays) || 0;
      const skipped = Number(r.skippedPlays) || 0;
      const completed = total - skipped;
      const skipRate = total > 0 ? Math.round((skipped / total) * 100) : 0;

      return {
        announcementId: r.announcementId,
        trackId: r.trackId,
        title: meta?.title ?? "Удалённый анонс",
        provider: meta?.provider ?? "unknown",
        voiceName: meta?.voiceName ?? "unknown",
        totalPlays: total,
        skippedPlays: skipped,
        completedPlays: completed,
        skipRate,
        avgListenDurationSec: Math.round(Number(r.avgListenDurationSec) || 0),
      };
    });

    // Sort by total plays desc
    announcementStats.sort((a, b) => b.totalPlays - a.totalPlays);

    // 4. Totals
    const totalPlays = announcementStats.reduce((s, r) => s + r.totalPlays, 0);
    const totalSkipped = announcementStats.reduce((s, r) => s + r.skippedPlays, 0);
    const overallSkipRate = totalPlays > 0 ? Math.round((totalSkipped / totalPlays) * 100) : 0;

    // 5. Hourly distribution — plays by hour of day (Moscow time = UTC+3)
    const hourlyRows = await db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM (${announcementPlayLogs.playedAt} AT TIME ZONE 'Europe/Moscow'))::int`,
        plays: count(announcementPlayLogs.id),
      })
      .from(announcementPlayLogs)
      .where(
        and(
          eq(announcementPlayLogs.businessId, scope.businessId),
          gte(announcementPlayLogs.playedAt, periodStart)
        )
      )
      .groupBy(sql`EXTRACT(HOUR FROM (${announcementPlayLogs.playedAt} AT TIME ZONE 'Europe/Moscow'))`);

    // Fill all 24 hours
    const hourlyMap = new Map<number, number>();
    for (const row of hourlyRows) {
      hourlyMap.set(Number(row.hour), Number(row.plays));
    }
    const hourlyDistribution: HourlyBucket[] = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      plays: hourlyMap.get(h) ?? 0,
    }));

    return {
      success: true,
      data: {
        period,
        totalPlays,
        totalSkipped,
        overallSkipRate,
        announcementStats,
        hourlyDistribution,
      } satisfies AnnouncementAnalyticsData,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка загрузки аналитики";
    console.error("Announcement analytics error:", error);
    return { success: false, error: message };
  }
}
