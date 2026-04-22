import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import {
  referralAgents, referralConversions, commissionLedger, users, businesses,
} from "@/db/schema";
import { and, count, eq, inArray, sum } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AdminAffiliatesClient } from "./AdminAffiliatesClient";

export const metadata = { title: "Партнёры — Администрирование" };

export default async function AdminAffiliatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const userRow = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { role: true },
  });
  if (userRow?.role !== "ADMIN") notFound();

  // Fetch all agents with aggregated stats
  const allAgents = await db.query.referralAgents.findMany({
    with: { user: { columns: { email: true } } },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  const agentIds = allAgents.map((a) => a.id);

  // Client counts per agent
  const clientCounts =
    agentIds.length > 0
      ? await db
          .select({ agentId: referralConversions.agentId, value: count() })
          .from(referralConversions)
          .where(inArray(referralConversions.agentId, agentIds))
          .groupBy(referralConversions.agentId)
      : [];

  // Commission sums per agent per status
  const commissionSums =
    agentIds.length > 0
      ? await db
          .select({
            agentId: commissionLedger.agentId,
            status: commissionLedger.status,
            total: sum(commissionLedger.commissionAmountKopecks),
          })
          .from(commissionLedger)
          .where(inArray(commissionLedger.agentId, agentIds))
          .groupBy(commissionLedger.agentId, commissionLedger.status)
      : [];

  const agents = allAgents.map((a) => {
    const cc = clientCounts.find((c) => c.agentId === a.id);
    const pending = commissionSums.find((s) => s.agentId === a.id && s.status === "pending");
    const approved = commissionSums.find((s) => s.agentId === a.id && s.status === "approved");
    const paid = commissionSums.find((s) => s.agentId === a.id && s.status === "paid");

    return {
      id: a.id,
      fullName: a.fullName,
      email: a.user.email,
      referralCode: a.referralCode,
      city: a.city,
      status: a.status,
      commissionRate: a.commissionRate,
      clientCount: Number(cc?.value ?? 0),
      pendingKopecks: Number(pending?.total ?? 0),
      approvedKopecks: Number(approved?.total ?? 0),
      paidKopecks: Number(paid?.total ?? 0),
    };
  });

  // Ledger rows joined with agent user + referred business
  const ledgerRows = await db.query.commissionLedger.findMany({
    with: {
      agent: {
        columns: { fullName: true },
        with: { user: { columns: { email: true } } },
      },
      conversion: {
        columns: {},
        with: {
          business: { columns: { legalName: true, contactPerson: true, currentPlanSlug: true } },
        },
      },
    },
    orderBy: (t, { desc }) => [desc(t.periodMonth), desc(t.createdAt)],
  });

  const ledger = ledgerRows.map((r) => {
    const clientRaw =
      r.conversion.business?.contactPerson ||
      r.conversion.business?.legalName ||
      "Неизвестный";
    return {
      id: r.id,
      agentName: r.agent.fullName,
      agentEmail: r.agent.user.email,
      clientName: clientRaw,
      planSlug: r.conversion.business?.currentPlanSlug ?? null,
      periodMonth: r.periodMonth,
      subscriptionAmountKopecks: r.subscriptionAmountKopecks,
      commissionAmountKopecks: r.commissionAmountKopecks,
      status: r.status,
    };
  });

  // Overview stats
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [monthlyPending] = await db
    .select({ value: sum(commissionLedger.commissionAmountKopecks) })
    .from(commissionLedger)
    .where(and(eq(commissionLedger.periodMonth, currentMonthStr), eq(commissionLedger.status, "pending")));

  const [monthlyApproved] = await db
    .select({ value: sum(commissionLedger.commissionAmountKopecks) })
    .from(commissionLedger)
    .where(and(eq(commissionLedger.periodMonth, currentMonthStr), eq(commissionLedger.status, "approved")));

  const [monthlyPaid] = await db
    .select({ value: sum(commissionLedger.commissionAmountKopecks) })
    .from(commissionLedger)
    .where(and(eq(commissionLedger.periodMonth, currentMonthStr), eq(commissionLedger.status, "paid")));

  const overview = {
    totalAgents: allAgents.length,
    activeAgents: allAgents.filter((a) => a.status === "active").length,
    pausedAgents: allAgents.filter((a) => a.status === "paused").length,
    suspendedAgents: allAgents.filter((a) => a.status === "suspended").length,
    monthlyPendingKopecks: Number(monthlyPending.value ?? 0),
    monthlyApprovedKopecks: Number(monthlyApproved.value ?? 0),
    monthlyPaidKopecks: Number(monthlyPaid.value ?? 0),
  };

  return (
    <div className="p-6 lg:p-12 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Партнёрская программа</h1>
        <p className="text-neutral-500 text-sm">Управление агентами и комиссиями</p>
      </div>

      <AdminAffiliatesClient agents={agents} ledger={ledger} overview={overview} />
    </div>
  );
}
