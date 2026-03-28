"use server";

import { db } from "@/db";
import { users, businesses, tracks, playLogs, licenses, payments, trackReactions, playlists, playlistTracks, locations, legalAcceptanceEvents, trackSkips } from "@/db/schema";
import { eq, sql, desc, and, gte, between, or } from "drizzle-orm";
import { startOfDay, subDays, startOfWeek, subWeeks, startOfMonth, subMonths, format, parseISO } from "date-fns";
import { createClient } from "@/utils/supabase/server";

export async function getAdminAnalyticsAction(dateRange?: { from: string; to: string }) {
  try {
    // Auth: only admins can access analytics
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Unauthorized" };
    }
    const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.id) });
    if (!dbUser || dbUser.role !== "ADMIN") {
      return { success: false, error: "Forbidden: Admin access required" };
    }
    // Compute date boundaries from optional range
    const today = startOfDay(new Date());
    const tomorrow = subDays(today, -1); // end-of-range upper bound
    let rangeStart: Date;
    let rangeEnd: Date = tomorrow;

    if (dateRange?.from) {
      rangeStart = parseISO(dateRange.from);
      rangeEnd = dateRange.to ? parseISO(dateRange.to) : tomorrow;
    } else {
      // Default: last 30 days
      rangeStart = subDays(today, 29);
    }

    // How many days in the selected range
    const rangeDiff = rangeEnd.getTime() - rangeStart.getTime();
    const rangeDays = Math.round(rangeDiff / (1000 * 60 * 60 * 24));
    const previousRangeEnd = rangeStart;
    const previousRangeStart = new Date(rangeStart.getTime() - rangeDiff);

    // 1. Basic Stats (cumulative — NOT filtered by range)
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [businessCount] = await db.select({ count: sql<number>`count(*)` }).from(businesses);
    const [trackCount] = await db.select({ count: sql<number>`count(*)` }).from(tracks);

    // Play count & listening hours ARE range-filtered
    const [playCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(playLogs)
      .where(and(gte(playLogs.playedAt, rangeStart), sql`${playLogs.playedAt} < ${rangeEnd}`));
    
    // 2. Play Time Allocation (range-filtered)
    const [totalDurationResult] = await db
      .select({ total: sql<number>`sum(${tracks.duration})` })
      .from(playLogs)
      .innerJoin(tracks, eq(playLogs.trackId, tracks.id))
      .where(and(gte(playLogs.playedAt, rangeStart), sql`${playLogs.playedAt} < ${rangeEnd}`));
    
    const totalListeningHours = Math.round((totalDurationResult?.total || 0) / 3600);

    // 3. User Type Distribution
    const userTypeStats = await db
      .select({ 
        type: users.userType, 
        count: sql<number>`count(*)` 
      })
      .from(users)
      .groupBy(users.userType);

    // 4. Subscription Status Distribution
    const subscriptionStats = await db
      .select({ 
        status: businesses.subscriptionStatus, 
        count: sql<number>`count(*)` 
      })
      .from(businesses)
      .groupBy(businesses.subscriptionStatus);

    // 5. Growth Data (Last 6 Months)
    const sixMonthsAgo = subMonths(new Date(), 6);
    const growthData = await db
      .select({
        month: sql<string>`to_char(${users.createdAt}, 'YYYY-MM')`,
        count: sql<number>`count(*)`
      })
      .from(users)
      .where(gte(users.createdAt, sixMonthsAgo))
      .groupBy(sql`to_char(${users.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${users.createdAt}, 'YYYY-MM')`);

    // 6. Top Tracks (range-filtered)
    const topTracks = await db
      .select({
        id: tracks.id,
        title: tracks.title,
        artist: tracks.artist,
        playCount: sql<number>`count(${playLogs.id})`
      })
      .from(playLogs)
      .innerJoin(tracks, eq(playLogs.trackId, tracks.id))
      .where(and(gte(playLogs.playedAt, rangeStart), sql`${playLogs.playedAt} < ${rangeEnd}`))
      .groupBy(tracks.id, tracks.title, tracks.artist)
      .orderBy(desc(sql`count(${playLogs.id})`))
      .limit(10);

    // 7. Revenue Stats

    // 8. DAU/WAU/MAU (all use rangeStart)
    // DAU: Unique users per day
    const dauRaw = await db.execute(
        sql`SELECT to_char("playedAt", 'YYYY-MM-DD') as day, count(DISTINCT "businessId") as users
          FROM play_logs
          WHERE "playedAt" >= ${rangeStart} AND "playedAt" < ${rangeEnd}
          GROUP BY day
          ORDER BY day ASC`
    );
    const dau = Array.isArray(dauRaw) ? dauRaw : dauRaw.rows;

    // WAU: Unique users per week
    const wauStart = rangeDays > 84 ? rangeStart : startOfWeek(subWeeks(today, 11), { weekStartsOn: 1 });
    const wauEnd = rangeDays > 84 ? rangeEnd : tomorrow;
    const wauRaw = await db.execute(
        sql`SELECT to_char(date_trunc('week', "playedAt"), 'IYYY-IW') as week, count(DISTINCT "businessId") as users
          FROM play_logs
          WHERE "playedAt" >= ${wauStart} AND "playedAt" < ${wauEnd}
          GROUP BY week
          ORDER BY week ASC`
    );
    const wau = Array.isArray(wauRaw) ? wauRaw : wauRaw.rows;

    // MAU: Unique users per month
    const mauStart = rangeDays > 365 ? rangeStart : startOfMonth(subMonths(today, 11));
    const mauEnd = rangeDays > 365 ? rangeEnd : tomorrow;
    const mauRaw = await db.execute(
        sql`SELECT to_char(date_trunc('month', "playedAt"), 'YYYY-MM') as month, count(DISTINCT "businessId") as users
          FROM play_logs
          WHERE "playedAt" >= ${mauStart} AND "playedAt" < ${mauEnd}
          GROUP BY month
          ORDER BY month ASC`
    );
    const mau = Array.isArray(mauRaw) ? mauRaw : mauRaw.rows;

    // 4. PREVIOUS PERIOD STATS (for PoP comparison)
    const [prevPlayCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(playLogs)
      .where(and(gte(playLogs.playedAt, previousRangeStart), sql`${playLogs.playedAt} < ${previousRangeEnd}`));

    const [prevDurationResult] = await db
      .select({ total: sql<number>`sum(${tracks.duration})` })
      .from(playLogs)
      .innerJoin(tracks, eq(playLogs.trackId, tracks.id))
      .where(and(gte(playLogs.playedAt, previousRangeStart), sql`${playLogs.playedAt} < ${previousRangeEnd}`));
    const prevHours = Math.round((prevDurationResult?.total || 0) / 3600);

    const [prevNewUsers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(gte(users.createdAt, previousRangeStart), sql`${users.createdAt} < ${previousRangeEnd}`));
    
    const [currNewUsers] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(gte(users.createdAt, rangeStart), sql`${users.createdAt} < ${rangeEnd}`));

    const [prevRevenueResult] = await db
      .select({ total: sql<number>`sum(${payments.amount})` })
      .from(payments)
      .where(and(
        gte(payments.createdAt, previousRangeStart), 
        sql`${payments.createdAt} < ${previousRangeEnd}`,
        or(eq(payments.status, "confirmed"), eq(payments.status, "succeeded"))
      ));
    const prevRevenue = Number(prevRevenueResult?.total || 0) / 100;

    const [currRevenueResult] = await db
      .select({ total: sql<number>`sum(${payments.amount})` })
      .from(payments)
      .where(and(
        gte(payments.createdAt, rangeStart), 
        sql`${payments.createdAt} < ${rangeEnd}`,
        or(eq(payments.status, "confirmed"), eq(payments.status, "succeeded"))
      ));
    const currRevenue = Number(currRevenueResult?.total || 0) / 100;

    const calcChange = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const pop = {
      plays: calcChange(Number(playCount.count), Number(prevPlayCount.count)),
      hours: calcChange(totalListeningHours, prevHours),
      users: calcChange(Number(currNewUsers.count), Number(prevNewUsers.count)),
      revenue: calcChange(currRevenue, prevRevenue),
    };
    // 9. Revenue Trend (uses range)
    const revenueTrendRaw = await db.execute(
      sql`SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as month, sum(amount) as revenue
          FROM payments
          WHERE status = 'CONFIRMED' AND "createdAt" >= ${rangeStart} AND "createdAt" < ${rangeEnd}
          GROUP BY month
          ORDER BY month ASC`
    );
    const revenueTrend = Array.isArray(revenueTrendRaw) ? revenueTrendRaw : revenueTrendRaw.rows;
    const [totalRevenueResult] = await db
      .select({ total: sql<number>`sum(${payments.amount})` })
      .from(payments)
      .where(and(eq(payments.status, "CONFIRMED"), gte(payments.createdAt, rangeStart), sql`${payments.createdAt} < ${rangeEnd}`));
    
    const totalRevenue = (totalRevenueResult?.total || 0) / 100; // in Rubles

    // 8. Reactions summary
    const [reactionSummary] = await db
      .select({
        likes: sql<number>`cast(count(*) filter (where ${trackReactions.reactionType} = 'LIKE') as int)`,
        dislikes: sql<number>`cast(count(*) filter (where ${trackReactions.reactionType} = 'DISLIKE') as int)`,
      })
      .from(trackReactions);

    // 9. Top liked tracks
    const topLikedTracks = await db
      .select({
        id: tracks.id,
        title: tracks.title,
        artist: tracks.artist,
        likes: sql<number>`cast(count(*) as int)`,
      })
      .from(trackReactions)
      .innerJoin(tracks, eq(trackReactions.trackId, tracks.id))
      .where(eq(trackReactions.reactionType, "LIKE"))
      .groupBy(tracks.id, tracks.title, tracks.artist)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    // 10. Top disliked tracks
    const topDislikedTracks = await db
      .select({
        id: tracks.id,
        title: tracks.title,
        artist: tracks.artist,
        dislikes: sql<number>`cast(count(*) as int)`,
      })
      .from(trackReactions)
      .innerJoin(tracks, eq(trackReactions.trackId, tracks.id))
      .where(eq(trackReactions.reactionType, "DISLIKE"))
      .groupBy(tracks.id, tracks.title, tracks.artist)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    const likes = Number(reactionSummary?.likes || 0);
    const dislikes = Number(reactionSummary?.dislikes || 0);
    const reactionRatio = dislikes > 0 ? Number((likes / dislikes).toFixed(2)) : likes;

    // Playback Heatmap (range-filtered)
    // Group by day of week and hour of day
    const heatmapRaw = await db.execute(
      sql`SELECT 
        EXTRACT(DOW FROM "playedAt") AS day_of_week, 
        EXTRACT(HOUR FROM "playedAt") AS hour_of_day, 
        COUNT(*) AS play_count
      FROM play_logs
      WHERE "playedAt" >= ${rangeStart} AND "playedAt" < ${rangeEnd}
      GROUP BY day_of_week, hour_of_day
      ORDER BY day_of_week, hour_of_day`
    );
    const playbackHeatmap = Array.isArray(heatmapRaw) ? heatmapRaw : heatmapRaw.rows;

    // === PHASE 2: Engagement & Content Analytics ===

    // 11. Churn & Retention
    // Compare unique active businesses in current range vs equivalent prior period
    const rangeLengthMs = rangeEnd.getTime() - rangeStart.getTime();
    const priorStart = new Date(rangeStart.getTime() - rangeLengthMs);
    const priorEnd = rangeStart;

    const [activeNowResult] = await db
      .select({ count: sql<number>`cast(count(DISTINCT "businessId") as int)` })
      .from(playLogs)
      .where(and(gte(playLogs.playedAt, rangeStart), sql`${playLogs.playedAt} < ${rangeEnd}`));

    const [activePriorResult] = await db
      .select({ count: sql<number>`cast(count(DISTINCT "businessId") as int)` })
      .from(playLogs)
      .where(and(gte(playLogs.playedAt, priorStart), sql`${playLogs.playedAt} < ${priorEnd}`));

    // Retained = businesses active in BOTH periods
    const retainedResult = await db.execute(
      sql`SELECT cast(count(*) as int) as count FROM (
        SELECT DISTINCT "businessId" FROM play_logs
        WHERE "playedAt" >= ${rangeStart} AND "playedAt" < ${rangeEnd}
        INTERSECT
        SELECT DISTINCT "businessId" FROM play_logs
        WHERE "playedAt" >= ${priorStart} AND "playedAt" < ${priorEnd}
      ) AS retained_businesses`
    );
    const retainedRows = Array.isArray(retainedResult) ? retainedResult : retainedResult.rows;
    const retained = Number(retainedRows?.[0]?.count ?? 0);
    const activeNow = Number(activeNowResult?.count || 0);
    const activePrior = Number(activePriorResult?.count || 0);
    const churned = Math.max(activePrior - retained, 0);
    const churnRate = activePrior > 0 ? Number(((churned / activePrior) * 100).toFixed(1)) : 0;
    const newUsers = Math.max(activeNow - retained, 0);

    // 12. Playlist Popularity — top 10 playlists by play count in range
    const topPlaylistsRaw = await db.execute(
      sql`SELECT 
        p.id, p.name,
        cast(count(DISTINCT pt."trackId") as int) AS track_count,
        cast(count(pl.id) as int) AS play_count
      FROM playlists p
      INNER JOIN playlist_tracks pt ON pt."playlistId" = p.id
      LEFT JOIN play_logs pl ON pl."trackId" = pt."trackId"
        AND pl."playedAt" >= ${rangeStart} AND pl."playedAt" < ${rangeEnd}
      GROUP BY p.id, p.name
      ORDER BY play_count DESC
      LIMIT 10`
    );
    const topPlaylists = Array.isArray(topPlaylistsRaw) ? topPlaylistsRaw : topPlaylistsRaw.rows;

    // 13. Top Artists by play count in range
    const topArtistsRaw = await db.execute(
      sql`SELECT t.artist, cast(count(pl.id) as int) AS play_count
      FROM play_logs pl
      INNER JOIN tracks t ON t.id = pl."trackId"
      WHERE pl."playedAt" >= ${rangeStart} AND pl."playedAt" < ${rangeEnd}
        AND t.artist IS NOT NULL AND t.artist != ''
      GROUP BY t.artist
      ORDER BY play_count DESC
      LIMIT 10`
    );
    const topArtists = Array.isArray(topArtistsRaw) ? topArtistsRaw : topArtistsRaw.rows;

    // 14. Top Genres by play count in range
    const topGenresRaw = await db.execute(
      sql`SELECT t.genre, cast(count(pl.id) as int) AS play_count
      FROM play_logs pl
      INNER JOIN tracks t ON t.id = pl."trackId"
      WHERE pl."playedAt" >= ${rangeStart} AND pl."playedAt" < ${rangeEnd}
        AND t.genre IS NOT NULL AND t.genre != '' AND t.genre != 'Unknown'
      GROUP BY t.genre
      ORDER BY play_count DESC
      LIMIT 10`
    );
    const topGenres = Array.isArray(topGenresRaw) ? topGenresRaw : topGenresRaw.rows;

    // === PHASE 3: Business & Compliance ===

    // 15. Business Segmentation
    const bizByType = await db.execute(
      sql`SELECT "businessType" as type, cast(count(*) as int) as count
        FROM businesses
        WHERE "businessType" IS NOT NULL AND "businessType" != ''
        GROUP BY "businessType"
        ORDER BY count DESC`
    );
    const businessByType = Array.isArray(bizByType) ? bizByType : bizByType.rows;

    const bizByPlan = await db.execute(
      sql`SELECT COALESCE("currentPlanSlug", 'Без плана') as plan, cast(count(*) as int) as count
        FROM businesses
        GROUP BY plan
        ORDER BY count DESC`
    );
    const businessByPlan = Array.isArray(bizByPlan) ? bizByPlan : bizByPlan.rows;

    const bizByInterval = await db.execute(
      sql`SELECT "billingInterval" as interval, cast(count(*) as int) as count
        FROM businesses
        GROUP BY "billingInterval"
        ORDER BY count DESC`
    );
    const businessByInterval = Array.isArray(bizByInterval) ? bizByInterval : bizByInterval.rows;

    // 16. Active/Inactive Locations
    const activeLocationsRaw = await db.execute(
      sql`SELECT l.id, l.name, l.address, b."legalName" as business_name,
        cast(count(pl.id) as int) as play_count
      FROM locations l
      INNER JOIN businesses b ON b.id = l."businessId"
      LEFT JOIN play_logs pl ON pl."locationId" = l.id
        AND pl."playedAt" >= ${rangeStart} AND pl."playedAt" < ${rangeEnd}
      GROUP BY l.id, l.name, l.address, b."legalName"
      ORDER BY play_count DESC
      LIMIT 10`
    );
    const activeLocations = Array.isArray(activeLocationsRaw) ? activeLocationsRaw : activeLocationsRaw.rows;

    // 17. Location Health
    const [totalLocationsResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(locations);
    const totalLocations = Number(totalLocationsResult?.count || 0);

    const activeLocCountRaw = await db.execute(
      sql`SELECT cast(count(DISTINCT l.id) as int) as count
      FROM locations l
      INNER JOIN play_logs pl ON pl."locationId" = l.id
      WHERE pl."playedAt" >= ${rangeStart} AND pl."playedAt" < ${rangeEnd}`
    );
    const activeLocRows = Array.isArray(activeLocCountRaw) ? activeLocCountRaw : activeLocCountRaw.rows;
    const activeLocCount = Number(activeLocRows?.[0]?.count ?? 0);
    const inactiveLocCount = Math.max(totalLocations - activeLocCount, 0);
    const locationHealthRate = totalLocations > 0
      ? Number(((activeLocCount / totalLocations) * 100).toFixed(1))
      : 100;

    // 18. Audit Log Completeness
    const coveredDaysRaw = await db.execute(
      sql`SELECT cast(count(DISTINCT to_char("playedAt", 'YYYY-MM-DD')) as int) as covered
      FROM play_logs
      WHERE "playedAt" >= ${rangeStart} AND "playedAt" < ${rangeEnd}`
    );
    const coveredRows = Array.isArray(coveredDaysRaw) ? coveredDaysRaw : coveredDaysRaw.rows;
    const coveredDays = Number(coveredRows?.[0]?.covered ?? 0);
    const totalRangeDays = Math.max(rangeDays, 1);
    const coverageRate = Number(((coveredDays / totalRangeDays) * 100).toFixed(1));
    const gapDays = Math.max(totalRangeDays - coveredDays, 0);

    // 19. Agreement Acceptance
    const [licenseStats] = await db
      .select({
        total: sql<number>`cast(count(*) as int)`,
        accepted: sql<number>`cast(count(*) filter (where "agreementAcceptedAt" IS NOT NULL) as int)`,
      })
      .from(licenses);
    const totalLicenses = Number(licenseStats?.total || 0);
    const acceptedLicenses = Number(licenseStats?.accepted || 0);
    const pendingLicenses = totalLicenses - acceptedLicenses;

    const [legalEventCount] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(legalAcceptanceEvents);
    const totalLegalEvents = Number(legalEventCount?.count || 0);

    // === PHASE 4: AI & Feature Usage ===

    // 20. AI/TTS Usage aggregation
    const aiTtsStats = await db.execute(
      sql`SELECT
        cast(sum("ttsMonthlyUsed") as int) AS total_tts,
        cast(sum("aiMonthlyUsed") as int) AS total_ai,
        cast(count(*) filter (where "ttsMonthlyUsed" > 0) as int) AS active_tts_users,
        cast(count(*) filter (where "aiMonthlyUsed" > 0) as int) AS active_ai_users
      FROM businesses`
    );
    const aiTtsRow = Array.isArray(aiTtsStats) ? aiTtsStats : aiTtsStats.rows;
    const aiTts = aiTtsRow?.[0];

    // Top TTS users
    const topTtsRaw = await db.execute(
      sql`SELECT b."legalName" as name, b."ttsMonthlyUsed" as usage
      FROM businesses b
      WHERE b."ttsMonthlyUsed" > 0
      ORDER BY b."ttsMonthlyUsed" DESC
      LIMIT 5`
    );
    const topTtsUsers = Array.isArray(topTtsRaw) ? topTtsRaw : topTtsRaw.rows;

    // Top AI users
    const topAiRaw = await db.execute(
      sql`SELECT b."legalName" as name, b."aiMonthlyUsed" as usage
      FROM businesses b
      WHERE b."aiMonthlyUsed" > 0
      ORDER BY b."aiMonthlyUsed" DESC
      LIMIT 5`
    );
    const topAiUsers = Array.isArray(topAiRaw) ? topAiRaw : topAiRaw.rows;

    // 21. Automated Play-Log Insights
    const peakHourRaw = await db.execute(
      sql`SELECT EXTRACT(HOUR FROM "playedAt")::int AS hour, cast(count(*) as int) AS plays
      FROM play_logs
      WHERE "playedAt" >= ${rangeStart} AND "playedAt" < ${rangeEnd}
      GROUP BY hour
      ORDER BY plays DESC
      LIMIT 1`
    );
    const peakHourRows = Array.isArray(peakHourRaw) ? peakHourRaw : peakHourRaw.rows;
    const peakHour = peakHourRows?.[0] ? { hour: Number(peakHourRows[0].hour), plays: Number(peakHourRows[0].plays) } : null;

    const dayStatsRaw = await db.execute(
      sql`SELECT EXTRACT(DOW FROM "playedAt")::int AS dow, cast(count(*) as int) AS plays
      FROM play_logs
      WHERE "playedAt" >= ${rangeStart} AND "playedAt" < ${rangeEnd}
      GROUP BY dow
      ORDER BY plays ASC`
    );
    const dayStatsRows = Array.isArray(dayStatsRaw) ? dayStatsRaw : dayStatsRaw.rows;
    const quietestDay = dayStatsRows?.[0] ? { dow: Number(dayStatsRows[0].dow), plays: Number(dayStatsRows[0].plays) } : null;
    const busiestDay = dayStatsRows?.length > 0
      ? { dow: Number(dayStatsRows[dayStatsRows.length - 1].dow), plays: Number(dayStatsRows[dayStatsRows.length - 1].plays) }
      : null;
    const avgDailyPlays = totalRangeDays > 0 ? Math.round(Number(playCount.count) / totalRangeDays) : 0;

    // 22. Payment Health
    const paymentHealthRaw = await db.execute(
      sql`SELECT 
        "errorCode",
        status,
        cast(count(*) as int) as count
      FROM payments
      WHERE "createdAt" >= ${rangeStart} AND "createdAt" < ${rangeEnd}
      GROUP BY "errorCode", status`
    );
    const paymentHealthRows = (Array.isArray(paymentHealthRaw) ? paymentHealthRaw : paymentHealthRaw.rows) as any[];
    const totalPayments = paymentHealthRows.reduce((acc, row) => acc + row.count, 0);
    const failedPaymentsCount = paymentHealthRows.filter(row => row.status === 'error' || row.status === 'rejected' || row.errorCode).reduce((acc, row) => acc + row.count, 0);
    const paymentFailureRate = totalPayments > 0 ? (failedPaymentsCount / totalPayments) * 100 : 0;
    const topPaymentErrors = paymentHealthRows
      .filter(row => row.errorCode)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 23. License Health
    const licenseHealthRaw = await db.execute(
      sql`SELECT 
        "documentStatus",
        cast(count(*) as int) as count
      FROM licenses
      WHERE "createdAt" >= ${rangeStart} AND "createdAt" < ${rangeEnd}
      GROUP BY "documentStatus"`
    );
    const licenseHealthRows = (Array.isArray(licenseHealthRaw) ? licenseHealthRaw : licenseHealthRaw.rows) as any[];
    const totalLicensesCount = licenseHealthRows.reduce((acc, row) => acc + row.count, 0);
    const failedLicensesCount = licenseHealthRows.find(row => row.documentStatus === 'FAILED')?.count || 0;
    const licenseFailureRate = totalLicensesCount > 0 ? (failedLicensesCount / totalLicensesCount) * 100 : 0;

    const recentLicenseErrorsRaw = await db.execute(
      sql`SELECT "licenseNumber", "generationError", "createdAt"
      FROM licenses
      WHERE "documentStatus" = 'FAILED'
      ORDER BY "createdAt" DESC
      LIMIT 5`
    );
    const recentLicenseErrors = Array.isArray(recentLicenseErrorsRaw) ? recentLicenseErrorsRaw : recentLicenseErrorsRaw.rows;

    // 24. Playback Health (Silent Locations - last 24h)
    const silentLocationsRaw = await db.execute(
      sql`SELECT cast(count(DISTINCT l.id) as int) as count
      FROM locations l
      JOIN businesses b ON l."businessId" = b.id
      WHERE b."subscriptionStatus" = 'ACTIVE'
      AND l.id NOT IN (
        SELECT DISTINCT "locationId" 
        FROM play_logs 
        WHERE "playedAt" >= NOW() - INTERVAL '24 hours'
      )`
    );
    const silentLocations = Number((Array.isArray(silentLocationsRaw) ? silentLocationsRaw : silentLocationsRaw.rows)?.[0]?.count || 0);

    // === PHASE 7: Skip Analytics ===
    
    // 25. Total Skips in range
    const [skipsCount] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(trackSkips)
      .where(and(gte(trackSkips.skippedAt, rangeStart), sql`${trackSkips.skippedAt} < ${rangeEnd}`));
    const totalSkips = Number(skipsCount?.count || 0);

    // 26. Skips Trend (per day)
    const skipsTrendRaw = await db.execute(
      sql`SELECT to_char("skippedAt", 'YYYY-MM-DD') as day, cast(count(*) as int) as skips
          FROM track_skips
          WHERE "skippedAt" >= ${rangeStart} AND "skippedAt" < ${rangeEnd}
          GROUP BY day
          ORDER BY day ASC`
    );
    const skipsTrend = Array.isArray(skipsTrendRaw) ? skipsTrendRaw : skipsTrendRaw.rows;

    // 27. Top Skipped Tracks
    const topSkippedTracksRaw = await db.execute(
      sql`SELECT t.id, t.title, t.artist, cast(count(ts.id) as int) AS skip_count
      FROM track_skips ts
      INNER JOIN tracks t ON t.id = ts."trackId"
      WHERE ts."skippedAt" >= ${rangeStart} AND ts."skippedAt" < ${rangeEnd}
      GROUP BY t.id, t.title, t.artist
      ORDER BY skip_count DESC
      LIMIT 10`
    );
    const topSkippedTracks = Array.isArray(topSkippedTracksRaw) ? topSkippedTracksRaw : topSkippedTracksRaw.rows;

    // 28. Skip Rate (skips/plays ratio in same range)
    const totalPlays = Number(playCount.count || 0);
    const skipRate = totalPlays > 0 ? Number(((totalSkips / totalPlays) * 100).toFixed(2)) : 0;

    return {
      success: true,
      data: {
        summary: {
          users: Number(userCount.count),
          businesses: Number(businessCount.count),
          tracks: Number(trackCount.count),
          plays: Number(playCount.count),
          hours: totalListeningHours,
          revenue: totalRevenue,
          likes,
          dislikes,
          reactionRatio,
        },
        distributions: {
          userTypes: userTypeStats,
          subscriptions: subscriptionStats
        },
        growth: growthData,
        topTracks,
        reactions: {
          topLikedTracks,
          topDislikedTracks,
        },
        activity: {
          dau,
          wau,
          mau,
        },
        revenueTrend,
        playbackHeatmap,
        engagement: {
          churn: { activeNow, activePrior, retained, churned, churnRate, newUsers },
          topPlaylists,
          topArtists,
          topGenres,
        },
        compliance: {
          segmentation: { byType: businessByType, byPlan: businessByPlan, byInterval: businessByInterval },
          locations: { active: activeLocations, totalLocations, activeLocCount, inactiveLocCount, locationHealthRate },
          auditLog: { totalDays: totalRangeDays, coveredDays, coverageRate, gapDays },
          agreements: { totalLicenses, acceptedLicenses, pendingLicenses, totalLegalEvents },
        },
        aiFeatures: {
          usage: {
            totalAi: Number(aiTts?.total_ai || 0),
            activeAiUsers: Number(aiTts?.active_ai_users || 0),
            totalTts: Number(aiTts?.total_tts || 0),
            activeTtsUsers: Number(aiTts?.active_tts_users || 0),
            topTtsUsers: topTtsUsers.map((r: any) => ({ name: r.name, usage: Number(r.usage) })),
            topAiUsers: topAiUsers.map((r: any) => ({ name: r.name, usage: Number(r.usage) })),
          },
          insights: {
            peakHour,
            busiestDay,
            quietestDay,
            avgDailyPlays: Number(avgDailyPlays),
          }
        },
        health: {
          payments: {
            failureRate: paymentFailureRate,
            topErrors: topPaymentErrors.map((r: any) => ({ code: r.errorCode, status: r.status, count: r.count })),
          },
          licenses: {
            failureRate: licenseFailureRate,
            recentErrors: (recentLicenseErrors as any[]).map((r: any) => ({ licenseNumber: r.licenseNumber, error: r.generationError, date: r.createdAt })),
          },
          playbackAnomaly: {
            silentLocations: silentLocations
          }
        },
        skipping: {
          totalSkips,
          skipsTrend,
          topSkippedTracks,
          skipRate
        },
        pop
      },
    };
  } catch (error) {
    console.error("Analytics Error:", error);
    return { success: false, error: "Failed to fetch analytics data" };
  }
}

export async function exportAdminAnalyticsCSVAction(dateRange?: { from: string; to: string }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.id) });
    if (!dbUser || dbUser.role !== "ADMIN") return { success: false, error: "Forbidden: Admin access required" };

    const result = await getAdminAnalyticsAction(dateRange);
    if (!result.success) return result;

    const d = result.data as any;
    const rows: (string | number)[][] = [
      ["BizMusic Analytics Report", ""],
      ["Generated At", new Date().toISOString()],
      ["Range From", dateRange?.from || "Beginning"],
      ["Range To", dateRange?.to || "Now"],
      ["", ""],
      ["--- SUMMARY ---", ""],
      ["Total Users", d.summary.users],
      ["Total Businesses", d.summary.businesses],
      ["Total Tracks", d.summary.tracks],
      ["Total Plays (Range)", d.summary.plays],
      ["Listening Hours (Range)", d.summary.hours],
      ["Total Revenue (Range, RUB)", d.summary.revenue],
      ["Likes", d.summary.likes],
      ["Dislikes", d.summary.dislikes],
      ["", ""],
      ["--- RETENTION & ENGAGEMENT ---", ""],
      ["Churn Rate (%)", d.engagement.churn.churnRate],
      ["Active Now", d.engagement.churn.activeNow],
      ["Churned", d.engagement.churn.churned],
      ["New Users in Period", d.engagement.churn.newUsers],
      ["", ""],
      ["--- COMPLIANCE & HEALTH ---", ""],
      ["Silent Locations (24h)", d.health.playbackAnomaly.silentLocations],
      ["Payment Failure Rate (%)", d.health.payments.failureRate.toFixed(2)],
      ["License Failure Rate (%)", d.health.licenses.failureRate.toFixed(2)],
      ["Location Health Rate (%)", d.compliance.locations.locationHealthRate],
      ["Audit Log Coverage (%)", d.compliance.auditLog.coverageRate],
      ["", ""],
      ["--- TOP CONTENT ---", ""],
      ["Type", "Name/Title", "Metric"],
      ...(d.topTracks || []).map((t: any) => ["Track (Plays)", t.title, t.play_count]),
      ...(d.skipping.topSkippedTracks || []).map((t: any) => ["Track (Skips)", t.title, t.skip_count]),
      ...(d.engagement.topArtists || []).map((a: any) => ["Artist", a.artist, a.play_count]),
      ...(d.engagement.topPlaylists || []).map((p: any) => ["Playlist", p.name, p.play_count]),
    ];

    const csvContent = rows.map(r => r.join(",")).join("\n");
    return { success: true, data: csvContent };
  } catch (error) {
    console.error("Export Error:", error);
    return { success: false, error: "Failed to export CSV" };
  }
}
