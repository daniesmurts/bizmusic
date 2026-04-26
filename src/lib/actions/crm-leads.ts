"use server";

import { db } from "@/db";
import {
  leads,
  leadActivities,
  crmBusinesses,
  cities,
  businessNiches,
  referralAgents,
  commissionLedger,
} from "@/db/schema";
import { eq, and, desc, asc, lte, sql, count, inArray } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_STATUSES = [
  "new",
  "no_answer",
  "in_progress",
  "trial_sent",
  "converted",
  "rejected",
  "invalid",
] as const;
type LeadStatus = (typeof VALID_STATUSES)[number];

const CALL_STATUSES: LeadStatus[] = ["no_answer", "in_progress", "trial_sent"];

async function getAgentId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [agent] = await db
    .select({ id: referralAgents.id })
    .from(referralAgents)
    .where(eq(referralAgents.userId, user.id))
    .limit(1);

  return agent?.id ?? null;
}

// ─── Lead Pipeline ────────────────────────────────────────────────────────────

export async function getAgentLeadsAction(status?: string) {
  try {
    const agentId = await getAgentId();
    if (!agentId) return { success: false as const, error: "Агент не найден" };

    const conditions = [eq(leads.agentId, agentId)];
    if (status && VALID_STATUSES.includes(status as LeadStatus)) {
      conditions.push(eq(leads.status, status));
    }

    const rows = await db
      .select({
        id: leads.id,
        status: leads.status,
        priority: leads.priority,
        callAttempts: leads.callAttempts,
        nextCallbackAt: leads.nextCallbackAt,
        lastContactedAt: leads.lastContactedAt,
        convertedAt: leads.convertedAt,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
        business: {
          id: crmBusinesses.id,
          name: crmBusinesses.name,
          phone: crmBusinesses.phone,
          address: crmBusinesses.address,
          contactName: crmBusinesses.contactName,
        },
        city: {
          name: cities.name,
        },
        niche: {
          name: businessNiches.name,
          icon: businessNiches.icon,
        },
      })
      .from(leads)
      .innerJoin(crmBusinesses, eq(leads.businessId, crmBusinesses.id))
      .leftJoin(cities, eq(crmBusinesses.cityId, cities.id))
      .leftJoin(businessNiches, eq(crmBusinesses.nicheId, businessNiches.id))
      .where(and(...conditions))
      .orderBy(asc(leads.priority), desc(leads.updatedAt));

    // Attach last activity summary to each lead
    const leadIds = rows.map((r) => r.id);
    const lastActivities =
      leadIds.length > 0
        ? await db
            .select({
              leadId: leadActivities.leadId,
              type: leadActivities.type,
              note: leadActivities.note,
              createdAt: leadActivities.createdAt,
            })
            .from(leadActivities)
            .where(inArray(leadActivities.leadId, leadIds))
            .orderBy(desc(leadActivities.createdAt))
        : [];

    const lastActivityMap = new Map<
      string,
      { type: string; note: string | null; createdAt: Date }
    >();
    for (const a of lastActivities) {
      if (!lastActivityMap.has(a.leadId)) {
        lastActivityMap.set(a.leadId, a);
      }
    }

    const data = rows.map((r) => ({
      ...r,
      lastActivity: lastActivityMap.get(r.id) ?? null,
    }));

    return { success: true as const, data };
  } catch (error: unknown) {
    console.error("getAgentLeadsAction error:", error);
    return { success: false as const, error: "Не удалось загрузить лиды" };
  }
}

// ─── Today's Callbacks ────────────────────────────────────────────────────────

export async function getAgentTodayCallbacksAction() {
  try {
    const agentId = await getAgentId();
    if (!agentId) return { success: false as const, error: "Агент не найден" };

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const rows = await db
      .select({
        id: leads.id,
        status: leads.status,
        priority: leads.priority,
        callAttempts: leads.callAttempts,
        nextCallbackAt: leads.nextCallbackAt,
        lastContactedAt: leads.lastContactedAt,
        business: {
          id: crmBusinesses.id,
          name: crmBusinesses.name,
          phone: crmBusinesses.phone,
          contactName: crmBusinesses.contactName,
        },
        city: { name: cities.name },
        niche: { name: businessNiches.name, icon: businessNiches.icon },
      })
      .from(leads)
      .innerJoin(crmBusinesses, eq(leads.businessId, crmBusinesses.id))
      .leftJoin(cities, eq(crmBusinesses.cityId, cities.id))
      .leftJoin(businessNiches, eq(crmBusinesses.nicheId, businessNiches.id))
      .where(
        and(
          eq(leads.agentId, agentId),
          lte(leads.nextCallbackAt, endOfToday)
        )
      )
      .orderBy(asc(leads.priority), asc(leads.nextCallbackAt));

    return { success: true as const, data: rows };
  } catch (error: unknown) {
    console.error("getAgentTodayCallbacksAction error:", error);
    return { success: false as const, error: "Ошибка загрузки" };
  }
}

// ─── Update Lead Status ──────────────────────────────────────────────────────

export async function updateLeadStatusAction(
  leadId: string,
  newStatus: string
) {
  try {
    if (!VALID_STATUSES.includes(newStatus as LeadStatus)) {
      return { success: false as const, error: "Неверный статус" };
    }

    const agentId = await getAgentId();
    if (!agentId) return { success: false as const, error: "Агент не найден" };

    // Verify ownership
    const [existingLead] = await db
      .select({ id: leads.id, status: leads.status })
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.agentId, agentId)))
      .limit(1);

    if (!existingLead) {
      return { success: false as const, error: "Лид не найден" };
    }

    const previousStatus = existingLead.status;
    const now = new Date();

    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: now,
    };

    // Increment call attempts for call-related statuses
    if (CALL_STATUSES.includes(newStatus as LeadStatus)) {
      updateData.callAttempts = sql`${leads.callAttempts} + 1`;
      updateData.lastContactedAt = now;
    }

    // Mark converted
    if (newStatus === "converted") {
      updateData.convertedAt = now;
    }

    await db.update(leads).set(updateData).where(eq(leads.id, leadId));

    // Log the activity
    const activityType =
      newStatus === "converted"
        ? "converted"
        : newStatus === "trial_sent"
          ? "trial_sent"
          : "status_change";

    await db.insert(leadActivities).values({
      leadId,
      agentId,
      type: activityType,
      previousStatus,
      newStatus,
    });

    // Fetch updated lead
    const [updated] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    return { success: true as const, data: updated };
  } catch (error: unknown) {
    console.error("updateLeadStatusAction error:", error);
    return { success: false as const, error: "Не удалось обновить статус" };
  }
}

// ─── Schedule Callback ────────────────────────────────────────────────────────

export async function scheduleCallbackAction(
  leadId: string,
  callbackAt: string
) {
  try {
    const agentId = await getAgentId();
    if (!agentId) return { success: false as const, error: "Агент не найден" };

    const [existingLead] = await db
      .select({ id: leads.id })
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.agentId, agentId)))
      .limit(1);

    if (!existingLead)
      return { success: false as const, error: "Лид не найден" };

    const callbackDate = new Date(callbackAt);

    await db
      .update(leads)
      .set({ nextCallbackAt: callbackDate, updatedAt: new Date() })
      .where(eq(leads.id, leadId));

    await db.insert(leadActivities).values({
      leadId,
      agentId,
      type: "callback_scheduled",
      callbackAt: callbackDate,
    });

    return { success: true as const };
  } catch (error: unknown) {
    console.error("scheduleCallbackAction error:", error);
    return {
      success: false as const,
      error: "Не удалось запланировать звонок",
    };
  }
}

// ─── Add Note ─────────────────────────────────────────────────────────────────

export async function addLeadNoteAction(leadId: string, note: string) {
  try {
    const agentId = await getAgentId();
    if (!agentId) return { success: false as const, error: "Агент не найден" };

    const [existingLead] = await db
      .select({ id: leads.id })
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.agentId, agentId)))
      .limit(1);

    if (!existingLead)
      return { success: false as const, error: "Лид не найден" };

    const [activity] = await db
      .insert(leadActivities)
      .values({
        leadId,
        agentId,
        type: "note",
        note,
      })
      .returning();

    return { success: true as const, data: activity };
  } catch (error: unknown) {
    console.error("addLeadNoteAction error:", error);
    return {
      success: false as const,
      error: "Не удалось сохранить заметку",
    };
  }
}

// ─── Lead Detail ──────────────────────────────────────────────────────────────

export async function getLeadDetailAction(leadId: string) {
  try {
    const agentId = await getAgentId();
    if (!agentId) return { success: false as const, error: "Агент не найден" };

    const [lead] = await db
      .select({
        id: leads.id,
        status: leads.status,
        priority: leads.priority,
        callAttempts: leads.callAttempts,
        nextCallbackAt: leads.nextCallbackAt,
        lastContactedAt: leads.lastContactedAt,
        convertedAt: leads.convertedAt,
        convertedSubscriptionId: leads.convertedSubscriptionId,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
        business: {
          id: crmBusinesses.id,
          name: crmBusinesses.name,
          phone: crmBusinesses.phone,
          address: crmBusinesses.address,
          website: crmBusinesses.website,
          contactName: crmBusinesses.contactName,
        },
        city: { name: cities.name },
        niche: { name: businessNiches.name, icon: businessNiches.icon },
      })
      .from(leads)
      .innerJoin(crmBusinesses, eq(leads.businessId, crmBusinesses.id))
      .leftJoin(cities, eq(crmBusinesses.cityId, cities.id))
      .leftJoin(businessNiches, eq(crmBusinesses.nicheId, businessNiches.id))
      .where(and(eq(leads.id, leadId), eq(leads.agentId, agentId)))
      .limit(1);

    if (!lead) return { success: false as const, error: "Лид не найден" };

    const activities = await db
      .select()
      .from(leadActivities)
      .where(eq(leadActivities.leadId, leadId))
      .orderBy(desc(leadActivities.createdAt));

    // Get referral code for this agent (for trial_sent status)
    const [agent] = await db
      .select({ referralCode: referralAgents.referralCode })
      .from(referralAgents)
      .where(eq(referralAgents.id, agentId))
      .limit(1);

    return {
      success: true as const,
      data: {
        ...lead,
        activities,
        referralCode: agent?.referralCode ?? null,
      },
    };
  } catch (error: unknown) {
    console.error("getLeadDetailAction error:", error);
    return {
      success: false as const,
      error: "Не удалось загрузить детали лида",
    };
  }
}

// ─── Update Contact Name ──────────────────────────────────────────────────────

export async function updateLeadContactNameAction(
  leadId: string,
  contactName: string
) {
  try {
    const agentId = await getAgentId();
    if (!agentId) return { success: false as const, error: "Агент не найден" };

    const [lead] = await db
      .select({ businessId: leads.businessId })
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.agentId, agentId)))
      .limit(1);

    if (!lead) return { success: false as const, error: "Лид не найден" };

    await db
      .update(crmBusinesses)
      .set({ contactName })
      .where(eq(crmBusinesses.id, lead.businessId));

    return { success: true as const };
  } catch (error: unknown) {
    console.error("updateLeadContactNameAction error:", error);
    return { success: false as const, error: "Не удалось обновить контакт" };
  }
}

// ─── Set Converted Subscription ID ────────────────────────────────────────────

export async function setConvertedSubscriptionIdAction(
  leadId: string,
  subscriptionId: string
) {
  try {
    const agentId = await getAgentId();
    if (!agentId) return { success: false as const, error: "Агент не найден" };

    await db
      .update(leads)
      .set({ convertedSubscriptionId: subscriptionId, updatedAt: new Date() })
      .where(and(eq(leads.id, leadId), eq(leads.agentId, agentId)));

    return { success: true as const };
  } catch (error: unknown) {
    console.error("setConvertedSubscriptionIdAction error:", error);
    return { success: false as const, error: "Ошибка сохранения" };
  }
}

// ─── Agent Stats ──────────────────────────────────────────────────────────────

export async function getAgentStatsAction() {
  try {
    const agentId = await getAgentId();
    if (!agentId) return { success: false as const, error: "Агент не найден" };

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Call counts
    const callActivities = await db
      .select({
        createdAt: leadActivities.createdAt,
      })
      .from(leadActivities)
      .where(
        and(
          eq(leadActivities.agentId, agentId),
          inArray(leadActivities.type, [
            "call_attempt",
            "call_connected",
            "status_change",
          ])
        )
      );

    const callsToday = callActivities.filter(
      (a) => a.createdAt >= startOfDay
    ).length;
    const callsThisWeek = callActivities.filter(
      (a) => a.createdAt >= startOfWeek
    ).length;
    const callsThisMonth = callActivities.filter(
      (a) => a.createdAt >= startOfMonth
    ).length;

    // Pipeline counts
    const pipelineCounts = await db
      .select({
        status: leads.status,
        count: count(),
      })
      .from(leads)
      .where(eq(leads.agentId, agentId))
      .groupBy(leads.status);

    const pipeline: Record<string, number> = {};
    let totalLeads = 0;
    let convertedCount = 0;
    for (const row of pipelineCounts) {
      pipeline[row.status] = row.count;
      totalLeads += row.count;
      if (row.status === "converted") convertedCount = row.count;
    }

    const conversionRate =
      totalLeads > 0
        ? Math.round((convertedCount / totalLeads) * 100)
        : 0;

    // Average call attempts before conversion
    const convertedLeads = await db
      .select({ callAttempts: leads.callAttempts })
      .from(leads)
      .where(
        and(eq(leads.agentId, agentId), eq(leads.status, "converted"))
      );

    const avgCallAttempts =
      convertedLeads.length > 0
        ? Math.round(
            convertedLeads.reduce((s, l) => s + l.callAttempts, 0) /
              convertedLeads.length
          )
        : 0;

    // Commission earned
    const commissions = await db
      .select({
        total: sql<number>`COALESCE(SUM(${commissionLedger.commissionAmountKopecks}), 0)`.mapWith(
          Number
        ),
      })
      .from(commissionLedger)
      .where(eq(commissionLedger.agentId, agentId));

    const totalCommissionKopecks = commissions[0]?.total ?? 0;

    // Leaderboard rank (by conversions this month)
    const allAgentConversions = await db
      .select({
        agentId: leads.agentId,
        conversions: count(),
      })
      .from(leads)
      .where(eq(leads.status, "converted"))
      .groupBy(leads.agentId)
      .orderBy(desc(count()));

    const rank =
      allAgentConversions.findIndex((a) => a.agentId === agentId) + 1;

    return {
      success: true as const,
      data: {
        callsToday,
        callsThisWeek,
        callsThisMonth,
        pipeline,
        totalLeads,
        convertedCount,
        conversionRate,
        avgCallAttempts,
        totalCommissionKopecks,
        leaderboardRank: rank || allAgentConversions.length + 1,
        totalAgents: allAgentConversions.length,
      },
    };
  } catch (error: unknown) {
    console.error("getAgentStatsAction error:", error);
    return { success: false as const, error: "Ошибка загрузки статистики" };
  }
}

// ─── Get Lookup Data (cities, niches) ─────────────────────────────────────────

export async function getCrmLookupsAction() {
  try {
    const allCities = await db
      .select({ id: cities.id, name: cities.name })
      .from(cities)
      .where(eq(cities.isActive, true))
      .orderBy(asc(cities.name));

    const allNiches = await db
      .select({
        id: businessNiches.id,
        name: businessNiches.name,
        icon: businessNiches.icon,
      })
      .from(businessNiches)
      .orderBy(asc(businessNiches.name));

    return { success: true as const, data: { cities: allCities, niches: allNiches } };
  } catch (error: unknown) {
    console.error("getCrmLookupsAction error:", error);
    return { success: false as const, error: "Ошибка загрузки данных" };
  }
}
