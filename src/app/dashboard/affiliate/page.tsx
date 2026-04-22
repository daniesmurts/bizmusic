import { createClient } from "@/utils/supabase/server";
import { db, resilient } from "@/db";
import {
  referralAgents, referralClicks, referralConversions,
  commissionLedger, businesses,
} from "@/db/schema";
import { and, eq, count, sum, isNotNull, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Share2 } from "lucide-react";
import { CopyLinkButton } from "./CopyLinkButton";

export const metadata = { title: "Партнёрская программа — Бизмюзик" };

function formatRubles(kopecks: number): string {
  const rubles = Math.floor(kopecks / 100);
  return rubles.toLocaleString("ru-RU") + " ₽";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "trial":
      return (
        <span className="inline-flex px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold">
          Пробный период
        </span>
      );
    case "active":
      return (
        <span className="inline-flex px-2.5 py-1 rounded-lg bg-[#5cf387]/10 border border-[#5cf387]/30 text-[#5cf387] text-xs font-bold">
          Активен
        </span>
      );
    case "churned":
    default:
      return (
        <span className="inline-flex px-2.5 py-1 rounded-lg bg-neutral-800 border border-white/10 text-neutral-500 text-xs font-bold">
          Отписался
        </span>
      );
  }
}

function getMonthLabel(periodMonth: string): string {
  const [year, month] = periodMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
}

function getPayoutStatusBadge(statuses: string[]) {
  if (statuses.every((s) => s === "paid")) {
    return (
      <span className="inline-flex px-2.5 py-1 rounded-lg bg-[#5cf387]/10 border border-[#5cf387]/30 text-[#5cf387] text-xs font-bold">
        Выплачено
      </span>
    );
  }
  if (statuses.some((s) => s === "approved")) {
    return (
      <span className="inline-flex px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
        Подтверждено
      </span>
    );
  }
  if (statuses.some((s) => s === "clawed_back")) {
    return (
      <span className="inline-flex px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
        Возврат
      </span>
    );
  }
  return (
    <span className="inline-flex px-2.5 py-1 rounded-lg bg-neutral-800 border border-white/10 text-neutral-500 text-xs font-bold">
      Ожидает
    </span>
  );
}

export default async function AffiliateDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard/affiliate");

  // resilient() resets the pool and retries once on stale-connection errors
  const agent = await resilient(() =>
    db.query.referralAgents.findFirst({
      where: eq(referralAgents.userId, user.id),
    })
  );

  if (!agent) redirect("/become-affiliate");

  const referralUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://bizmuzik.ru"}/r/${agent.referralCode}`;
  const whatsappText = encodeURIComponent(
    `Легальная музыка для бизнеса без штрафов РАО ${referralUrl}`
  );

  // Current month bounds
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  // Run all stats in parallel.
  // Wrapped in resilient() so a stale pool connection in any one query resets
  // the pool and retries the whole batch rather than blowing up the page.
  const [
    [totalClicksResult],
    [convertedClicksResult],
    [activeClientsResult],
    [monthlyCommissionResult],
    [pendingResult],
    [approvedResult],
    [paidResult],
    conversions,
    allLedger,
  ] = await resilient(() => Promise.all([
    db.select({ value: count() }).from(referralClicks)
      .where(eq(referralClicks.agentId, agent.id)),

    db.select({ value: count() }).from(referralClicks)
      .where(and(eq(referralClicks.agentId, agent.id), isNotNull(referralClicks.convertedUserId))),

    db.select({ value: count() }).from(referralConversions)
      .where(and(eq(referralConversions.agentId, agent.id), eq(referralConversions.status, "active"))),

    db.select({ value: sum(commissionLedger.commissionAmountKopecks) }).from(commissionLedger)
      .where(and(
        eq(commissionLedger.agentId, agent.id),
        eq(commissionLedger.periodMonth, currentMonthStr),
        inArray(commissionLedger.status, ["pending", "approved"])
      )),

    db.select({ value: sum(commissionLedger.commissionAmountKopecks) }).from(commissionLedger)
      .where(and(eq(commissionLedger.agentId, agent.id), eq(commissionLedger.status, "pending"))),

    db.select({ value: sum(commissionLedger.commissionAmountKopecks) }).from(commissionLedger)
      .where(and(eq(commissionLedger.agentId, agent.id), eq(commissionLedger.status, "approved"))),

    db.select({ value: sum(commissionLedger.commissionAmountKopecks) }).from(commissionLedger)
      .where(and(eq(commissionLedger.agentId, agent.id), eq(commissionLedger.status, "paid"))),

    db.query.referralConversions.findMany({
      where: eq(referralConversions.agentId, agent.id),
      with: {
        business: { columns: { legalName: true, contactPerson: true, currentPlanSlug: true } },
        commissions: {
          orderBy: (t, { desc }) => [desc(t.createdAt)],
          limit: 1,
          columns: { commissionAmountKopecks: true },
        },
      },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    }),

    db.query.commissionLedger.findMany({
      where: eq(commissionLedger.agentId, agent.id),
      columns: { periodMonth: true, commissionAmountKopecks: true, status: true },
      orderBy: (t, { desc }) => [desc(t.periodMonth)],
    }),
  ]));

  // Group by month
  const monthlyMap = new Map<string, { total: number; count: number; statuses: string[] }>();
  for (const entry of allLedger) {
    const existing = monthlyMap.get(entry.periodMonth) ?? { total: 0, count: 0, statuses: [] };
    existing.total += entry.commissionAmountKopecks;
    existing.count += 1;
    existing.statuses.push(entry.status);
    monthlyMap.set(entry.periodMonth, existing);
  }
  const monthlyHistory = Array.from(monthlyMap.entries()).map(([month, data]) => ({ month, ...data }));

  const stats = [
    { label: "Переходы по ссылке", value: String(totalClicksResult.value ?? 0) },
    { label: "Регистрации", value: String(convertedClicksResult.value ?? 0) },
    { label: "Активных клиентов", value: String(activeClientsResult.value ?? 0) },
    {
      label: "Комиссия в этом месяце",
      value: formatRubles(Number(monthlyCommissionResult.value ?? 0)),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Партнёрская программа</h1>
        <p className="text-neutral-500 text-sm">Ваш личный кабинет партнёра</p>
      </div>

      {/* Section 1: Referral Link */}
      <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-6">
        <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">
          Ваша реферальная ссылка
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <code className="flex-1 bg-black border border-white/10 rounded-2xl px-4 py-3 text-[#5cf387] text-sm font-mono break-all">
            {referralUrl}
          </code>
          <div className="flex gap-2 flex-shrink-0">
            <CopyLinkButton url={referralUrl} />
            <a
              href={`https://wa.me/?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-bold hover:bg-green-500/20 transition"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Section 2: Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-neutral-900/60 border border-white/10 rounded-2xl p-5"
          >
            <p className="text-neutral-500 text-xs font-medium mb-2">{s.label}</p>
            <p className="text-white text-2xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Section 3: Earnings summary */}
      <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-6">
        <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-5">
          Сводка по выплатам
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Ожидает подтверждения", value: Number(pendingResult.value ?? 0), color: "text-yellow-400" },
            { label: "Подтверждено к выплате", value: Number(approvedResult.value ?? 0), color: "text-blue-400" },
            { label: "Выплачено всего", value: Number(paidResult.value ?? 0), color: "text-[#5cf387]" },
          ].map((item) => (
            <div key={item.label} className="bg-black/40 rounded-2xl p-4 border border-white/5">
              <p className="text-neutral-500 text-xs mb-1">{item.label}</p>
              <p className={`text-xl font-black ${item.color}`}>{formatRubles(item.value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Clients table */}
      <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-6">
        <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-5">
          Ваши клиенты
        </h2>
        {conversions.length === 0 ? (
          <p className="text-neutral-600 text-sm text-center py-8">Пока нет привлечённых клиентов</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-white/10">
                  {["Клиент", "Тариф", "Дата подключения", "Статус", "Ежемес. комиссия"].map((h) => (
                    <th key={h} className="pb-3 pr-4 text-xs font-black uppercase tracking-widest text-neutral-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {conversions.map((c) => {
                  const name = c.business?.contactPerson || c.business?.legalName || "—";
                  const parts = name.split(" ");
                  const displayName =
                    parts.length >= 2
                      ? `${parts[0]} ${parts[1]?.charAt(0)}.`
                      : name;
                  const latestCommission = c.commissions[0]?.commissionAmountKopecks ?? 0;

                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 pr-4 text-white font-medium">{displayName}</td>
                      <td className="py-3 pr-4 text-neutral-400">{c.business?.currentPlanSlug || "—"}</td>
                      <td className="py-3 pr-4 text-neutral-400">
                        {c.firstPaymentAt
                          ? new Date(c.firstPaymentAt).toLocaleDateString("ru-RU")
                          : "—"}
                      </td>
                      <td className="py-3 pr-4">{getStatusBadge(c.status)}</td>
                      <td className="py-3 text-[#5cf387] font-bold">{formatRubles(latestCommission)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 5: Monthly history */}
      <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-6">
        <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-5">
          История по месяцам
        </h2>
        {monthlyHistory.length === 0 ? (
          <p className="text-neutral-600 text-sm text-center py-8">Нет данных</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-white/10">
                  {["Месяц", "Клиентов", "Начислено", "Статус выплаты"].map((h) => (
                    <th key={h} className="pb-3 pr-4 text-xs font-black uppercase tracking-widest text-neutral-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {monthlyHistory.map((row) => (
                  <tr key={row.month} className="hover:bg-white/[0.02] transition">
                    <td className="py-3 pr-4 text-white font-medium capitalize">{getMonthLabel(row.month)}</td>
                    <td className="py-3 pr-4 text-neutral-400">{row.count}</td>
                    <td className="py-3 pr-4 text-[#5cf387] font-bold">{formatRubles(row.total)}</td>
                    <td className="py-3">{getPayoutStatusBadge(row.statuses)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
