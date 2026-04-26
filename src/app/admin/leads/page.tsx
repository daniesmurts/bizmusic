"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCrmBusinessesAction, addCrmBusinessAction, bulkAssignLeadsAction,
  getAgentsOverviewAction, getActivityFeedAction, getFunnelDataAction,
  getAgentsListAction, importCsvPreviewAction, importCsvConfirmAction,
} from "@/lib/actions/crm-admin";
import { getCrmLookupsAction } from "@/lib/actions/crm-leads";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Database, Users, Activity, TrendingUp, Plus, Upload, UserPlus,
  Phone, Check, Search, Filter, X, ChevronRight,
} from "lucide-react";

const TABS = [
  { key: "database", label: "Бизнес-база", icon: Database },
  { key: "agents", label: "Агенты", icon: Users },
  { key: "activity", label: "Активность", icon: Activity },
  { key: "funnel", label: "Воронка", icon: TrendingUp },
] as const;

const STATUS_LABELS: Record<string, string> = {
  new: "Новые", no_answer: "Нет ответа", in_progress: "В работе",
  trial_sent: "Пробный", converted: "Оплата", rejected: "Отказ", invalid: "Невалид",
};

export default function AdminLeadsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("database");
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [nicheFilter, setNicheFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState<boolean | undefined>();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvPreview, setCsvPreview] = useState<{ totalRows: number; matchedCities: number; unmatchedCities: string[]; matchedNiches: number; unmatchedNiches: string[] } | null>(null);
  const [newBiz, setNewBiz] = useState({ name: "", phone: "", address: "", cityId: "", nicheId: "" });
  const [assignAgentId, setAssignAgentId] = useState("");

  const { data: lookups } = useQuery({ queryKey: ["crm-lookups"], queryFn: () => getCrmLookupsAction() });
  const citiesList = lookups?.success ? lookups.data.cities : [];
  const nichesList = lookups?.success ? lookups.data.niches : [];

  // --- Database Tab ---
  const { data: bizRes, isLoading: bizLoading } = useQuery({
    queryKey: ["crm-businesses", search, cityFilter, nicheFilter, assignedFilter],
    queryFn: () => getCrmBusinessesAction({ search: search || undefined, cityId: cityFilter || undefined, nicheId: nicheFilter || undefined, assigned: assignedFilter }),
    enabled: tab === "database",
  });

  const addBizMut = useMutation({
    mutationFn: () => addCrmBusinessAction(newBiz),
    onSuccess: (r) => { if (r.success) { toast.success("Бизнес добавлен"); setShowAddForm(false); setNewBiz({ name: "", phone: "", address: "", cityId: "", nicheId: "" }); qc.invalidateQueries({ queryKey: ["crm-businesses"] }); } else toast.error(r.error); },
  });

  const assignMut = useMutation({
    mutationFn: () => bulkAssignLeadsAction(Array.from(selected), assignAgentId),
    onSuccess: (r) => { if (r.success) { toast.success(`Назначено ${r.data.created} лидов`); setSelected(new Set()); setShowAssignModal(false); qc.invalidateQueries({ queryKey: ["crm-businesses"] }); } else toast.error(r.error); },
  });

  const csvPreviewMut = useMutation({
    mutationFn: () => importCsvPreviewAction(csvText),
    onSuccess: (r) => { if (r.success) setCsvPreview(r.data); else toast.error(r.error); },
  });

  const csvConfirmMut = useMutation({
    mutationFn: () => importCsvConfirmAction(csvText),
    onSuccess: (r) => { if (r.success) { toast.success(`Импортировано ${r.data.inserted} записей`); setShowCsvModal(false); setCsvText(""); setCsvPreview(null); qc.invalidateQueries({ queryKey: ["crm-businesses"] }); } else toast.error(r.error); },
  });

  // --- Agents Tab ---
  const { data: agentsRes, isLoading: agentsLoading } = useQuery({
    queryKey: ["crm-agents-overview"],
    queryFn: () => getAgentsOverviewAction(),
    enabled: tab === "agents",
  });

  const { data: agentsListRes } = useQuery({
    queryKey: ["crm-agents-list"],
    queryFn: () => getAgentsListAction(),
  });
  const agentsList = agentsListRes?.success ? agentsListRes.data : [];

  // --- Activity Tab ---
  const { data: activityRes, isLoading: activityLoading } = useQuery({
    queryKey: ["crm-activity-feed"],
    queryFn: () => getActivityFeedAction(),
    enabled: tab === "activity",
  });

  // --- Funnel Tab ---
  const { data: funnelRes, isLoading: funnelLoading } = useQuery({
    queryKey: ["crm-funnel"],
    queryFn: () => getFunnelDataAction(),
    enabled: tab === "funnel",
  });

  const businesses = bizRes?.success ? bizRes.data : [];
  const agents = agentsRes?.success ? agentsRes.data : [];
  const activities = activityRes?.success ? activityRes.data : [];
  const funnel = funnelRes?.success ? funnelRes.data : null;

  const toggleSelect = (id: string) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">CRM <span className="text-neon">Лиды</span></h1>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Управление продажами</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border whitespace-nowrap transition-all",
              tab === t.key ? "bg-neon/10 text-neon border-neon/20" : "bg-white/5 text-neutral-400 border-transparent hover:bg-white/10")}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* DATABASE TAB */}
      {tab === "database" && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neon" />
            </div>
            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-bold uppercase tracking-widest appearance-none focus:outline-none focus:border-neon">
              <option value="">Все города</option>
              {citiesList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={nicheFilter} onChange={(e) => setNicheFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-bold uppercase tracking-widest appearance-none focus:outline-none focus:border-neon">
              <option value="">Все ниши</option>
              {nichesList.map((n) => <option key={n.id} value={n.id}>{n.icon} {n.name}</option>)}
            </select>
            <Button onClick={() => setShowAddForm(true)} className="bg-neon text-black rounded-xl text-xs font-black uppercase tracking-widest gap-2"><Plus className="w-4 h-4" /> Добавить</Button>
            <Button onClick={() => setShowCsvModal(true)} className="bg-white/5 border border-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest gap-2 hover:bg-white/10"><Upload className="w-4 h-4" /> CSV</Button>
            {selected.size > 0 && (
              <Button onClick={() => setShowAssignModal(true)} className="bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-widest gap-2">
                <UserPlus className="w-4 h-4" /> Назначить ({selected.size})
              </Button>
            )}
          </div>

          {bizLoading ? <Skeleton className="h-96 bg-white/5 rounded-2xl" /> : (
            <div className="glass-dark border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                    <th className="p-4 text-left w-10"><input type="checkbox" className="accent-neon" onChange={(e) => { if (e.target.checked) setSelected(new Set(businesses.map((b) => b.id))); else setSelected(new Set()); }} /></th>
                    <th className="p-4 text-left">Название</th><th className="p-4 text-left">Город</th><th className="p-4 text-left">Ниша</th><th className="p-4 text-left">Телефон</th><th className="p-4 text-left">Статус</th>
                  </tr></thead>
                  <tbody>
                    {businesses.map((b) => (
                      <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4"><input type="checkbox" checked={selected.has(b.id)} onChange={() => toggleSelect(b.id)} className="accent-neon" disabled={b.isAssigned} /></td>
                        <td className="p-4 font-bold text-white">{b.name}</td>
                        <td className="p-4 text-neutral-400">{b.city?.name || "—"}</td>
                        <td className="p-4 text-neutral-400">{b.niche?.icon} {b.niche?.name || "—"}</td>
                        <td className="p-4 text-neutral-400">{b.phone || "—"}</td>
                        <td className="p-4">{b.isAssigned ? <span className="text-neon text-[10px] font-black uppercase">Назначен</span> : <span className="text-neutral-500 text-[10px] font-black uppercase">Свободен</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {businesses.length === 0 && <div className="p-12 text-center text-neutral-500">Нет бизнесов. Добавьте или импортируйте CSV.</div>}
            </div>
          )}

          {/* Add Business Modal */}
          {showAddForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
              <div className="relative z-10 w-full max-w-md bg-[#0d0f1a] border border-white/10 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between"><h3 className="text-lg font-black uppercase tracking-tight text-white">Новый бизнес</h3><button onClick={() => setShowAddForm(false)} className="text-neutral-400 hover:text-white"><X className="w-5 h-5" /></button></div>
                <input value={newBiz.name} onChange={(e) => setNewBiz({ ...newBiz, name: e.target.value })} placeholder="Название *" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neon" />
                <input value={newBiz.phone} onChange={(e) => setNewBiz({ ...newBiz, phone: e.target.value })} placeholder="Телефон" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neon" />
                <input value={newBiz.address} onChange={(e) => setNewBiz({ ...newBiz, address: e.target.value })} placeholder="Адрес" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neon" />
                <select value={newBiz.cityId} onChange={(e) => setNewBiz({ ...newBiz, cityId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-neon"><option value="">Город</option>{citiesList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <select value={newBiz.nicheId} onChange={(e) => setNewBiz({ ...newBiz, nicheId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-neon"><option value="">Ниша</option>{nichesList.map((n) => <option key={n.id} value={n.id}>{n.icon} {n.name}</option>)}</select>
                <Button onClick={() => addBizMut.mutate()} disabled={!newBiz.name || addBizMut.isPending} className="w-full bg-neon text-black rounded-xl font-black uppercase text-xs tracking-widest h-11">Добавить</Button>
              </div>
            </div>
          )}

          {/* Assign Modal */}
          {showAssignModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAssignModal(false)} />
              <div className="relative z-10 w-full max-w-sm bg-[#0d0f1a] border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">Назначить {selected.size} лидов</h3>
                <select value={assignAgentId} onChange={(e) => setAssignAgentId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-neon"><option value="">Выберите агента</option>{agentsList.map((a) => <option key={a.id} value={a.id}>{a.fullName || a.referralCode}</option>)}</select>
                <div className="flex gap-3"><Button onClick={() => setShowAssignModal(false)} className="flex-1 bg-white/5 text-white rounded-xl font-black uppercase text-xs">Отмена</Button><Button onClick={() => assignMut.mutate()} disabled={!assignAgentId || assignMut.isPending} className="flex-1 bg-neon text-black rounded-xl font-black uppercase text-xs">Назначить</Button></div>
              </div>
            </div>
          )}

          {/* CSV Modal */}
          {showCsvModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center"><div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setShowCsvModal(false); setCsvPreview(null); setCsvText(""); }} />
              <div className="relative z-10 w-full max-w-lg bg-[#0d0f1a] border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">Импорт CSV</h3>
                <p className="text-xs text-neutral-500">Колонки: name, phone, address, city, niche (до 5 000 строк)</p>
                <textarea value={csvText} onChange={(e) => { setCsvText(e.target.value); setCsvPreview(null); }} rows={6} placeholder="Вставьте CSV или загрузите файл..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-neon font-mono" />
                <label className="block"><input type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => { setCsvText(ev.target?.result as string); setCsvPreview(null); }; r.readAsText(f); } }} /><span className="text-neon text-xs font-black uppercase tracking-widest cursor-pointer hover:underline">📎 Загрузить файл</span></label>
                {csvPreview && (
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-xs space-y-1">
                    <p className="text-white font-bold">{csvPreview.totalRows} строк</p>
                    <p className="text-neon">Города совпали: {csvPreview.matchedCities}</p>
                    {csvPreview.unmatchedCities.length > 0 && <p className="text-yellow-400">Не найдены: {csvPreview.unmatchedCities.join(", ")}</p>}
                    <p className="text-neon">Ниши совпали: {csvPreview.matchedNiches}</p>
                    {csvPreview.unmatchedNiches.length > 0 && <p className="text-yellow-400">Не найдены: {csvPreview.unmatchedNiches.join(", ")}</p>}
                  </div>
                )}
                <div className="flex gap-3">
                  {!csvPreview ? (
                    <Button onClick={() => csvPreviewMut.mutate()} disabled={!csvText || csvPreviewMut.isPending} className="flex-1 bg-white/10 text-white rounded-xl font-black uppercase text-xs">Предпросмотр</Button>
                  ) : (
                    <Button onClick={() => csvConfirmMut.mutate()} disabled={csvConfirmMut.isPending} className="flex-1 bg-neon text-black rounded-xl font-black uppercase text-xs">Импортировать {csvPreview.totalRows} записей</Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AGENTS TAB */}
      {tab === "agents" && (
        <div className="space-y-4">
          {agentsLoading ? <Skeleton className="h-96 bg-white/5 rounded-2xl" /> : agents.length === 0 ? (
            <div className="glass-dark border border-white/10 p-12 rounded-2xl text-center text-neutral-500">Нет зарегистрированных агентов</div>
          ) : (
            <div className="glass-dark border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  <th className="p-4 text-left">Агент</th><th className="p-4 text-left">Лиды</th><th className="p-4 text-left">Сегодня</th><th className="p-4 text-left">В работе</th><th className="p-4 text-left">Конверсии</th><th className="p-4 text-left">Посл. акт.</th>
                </tr></thead>
                <tbody>{agents.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4"><div className="font-bold text-white">{a.fullName || "—"}</div><div className="text-[10px] text-neutral-500">{a.city || ""}</div></td>
                    <td className="p-4 text-white font-bold">{a.totalLeads}</td>
                    <td className="p-4 text-neon font-bold">{a.callsToday}</td>
                    <td className="p-4 text-purple-400 font-bold">{a.statusMap["in_progress"] || 0}</td>
                    <td className="p-4 text-emerald-400 font-bold">{a.conversionsThisMonth}</td>
                    <td className="p-4 text-neutral-500 text-xs">{a.lastActiveAt ? new Date(a.lastActiveAt).toLocaleDateString("ru-RU") : "—"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ACTIVITY TAB */}
      {tab === "activity" && (
        <div className="space-y-3">
          {activityLoading ? [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 bg-white/5 rounded-xl" />) : activities.length === 0 ? (
            <div className="glass-dark border border-white/10 p-12 rounded-2xl text-center text-neutral-500">Нет активности</div>
          ) : activities.map((a) => (
            <div key={a.id} className="glass-dark border border-white/5 rounded-xl p-4 flex items-center gap-4">
              <div className="text-neutral-600 text-[10px] font-mono w-12 shrink-0">{new Date(a.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</div>
              <div className="flex-1 min-w-0">
                <span className="text-neon text-xs font-bold">{a.agent.fullName || "Агент"}</span>
                {a.type === "status_change" && <span className="text-neutral-400 text-xs"> → {a.business.name} <span className="text-white">{STATUS_LABELS[a.newStatus ?? ""] || a.newStatus}</span></span>}
                {a.type === "note" && <span className="text-neutral-400 text-xs"> 📝 {a.business.name}: {a.note}</span>}
                {a.type === "callback_scheduled" && <span className="text-neutral-400 text-xs"> 📅 {a.business.name}</span>}
                {(a.type === "converted" || a.type === "trial_sent") && <span className="text-neutral-400 text-xs"> 🚀 {a.business.name}</span>}
              </div>
              <div className="text-neutral-600 text-[10px]">{new Date(a.createdAt).toLocaleDateString("ru-RU")}</div>
            </div>
          ))}
        </div>
      )}

      {/* FUNNEL TAB */}
      {tab === "funnel" && (
        <div className="space-y-6">
          {funnelLoading ? <Skeleton className="h-64 bg-white/5 rounded-2xl" /> : funnel ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-dark border border-white/10 p-5 rounded-2xl text-center"><div className="text-3xl font-black text-white">{funnel.total}</div><div className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Всего лидов</div></div>
                <div className="glass-dark border border-white/10 p-5 rounded-2xl text-center"><div className="text-3xl font-black text-neon">{funnel.rates.convertedRate}%</div><div className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Конверсия</div></div>
                <div className="glass-dark border border-white/10 p-5 rounded-2xl text-center"><div className="text-3xl font-black text-purple-400">{funnel.rates.trialRate}%</div><div className="text-[9px] font-black uppercase tracking-widest text-neutral-500">До пробного</div></div>
                <div className="glass-dark border border-white/10 p-5 rounded-2xl text-center"><div className="text-3xl font-black text-yellow-400">{funnel.rates.inProgressRate}%</div><div className="text-[9px] font-black uppercase tracking-widest text-neutral-500">В работу</div></div>
              </div>
              <div className="glass-dark border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-black uppercase tracking-tighter text-white">Воронка</h3>
                {["new", "no_answer", "in_progress", "trial_sent", "converted"].map((s) => {
                  const val = funnel.funnel[s] ?? 0;
                  const maxV = Math.max(...Object.values(funnel.funnel), 1);
                  return (
                    <div key={s} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest"><span className="text-neutral-400">{STATUS_LABELS[s]}</span><span className="text-white">{val}</span></div>
                      <div className="h-4 bg-white/5 rounded-full overflow-hidden"><div className={cn("h-full rounded-full", s === "converted" ? "bg-gradient-to-r from-neon to-emerald-400" : "bg-neon/40")} style={{ width: `${(val / maxV) * 100}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : <div className="glass-dark border border-white/10 p-12 rounded-2xl text-center text-neutral-500">Нет данных</div>}
        </div>
      )}
    </div>
  );
}
