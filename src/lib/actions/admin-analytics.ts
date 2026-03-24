"use server";

import { db } from "@/db";
import { users, businesses, tracks, playLogs, licenses, payments } from "@/db/schema";
import { eq, sql, desc, and, gte } from "drizzle-orm";
import { subMonths } from "date-fns";
import { createClient } from "@/utils/supabase/server";

export async function getAdminAnalyticsAction() {
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
    // 1. Basic Stats
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [businessCount] = await db.select({ count: sql<number>`count(*)` }).from(businesses);
    const [trackCount] = await db.select({ count: sql<number>`count(*)` }).from(tracks);
    const [playCount] = await db.select({ count: sql<number>`count(*)` }).from(playLogs);
    
    // 2. Play Time Allocation
    const [totalDurationResult] = await db
      .select({ total: sql<number>`sum(${tracks.duration})` })
      .from(playLogs)
      .innerJoin(tracks, eq(playLogs.trackId, tracks.id));
    
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

    // 6. Top Tracks
    const topTracks = await db
      .select({
        id: tracks.id,
        title: tracks.title,
        artist: tracks.artist,
        playCount: sql<number>`count(${playLogs.id})`
      })
      .from(playLogs)
      .innerJoin(tracks, eq(playLogs.trackId, tracks.id))
      .groupBy(tracks.id, tracks.title, tracks.artist)
      .orderBy(desc(sql`count(${playLogs.id})`))
      .limit(10);

    // 7. Revenue Stats
    const [totalRevenueResult] = await db
      .select({ total: sql<number>`sum(${payments.amount})` })
      .from(payments)
      .where(eq(payments.status, "CONFIRMED"));
    
    const totalRevenue = (totalRevenueResult?.total || 0) / 100; // in Rubles

    return {
      success: true,
      data: {
        summary: {
          users: Number(userCount.count),
          businesses: Number(businessCount.count),
          tracks: Number(trackCount.count),
          plays: Number(playCount.count),
          hours: totalListeningHours,
          revenue: totalRevenue
        },
        distributions: {
          userTypes: userTypeStats,
          subscriptions: subscriptionStats
        },
        growth: growthData,
        topTracks
      }
    };
  } catch (error) {
    console.error("Analytics Error:", error);
    return { success: false, error: "Failed to fetch analytics data" };
  }
}
