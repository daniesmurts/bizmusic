"use server";

import { db } from "@/db";
import {
  leads,
  leadActivities,
  crmBusinesses,
  cities,
  businessNiches,
  referralAgents,
  agentAssignments,
} from "@/db/schema";
import {
  eq,
  and,
  desc,
  asc,
  sql,
  count,
  ilike,
  inArray,
  isNull,
  gte,
  lte,
} from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram";

// ─── Auth Guard ───────────────────────────────────────────────────────────────

async function requireAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return data?.role === "ADMIN";
}

// ─── Business Database ────────────────────────────────────────────────────────

export async function getCrmBusinessesAction(filters?: {
  cityId?: string;
  nicheId?: string;
  assigned?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return { success: false as const, error: "Нет доступа" };

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (filters?.cityId) conditions.push(eq(crmBusinesses.cityId, filters.cityId));
    if (filters?.nicheId) conditions.push(eq(crmBusinesses.nicheId, filters.nicheId));
    if (filters?.assigned !== undefined) conditions.push(eq(crmBusinesses.isAssigned, filters.assigned));
    if (filters?.search) conditions.push(ilike(crmBusinesses.name, `%${filters.search}%`));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: crmBusinesses.id,
        name: crmBusinesses.name,
        phone: crmBusinesses.phone,
        address: crmBusinesses.address,
        website: crmBusinesses.website,
        contactName: crmBusinesses.contactName,
        source: crmBusinesses.source,
        isAssigned: crmBusinesses.isAssigned,
        createdAt: crmBusinesses.createdAt,
        city: { id: cities.id, name: cities.name },
        niche: { id: businessNiches.id, name: businessNiches.name, icon: businessNiches.icon },
      })
      .from(crmBusinesses)
      .leftJoin(cities, eq(crmBusinesses.cityId, cities.id))
      .leftJoin(businessNiches, eq(crmBusinesses.nicheId, businessNiches.id))
      .where(whereClause)
      .orderBy(desc(crmBusinesses.createdAt))
      .limit(pageSize)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(crmBusinesses)
      .where(whereClause);

    return {
      success: true as const,
      data: rows,
      pagination: { page, pageSize, total },
    };
  } catch (error: unknown) {
    console.error("getCrmBusinessesAction error:", error);
    return { success: false as const, error: "Ошибка загрузки бизнесов" };
  }
}

// ─── Add Single Business ──────────────────────────────────────────────────────

export async function addCrmBusinessAction(data: {
  name: string;
  phone?: string;
  address?: string;
  website?: string;
  contactName?: string;
  cityId?: string;
  nicheId?: string;
  source?: string;
}) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return { success: false as const, error: "Нет доступа" };

    const [row] = await db
      .insert(crmBusinesses)
      .values({
        name: data.name,
        phone: data.phone ?? null,
        address: data.address ?? null,
        website: data.website ?? null,
        contactName: data.contactName ?? null,
        cityId: data.cityId ?? null,
        nicheId: data.nicheId ?? null,
        source: data.source ?? "manual",
      })
      .returning();

    return { success: true as const, data: row };
  } catch (error: unknown) {
    console.error("addCrmBusinessAction error:", error);
    return { success: false as const, error: "Не удалось добавить бизнес" };
  }
}

// ─── CSV Import ───────────────────────────────────────────────────────────────

interface CsvRow {
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  niche?: string;
}

interface ImportPreview {
  totalRows: number;
  matchedCities: number;
  unmatchedCities: string[];
  matchedNiches: number;
  unmatchedNiches: string[];
  sampleRows: CsvRow[];
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  const nameIdx = header.findIndex((h) => h === "name" || h === "название" || h === "наименование");
  const phoneIdx = header.findIndex((h) => h === "phone" || h === "телефон");
  const addressIdx = header.findIndex((h) => h === "address" || h === "адрес");
  const cityIdx = header.findIndex((h) => h === "city" || h === "город");
  const nicheIdx = header.findIndex((h) => h === "niche" || h === "ниша" || h === "категория");

  if (nameIdx === -1) return [];

  return lines.slice(1, 5001).map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    return {
      name: cols[nameIdx] || "",
      phone: phoneIdx >= 0 ? cols[phoneIdx] : undefined,
      address: addressIdx >= 0 ? cols[addressIdx] : undefined,
      city: cityIdx >= 0 ? cols[cityIdx] : undefined,
      niche: nicheIdx >= 0 ? cols[nicheIdx] : undefined,
    };
  }).filter((r) => r.name);
}

export async function importCsvPreviewAction(csvText: string) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return { success: false as const, error: "Нет доступа" };

    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      return { success: false as const, error: "CSV пуст или не содержит колонку name/название" };
    }

    // Load lookups for matching
    const allCities = await db.select({ id: cities.id, name: cities.name }).from(cities);
    const allNiches = await db.select({ id: businessNiches.id, name: businessNiches.name }).from(businessNiches);

    const cityMap = new Map(allCities.map((c) => [c.name.toLowerCase().trim(), c.id]));
    const nicheMap = new Map(allNiches.map((n) => [n.name.toLowerCase().trim(), n.id]));

    const unmatchedCities = new Set<string>();
    const unmatchedNiches = new Set<string>();
    let matchedCities = 0;
    let matchedNiches = 0;

    for (const row of rows) {
      if (row.city) {
        if (cityMap.has(row.city.toLowerCase().trim())) matchedCities++;
        else unmatchedCities.add(row.city);
      }
      if (row.niche) {
        if (nicheMap.has(row.niche.toLowerCase().trim())) matchedNiches++;
        else unmatchedNiches.add(row.niche);
      }
    }

    const preview: ImportPreview = {
      totalRows: rows.length,
      matchedCities,
      unmatchedCities: Array.from(unmatchedCities),
      matchedNiches,
      unmatchedNiches: Array.from(unmatchedNiches),
      sampleRows: rows.slice(0, 5),
    };

    return { success: true as const, data: preview };
  } catch (error: unknown) {
    console.error("importCsvPreviewAction error:", error);
    return { success: false as const, error: "Ошибка анализа CSV" };
  }
}

export async function importCsvConfirmAction(csvText: string) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return { success: false as const, error: "Нет доступа" };

    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      return { success: false as const, error: "CSV пуст" };
    }

    const allCities = await db.select({ id: cities.id, name: cities.name }).from(cities);
    const allNiches = await db.select({ id: businessNiches.id, name: businessNiches.name }).from(businessNiches);

    const cityMap = new Map(allCities.map((c) => [c.name.toLowerCase().trim(), c.id]));
    const nicheMap = new Map(allNiches.map((n) => [n.name.toLowerCase().trim(), n.id]));

    const insertValues = rows.map((row) => ({
      name: row.name,
      phone: row.phone ?? null,
      address: row.address ?? null,
      cityId: row.city ? cityMap.get(row.city.toLowerCase().trim()) ?? null : null,
      nicheId: row.niche ? nicheMap.get(row.niche.toLowerCase().trim()) ?? null : null,
      source: "csv" as const,
    }));

    // Batch insert (50 at a time to avoid query size limits)
    let inserted = 0;
    for (let i = 0; i < insertValues.length; i += 50) {
      const batch = insertValues.slice(i, i + 50);
      await db.insert(crmBusinesses).values(batch);
      inserted += batch.length;
    }

    return { success: true as const, data: { inserted } };
  } catch (error: unknown) {
    console.error("importCsvConfirmAction error:", error);
    return { success: false as const, error: "Ошибка импорта" };
  }
}

// ─── Bulk Lead Assignment ─────────────────────────────────────────────────────

export async function bulkAssignLeadsAction(
  businessIds: string[],
  agentId: string
) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return { success: false as const, error: "Нет доступа" };

    if (businessIds.length === 0) {
      return { success: false as const, error: "Не выбраны бизнесы" };
    }

    // Verify agent exists
    const [agent] = await db
      .select({ id: referralAgents.id, fullName: referralAgents.fullName, telegramChatId: referralAgents.telegramChatId })
      .from(referralAgents)
      .where(eq(referralAgents.id, agentId))
      .limit(1);

    if (!agent) return { success: false as const, error: "Агент не найден" };

    let created = 0;
    for (const businessId of businessIds) {
      try {
        await db.insert(leads).values({
          businessId,
          agentId,
          status: "new",
        });
        await db
          .update(crmBusinesses)
          .set({ isAssigned: true })
          .where(eq(crmBusinesses.id, businessId));
        created++;
      } catch (e) {
        // Skip duplicates
        console.warn("Duplicate lead assignment skipped:", businessId, e);
      }
    }

    // Notify agent via Telegram
    if (agent.telegramChatId) {
      await sendTelegramMessage(
        agent.telegramChatId,
        `📋 Вам назначено ${created} новых лидов! Откройте панель лидов для обзвона.`
      );
    }

    return { success: true as const, data: { created } };
  } catch (error: unknown) {
    console.error("bulkAssignLeadsAction error:", error);
    return { success: false as const, error: "Ошибка назначения лидов" };
  }
}

// ─── Agents Overview ──────────────────────────────────────────────────────────

export async function getAgentsOverviewAction() {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return { success: false as const, error: "Нет доступа" };

    const agents = await db
      .select({
        id: referralAgents.id,
        fullName: referralAgents.fullName,
        phone: referralAgents.phone,
        city: referralAgents.city,
        referralCode: referralAgents.referralCode,
        status: referralAgents.status,
      })
      .from(referralAgents)
      .orderBy(asc(referralAgents.fullName));

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const enriched = await Promise.all(
      agents.map(async (agent) => {
        // Lead counts by status
        const leadCounts = await db
          .select({ status: leads.status, count: count() })
          .from(leads)
          .where(eq(leads.agentId, agent.id))
          .groupBy(leads.status);

        const statusMap: Record<string, number> = {};
        let totalLeads = 0;
        for (const lc of leadCounts) {
          statusMap[lc.status] = lc.count;
          totalLeads += lc.count;
        }

        // Calls today
        const [callsTodayResult] = await db
          .select({ count: count() })
          .from(leadActivities)
          .where(
            and(
              eq(leadActivities.agentId, agent.id),
              gte(leadActivities.createdAt, startOfDay),
              inArray(leadActivities.type, [
                "call_attempt",
                "call_connected",
                "status_change",
              ])
            )
          );

        // Conversions this month
        const [conversionsResult] = await db
          .select({ count: count() })
          .from(leads)
          .where(
            and(
              eq(leads.agentId, agent.id),
              eq(leads.status, "converted"),
              gte(leads.convertedAt, startOfMonth)
            )
          );

        // Last activity
        const [lastActivity] = await db
          .select({ createdAt: leadActivities.createdAt })
          .from(leadActivities)
          .where(eq(leadActivities.agentId, agent.id))
          .orderBy(desc(leadActivities.createdAt))
          .limit(1);

        // Assignments
        const assignments = await db
          .select({
            city: { name: cities.name },
            niche: { name: businessNiches.name },
          })
          .from(agentAssignments)
          .leftJoin(cities, eq(agentAssignments.cityId, cities.id))
          .leftJoin(
            businessNiches,
            eq(agentAssignments.nicheId, businessNiches.id)
          )
          .where(eq(agentAssignments.agentId, agent.id));

        return {
          ...agent,
          totalLeads,
          statusMap,
          callsToday: callsTodayResult?.count ?? 0,
          conversionsThisMonth: conversionsResult?.count ?? 0,
          lastActiveAt: lastActivity?.createdAt ?? null,
          assignments,
        };
      })
    );

    return { success: true as const, data: enriched };
  } catch (error: unknown) {
    console.error("getAgentsOverviewAction error:", error);
    return { success: false as const, error: "Ошибка загрузки агентов" };
  }
}

// ─── Agent Drilldown ──────────────────────────────────────────────────────────

export async function getAgentDrilldownAction(agentId: string) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return { success: false as const, error: "Нет доступа" };

    const agentLeads = await db
      .select({
        id: leads.id,
        status: leads.status,
        priority: leads.priority,
        callAttempts: leads.callAttempts,
        nextCallbackAt: leads.nextCallbackAt,
        lastContactedAt: leads.lastContactedAt,
        updatedAt: leads.updatedAt,
        business: {
          name: crmBusinesses.name,
          phone: crmBusinesses.phone,
        },
        city: { name: cities.name },
        niche: { name: businessNiches.name, icon: businessNiches.icon },
      })
      .from(leads)
      .innerJoin(crmBusinesses, eq(leads.businessId, crmBusinesses.id))
      .leftJoin(cities, eq(crmBusinesses.cityId, cities.id))
      .leftJoin(businessNiches, eq(crmBusinesses.nicheId, businessNiches.id))
      .where(eq(leads.agentId, agentId))
      .orderBy(asc(leads.priority), desc(leads.updatedAt));

    const recentActivity = await db
      .select({
        id: leadActivities.id,
        type: leadActivities.type,
        note: leadActivities.note,
        previousStatus: leadActivities.previousStatus,
        newStatus: leadActivities.newStatus,
        createdAt: leadActivities.createdAt,
        leadId: leadActivities.leadId,
      })
      .from(leadActivities)
      .where(eq(leadActivities.agentId, agentId))
      .orderBy(desc(leadActivities.createdAt))
      .limit(50);

    return { success: true as const, data: { leads: agentLeads, recentActivity } };
  } catch (error: unknown) {
    console.error("getAgentDrilldownAction error:", error);
    return { success: false as const, error: "Ошибка загрузки" };
  }
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

export async function getActivityFeedAction(filters?: {
  agentId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
}) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return { success: false as const, error: "Нет доступа" };

    const page = filters?.page ?? 1;
    const pageSize = 50;
    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (filters?.agentId)
      conditions.push(eq(leadActivities.agentId, filters.agentId));
    if (filters?.dateFrom)
      conditions.push(gte(leadActivities.createdAt, new Date(filters.dateFrom)));
    if (filters?.dateTo)
      conditions.push(lte(leadActivities.createdAt, new Date(filters.dateTo)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: leadActivities.id,
        type: leadActivities.type,
        note: leadActivities.note,
        previousStatus: leadActivities.previousStatus,
        newStatus: leadActivities.newStatus,
        createdAt: leadActivities.createdAt,
        agent: {
          id: referralAgents.id,
          fullName: referralAgents.fullName,
        },
        lead: {
          id: leads.id,
        },
        business: {
          name: crmBusinesses.name,
        },
      })
      .from(leadActivities)
      .innerJoin(referralAgents, eq(leadActivities.agentId, referralAgents.id))
      .innerJoin(leads, eq(leadActivities.leadId, leads.id))
      .innerJoin(crmBusinesses, eq(leads.businessId, crmBusinesses.id))
      .where(whereClause)
      .orderBy(desc(leadActivities.createdAt))
      .limit(pageSize)
      .offset(offset);

    return { success: true as const, data: rows };
  } catch (error: unknown) {
    console.error("getActivityFeedAction error:", error);
    return { success: false as const, error: "Ошибка загрузки активности" };
  }
}

// ─── Funnel Data ──────────────────────────────────────────────────────────────

export async function getFunnelDataAction(filters?: {
  cityId?: string;
  nicheId?: string;
  agentId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return { success: false as const, error: "Нет доступа" };

    const conditions = [];
    if (filters?.agentId) conditions.push(eq(leads.agentId, filters.agentId));
    if (filters?.dateFrom) conditions.push(gte(leads.createdAt, new Date(filters.dateFrom)));
    if (filters?.dateTo) conditions.push(lte(leads.createdAt, new Date(filters.dateTo)));

    // City and niche filters require joining crm_businesses
    // We build the query with joins
    if (filters?.cityId) conditions.push(eq(crmBusinesses.cityId, filters.cityId));
    if (filters?.nicheId) conditions.push(eq(crmBusinesses.nicheId, filters.nicheId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const funnelData = await db
      .select({
        status: leads.status,
        count: count(),
      })
      .from(leads)
      .innerJoin(crmBusinesses, eq(leads.businessId, crmBusinesses.id))
      .where(whereClause)
      .groupBy(leads.status);

    const funnel: Record<string, number> = {
      new: 0,
      no_answer: 0,
      in_progress: 0,
      trial_sent: 0,
      converted: 0,
      rejected: 0,
      invalid: 0,
    };

    let total = 0;
    for (const row of funnelData) {
      funnel[row.status] = row.count;
      total += row.count;
    }

    // Conversion rates
    const rates = {
      noAnswerRate: total > 0 ? Math.round(((funnel.no_answer + funnel.in_progress + funnel.trial_sent + funnel.converted) / total) * 100) : 0,
      inProgressRate: total > 0 ? Math.round(((funnel.in_progress + funnel.trial_sent + funnel.converted) / total) * 100) : 0,
      trialRate: total > 0 ? Math.round(((funnel.trial_sent + funnel.converted) / total) * 100) : 0,
      convertedRate: total > 0 ? Math.round((funnel.converted / total) * 100) : 0,
    };

    return { success: true as const, data: { funnel, total, rates } };
  } catch (error: unknown) {
    console.error("getFunnelDataAction error:", error);
    return { success: false as const, error: "Ошибка загрузки воронки" };
  }
}

// ─── Get Agents List (for assignment dropdowns) ───────────────────────────────

export async function getAgentsListAction() {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return { success: false as const, error: "Нет доступа" };

    const agents = await db
      .select({
        id: referralAgents.id,
        fullName: referralAgents.fullName,
        city: referralAgents.city,
        referralCode: referralAgents.referralCode,
      })
      .from(referralAgents)
      .where(eq(referralAgents.status, "active"))
      .orderBy(asc(referralAgents.fullName));

    return { success: true as const, data: agents };
  } catch (error: unknown) {
    console.error("getAgentsListAction error:", error);
    return { success: false as const, error: "Ошибка загрузки агентов" };
  }
}
