"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAgentLeadsAction, getAgentTodayCallbacksAction } from "@/lib/actions/crm-leads";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Phone, Clock, BarChart3, ChevronRight, Bell, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { LeadDetailSheet } from "@/components/crm/LeadDetailSheet";

const TABS = [
  { key: "new", label: "Новые" },
  { key: "no_answer", label: "Без ответа" },
  { key: "in_progress", label: "В работе" },
  { key: "trial_sent", label: "Пробный период" },
  { key: "rejected", label: "Отказ" },
] as const;

const PRIORITY_ICONS: Record<number, { emoji: string; label: string }> = {
  1: { emoji: "🔴", label: "Горячий" },
  2: { emoji: "🟡", label: "Обычный" },
  3: { emoji: "🟢", label: "Низкий" },
};

function timeAgo(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} мин назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч назад`;
  const days = Math.floor(hrs / 24);
  return `${days} д назад`;
}

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState("new");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const { data: callbacksRes, isLoading: callbacksLoading } = useQuery({
    queryKey: ["agent-callbacks"],
    queryFn: () => getAgentTodayCallbacksAction(),
  });

  const { data: leadsRes, isLoading: leadsLoading } = useQuery({
    queryKey: ["agent-leads", activeTab],
    queryFn: () => getAgentLeadsAction(activeTab),
  });

  const callbacks = callbacksRes?.success ? callbacksRes.data : [];
  const leadsList = leadsRes?.success ? leadsRes.data : [];

  return (
    <div className="space-y-8 animate-fade-in relative z-0 min-h-screen pb-20">
      {/* Background */}
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] bg-neon/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-2">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter">
            Мои <span className="text-neon">лиды</span>
          </h2>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">
            Панель обзвона и воронка продаж
          </p>
        </div>
        <Link href="/dashboard/leads/stats">
          <Button className="bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-2xl px-6 py-5 font-black uppercase text-[10px] tracking-widest gap-2">
            <BarChart3 className="w-4 h-4" /> Статистика
          </Button>
        </Link>
      </div>

      {/* Daily Focus Card */}
      <div className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon/40 via-neon to-neon/40" />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-neon/10 rounded-xl flex items-center justify-center">
            <Bell className="text-neon w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">
              Звонки на сегодня
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              Запланированные обратные звонки
            </p>
          </div>
          {!callbacksLoading && callbacks.length > 0 && (
            <span className="ml-auto min-w-[28px] h-7 px-2 rounded-full bg-neon text-black text-xs font-black flex items-center justify-center">
              {callbacks.length}
            </span>
          )}
        </div>

        {callbacksLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 bg-white/5 rounded-xl" />
            ))}
          </div>
        ) : callbacks.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Sparkles className="w-8 h-8 text-neon/40 mx-auto" />
            <p className="text-neutral-400 text-sm font-medium">
              Отлично! Новых звонков нет.
            </p>
            <p className="text-neutral-500 text-xs">
              Хотите взять новые лиды? Обратитесь к администратору.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {callbacks.slice(0, 5).map((cb) => (
              <button
                key={cb.id}
                onClick={() => setSelectedLeadId(cb.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-neon/20 hover:bg-neon/5 transition-all text-left group"
              >
                <span className="text-lg">{cb.niche?.icon || "📋"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{cb.business.name}</p>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                    {cb.city?.name} · {PRIORITY_ICONS[cb.priority]?.emoji}
                  </p>
                </div>
                {cb.business.phone && (
                  <a
                    href={`https://wa.me/${cb.business.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-9 h-9 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center text-neon hover:bg-neon hover:text-black transition-colors shrink-0"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neon transition-colors shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pipeline Tabs */}
      <div className="overflow-x-auto -mx-2 px-2 scrollbar-none">
        <div className="flex gap-2 min-w-max pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                activeTab === tab.key
                  ? "bg-neon/10 text-neon border-neon/20 shadow-[0_0_15px_rgba(92,243,135,0.1)]"
                  : "bg-white/5 text-neutral-400 border-transparent hover:bg-white/10 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lead Cards */}
      <div className="space-y-3">
        {leadsLoading ? (
          [1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 bg-white/5 rounded-2xl" />
          ))
        ) : leadsList.length === 0 ? (
          <div className="glass-dark border border-white/10 p-12 rounded-[2rem] text-center space-y-4">
            <p className="text-neutral-400 font-medium">
              Нет лидов в этой категории.
            </p>
            <p className="text-neutral-500 text-xs">
              Новые лиды назначаются администратором.
            </p>
          </div>
        ) : (
          leadsList.map((lead) => (
            <button
              key={lead.id}
              onClick={() => setSelectedLeadId(lead.id)}
              className="w-full glass-dark border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:border-neon/20 hover:bg-neon/5 transition-all text-left group"
            >
              <span className="text-2xl shrink-0">{lead.niche?.icon || "📋"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-black uppercase tracking-tight text-white truncate">
                    {lead.business.name}
                  </h4>
                  {lead.unreadEmailCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shrink-0 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                  )}
                  <span className="text-xs shrink-0">{PRIORITY_ICONS[lead.priority]?.emoji}</span>
                </div>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest truncate">
                  {lead.city?.name}{lead.niche?.name ? ` · ${lead.niche.name}` : ""}
                </p>
                {lead.lastActivity && (
                  <p className="text-[10px] text-neutral-600 mt-1">
                    {lead.lastActivity.type === "note" ? "📝" : "📞"}{" "}
                    {timeAgo(lead.lastActivity.createdAt)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {lead.nextCallbackAt && (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full border border-yellow-500/20">
                    <Clock className="w-3 h-3" />
                    {new Date(lead.nextCallbackAt).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                  </div>
                )}
                {lead.business.phone && (
                  <a
                    href={`https://wa.me/${lead.business.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="w-10 h-10 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center text-neon hover:bg-neon hover:text-black transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
                <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neon transition-colors" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Lead Detail Sheet */}
      {selectedLeadId && (
        <LeadDetailSheet
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      )}
    </div>
  );
}
