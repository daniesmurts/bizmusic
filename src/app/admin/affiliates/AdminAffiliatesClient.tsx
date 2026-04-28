"use client";

import { useState, useTransition } from "react";
import {
  updateAgentStatusAction,
  updateAgentCommissionAction,
  markCommissionsPaidAction,
  runApproveCommissionsAction,
  updateAgentAliasAction,
} from "./actions";

interface Agent {
  id: string;
  fullName: string | null;
  email: string;
  referralCode: string;
  city: string | null;
  status: string;
  emailAlias: string | null;
  commissionRate: number;
  clientCount: number;
  pendingKopecks: number;
  approvedKopecks: number;
  paidKopecks: number;
}

interface LedgerRow {
  id: string;
  agentName: string | null;
  agentEmail: string;
  clientName: string;
  planSlug: string | null;
  periodMonth: string;
  subscriptionAmountKopecks: number;
  commissionAmountKopecks: number;
  status: string;
}

interface Props {
  agents: Agent[];
  ledger: LedgerRow[];
  overview: {
    totalAgents: number;
    activeAgents: number;
    pausedAgents: number;
    suspendedAgents: number;
    monthlyPendingKopecks: number;
    monthlyApprovedKopecks: number;
    monthlyPaidKopecks: number;
  };
}

function fmt(kopecks: number) {
  return Math.floor(kopecks / 100).toLocaleString("ru-RU") + " ₽";
}

function getMonthLabel(periodMonth: string): string {
  const [year, month] = periodMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "Активен", cls: "bg-[#5cf387]/10 border-[#5cf387]/30 text-[#5cf387]" },
    paused: { label: "Пауза", cls: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" },
    suspended: { label: "Заблокирован", cls: "bg-red-500/10 border-red-500/30 text-red-400" },
    pending: { label: "Ожидает", cls: "bg-neutral-800 border-white/10 text-neutral-500" },
    approved: { label: "Подтверждено", cls: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
    paid: { label: "Выплачено", cls: "bg-[#5cf387]/10 border-[#5cf387]/30 text-[#5cf387]" },
    clawed_back: { label: "Возврат", cls: "bg-red-500/10 border-red-500/30 text-red-400" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-neutral-800 border-white/10 text-neutral-500" };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-lg border text-xs font-bold ${cls}`}>{label}</span>
  );
}

function AgentRow({ agent }: { agent: Agent }) {
  const [isPending, startTransition] = useTransition();
  const [rate, setRate] = useState(String(Math.round(agent.commissionRate * 100)));
  const [alias, setAlias] = useState(agent.emailAlias || "");

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition">
      <td className="py-3 pr-3 text-white font-medium">{agent.fullName || "—"}</td>
      <td className="py-3 pr-3 text-neutral-400 text-xs">{agent.email}</td>
      <td className="py-3 pr-3 font-mono text-[#5cf387] text-xs">{agent.referralCode}</td>
      <td className="py-3 pr-3 text-neutral-400 text-xs">{agent.city || "—"}</td>
      <td className="py-3 pr-3 text-neutral-300">{agent.clientCount}</td>
      <td className="py-3 pr-3 text-yellow-400 text-sm">{fmt(agent.pendingKopecks)}</td>
      <td className="py-3 pr-3 text-blue-400 text-sm">{fmt(agent.approvedKopecks)}</td>
      <td className="py-3 pr-3 text-[#5cf387] text-sm">{fmt(agent.paidKopecks)}</td>
      <td className="py-3 pr-3">
        <StatusBadge status={agent.status} />
      </td>
      <td className="py-3 pr-3">
        <div className="flex gap-2 items-center">
          {/* Commission rate */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              min={10}
              max={50}
              className="w-14 bg-black border border-white/10 rounded-lg px-2 py-1 text-white text-xs text-center focus:outline-none focus:border-[#5cf387]/40"
            />
            <span className="text-neutral-600 text-xs">%</span>
            <button
              onClick={() =>
                startTransition(() =>
                  updateAgentCommissionAction(agent.id, Number(rate) / 100)
                )
              }
              disabled={isPending}
              className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:border-white/20 transition"
            >
              ✓
            </button>
          </div>

          {/* Status dropdown */}
          <select
            defaultValue={agent.status}
            onChange={(e) =>
              startTransition(() => updateAgentStatusAction(agent.id, e.target.value))
            }
            disabled={isPending}
            className="bg-black border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none"
          >
            <option value="active">Активен</option>
            <option value="paused">Пауза</option>
            <option value="suspended">Заблокировать</option>
          </select>

          {/* Email Alias */}
          <div className="flex items-center gap-1">
            <span className="text-neutral-600 text-[10px]">@</span>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value.toLowerCase())}
              placeholder="alias"
              className="w-20 bg-black border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-neon/40"
            />
            <button
              onClick={() =>
                startTransition(() =>
                  updateAgentAliasAction(agent.id, alias)
                )
              }
              disabled={isPending}
              className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:border-white/20 transition"
            >
              ✓
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

function CommissionsTab({ ledger }: { ledger: LedgerRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const approvedRows = ledger.filter((r) => r.status === "approved");

  const toggleAll = () => {
    if (selected.size === approvedRows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(approvedRows.map((r) => r.id)));
    }
  };

  const handleMarkPaid = () => {
    const ids = Array.from(selected);
    startTransition(async () => {
      await markCommissionsPaidAction(ids);
      setSelected(new Set());
    });
  };

  const handleExportCsv = () => {
    const rows = [
      ["Агент", "Email агента", "Клиент", "Тариф", "Месяц", "Сумма подписки (₽)", "Комиссия (₽)", "Статус"],
      ...ledger.map((r) => [
        r.agentName ?? "",
        r.agentEmail,
        r.clientName,
        r.planSlug ?? "",
        getMonthLabel(r.periodMonth),
        String(Math.floor(r.subscriptionAmountKopecks / 100)),
        String(Math.floor(r.commissionAmountKopecks / 100)),
        r.status,
      ]),
    ];
    const csv = rows.map((row) => row.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "commissions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3 justify-between items-center">
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button
              onClick={handleMarkPaid}
              disabled={isPending}
              className="px-4 py-2 rounded-xl bg-[#5cf387] text-black text-xs font-black uppercase tracking-widest hover:bg-[#5cf387]/90 transition disabled:opacity-50"
            >
              Отметить выплаченным ({selected.size})
            </button>
          )}
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-neutral-300 text-xs font-bold hover:bg-white/10 transition"
          >
            Экспорт CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="pb-3 pr-3">
                <input
                  type="checkbox"
                  checked={selected.size === approvedRows.length && approvedRows.length > 0}
                  onChange={toggleAll}
                  className="accent-[#5cf387]"
                />
              </th>
              {["Агент", "Клиент", "Тариф", "Месяц", "Сумма (₽)", "Комиссия (₽)", "Статус"].map((h) => (
                <th key={h} className="pb-3 pr-3 text-xs font-black uppercase tracking-widest text-neutral-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {ledger.map((row) => (
              <tr key={row.id} className="hover:bg-white/[0.02] transition">
                <td className="py-3 pr-3">
                  {row.status === "approved" && (
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={(e) => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(row.id);
                        else next.delete(row.id);
                        setSelected(next);
                      }}
                      className="accent-[#5cf387]"
                    />
                  )}
                </td>
                <td className="py-3 pr-3 text-white text-xs">{row.agentName || row.agentEmail}</td>
                <td className="py-3 pr-3 text-neutral-400 text-xs">{row.clientName}</td>
                <td className="py-3 pr-3 text-neutral-400 text-xs">{row.planSlug || "—"}</td>
                <td className="py-3 pr-3 text-neutral-300 text-xs capitalize">{getMonthLabel(row.periodMonth)}</td>
                <td className="py-3 pr-3 text-neutral-300 text-xs">{fmt(row.subscriptionAmountKopecks)}</td>
                <td className="py-3 pr-3 text-[#5cf387] text-xs font-bold">{fmt(row.commissionAmountKopecks)}</td>
                <td className="py-3">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
            {ledger.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-neutral-600 text-sm">
                  Нет данных
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OverviewTab({ overview }: { overview: Props["overview"] }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ approved: number } | null>(null);

  const handleApprove = () => {
    startTransition(async () => {
      const r = await runApproveCommissionsAction();
      setResult(r);
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Всего агентов", value: overview.totalAgents },
          { label: "Активных", value: overview.activeAgents },
          { label: "На паузе", value: overview.pausedAgents },
          { label: "Заблокировано", value: overview.suspendedAgents },
        ].map((s) => (
          <div key={s.label} className="bg-black/40 border border-white/5 rounded-2xl p-5">
            <p className="text-neutral-500 text-xs mb-2">{s.label}</p>
            <p className="text-white text-2xl font-black">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Ожидает (месяц)", value: overview.monthlyPendingKopecks, color: "text-yellow-400" },
          { label: "Подтверждено (месяц)", value: overview.monthlyApprovedKopecks, color: "text-blue-400" },
          { label: "Выплачено (месяц)", value: overview.monthlyPaidKopecks, color: "text-[#5cf387]" },
        ].map((s) => (
          <div key={s.label} className="bg-black/40 border border-white/5 rounded-2xl p-5">
            <p className="text-neutral-500 text-xs mb-2">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{fmt(s.value)}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleApprove}
          disabled={isPending}
          className="px-6 py-3 rounded-2xl bg-[#5cf387] text-black font-black uppercase tracking-widest text-sm hover:bg-[#5cf387]/90 transition disabled:opacity-50"
        >
          {isPending ? "Выполняется..." : "Запустить подтверждение комиссий"}
        </button>
        {result !== null && (
          <p className="text-neutral-400 text-sm">
            Подтверждено: <span className="text-[#5cf387] font-bold">{result.approved}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export function AdminAffiliatesClient({ agents, ledger, overview }: Props) {
  const [tab, setTab] = useState<"agents" | "commissions" | "overview">("agents");

  const tabs = [
    { id: "agents" as const, label: "Агенты" },
    { id: "commissions" as const, label: "Комиссии" },
    { id: "overview" as const, label: "Сводка" },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-neutral-900/60 border border-white/10 rounded-2xl p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition ${
              tab === t.id
                ? "bg-[#5cf387] text-black"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "agents" && (
        <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  {["Имя", "Email", "Код", "Город", "Клиентов", "Ожидает", "Подтверждено", "Выплачено", "Статус", "Действия"].map(
                    (h) => (
                      <th key={h} className="pb-3 pr-3 text-xs font-black uppercase tracking-widest text-neutral-500">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <AgentRow key={a.id} agent={a} />
                ))}
                {agents.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-neutral-600 text-sm">
                      Нет агентов
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "commissions" && (
        <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-6">
          <CommissionsTab ledger={ledger} />
        </div>
      )}

      {tab === "overview" && (
        <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-6">
          <OverviewTab overview={overview} />
        </div>
      )}
    </div>
  );
}
