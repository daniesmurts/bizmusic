"use server";

import { db } from "@/db";
import { referralAgents, commissionLedger, users } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const userRow = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { role: true },
  });
  if (userRow?.role !== "ADMIN") throw new Error("Forbidden");
}

export async function updateAgentStatusAction(agentId: string, status: string) {
  await requireAdmin();
  const allowed = ["active", "paused", "suspended"];
  if (!allowed.includes(status)) throw new Error("Invalid status");

  await db.update(referralAgents)
    .set({ status, updatedAt: new Date() })
    .where(eq(referralAgents.id, agentId));

  revalidatePath("/admin/affiliates");
}

export async function updateAgentCommissionAction(agentId: string, rate: number) {
  await requireAdmin();
  const clamped = Math.max(0.1, Math.min(0.5, rate));

  await db.update(referralAgents)
    .set({ commissionRate: clamped, updatedAt: new Date() })
    .where(eq(referralAgents.id, agentId));

  revalidatePath("/admin/affiliates");
}

export async function markCommissionsPaidAction(ledgerIds: string[]) {
  await requireAdmin();
  if (ledgerIds.length === 0) return;

  await db.update(commissionLedger)
    .set({ status: "paid", paidAt: new Date() })
    .where(and(
      inArray(commissionLedger.id, ledgerIds),
      eq(commissionLedger.status, "approved")
    ));

  revalidatePath("/admin/affiliates");
}

export async function runApproveCommissionsAction() {
  await requireAdmin();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || "https://bizmuzik.ru"}/api/cron/approve-commissions`,
    { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } }
  );
  const json = await res.json();
  revalidatePath("/admin/affiliates");
  return json as { approved: number };
}
