"use client";

import { useQuery } from "@tanstack/react-query";
import { getAgentStatsAction } from "@/lib/actions/crm-leads";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, TrendingUp, Trophy, ArrowLeft, Target, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  new: "Новые",
  no_answer: "Без ответа",
  in_progress: "В работе",
  trial_sent: "Пробный",
  converted: "Оплата",
  rejected: "Отказ",
  invalid: "Невалид",
};

const FUNNEL_ORDER = ["new", "no_answer", "in_progress", "trial_sent", "converted"];

export default function LeadStatsPage() {
  const { data: res, isLoading } = useQuery({
    queryKey: ["agent-stats"],
    queryFn: () => getAgentStatsAction(),
  });

  const stats = res?.success ? res.data : null;

  return (
    <div className="space-y-8 animate-fade-in relative z-0 min-h-screen pb-20">
      <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex items-center gap-4 px-2">
        <Link href="/dashboard/leads">
          <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter">
            Моя <span className="text-neon">статистика</span>
          </h2>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">
            Результаты и эффективность
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 bg-white/5 rounded-[2rem]" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Call Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Сегодня", value: stats.callsToday, icon: Phone },
              { label: "За неделю", value: stats.callsThisWeek, icon: Zap },
              { label: "За месяц", value: stats.callsThisMonth, icon: Target },
            ].map((s) => (
              <div key={s.label} className="glass-dark border border-white/10 p-5 rounded-[2rem] space-y-3 text-center">
                <div className="w-10 h-10 bg-neon/10 rounded-xl flex items-center justify-center mx-auto">
                  <s.icon className="text-neon w-5 h-5" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white">{s.value}</div>
                <div className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-dark border border-white/10 p-5 rounded-[2rem] text-center space-y-2">
              <div className="text-3xl font-black text-neon">{stats.conversionRate}%</div>
              <div className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Конверсия</div>
            </div>
            <div className="glass-dark border border-white/10 p-5 rounded-[2rem] text-center space-y-2">
              <div className="text-3xl font-black text-white">{stats.avgCallAttempts}</div>
              <div className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Звонков до продажи</div>
            </div>
            <div className="glass-dark border border-white/10 p-5 rounded-[2rem] text-center space-y-2">
              <div className="text-3xl font-black text-emerald-400">
                {Math.floor(stats.totalCommissionKopecks / 100).toLocaleString("ru-RU")} ₽
              </div>
              <div className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">Комиссия</div>
            </div>
            <div className="glass-dark border border-white/10 p-5 rounded-[2rem] text-center space-y-2 relative overflow-hidden">
              <Trophy className="w-6 h-6 text-yellow-500 mx-auto" />
              <div className="text-3xl font-black text-white">#{stats.leaderboardRank}</div>
              <div className="text-neutral-500 font-bold uppercase tracking-widest text-[9px]">
                из {stats.totalAgents} агентов
              </div>
            </div>
          </div>

          {/* Pipeline Funnel */}
          <div className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-black uppercase tracking-tighter text-white">
              Воронка <span className="text-neon">продаж</span>
            </h3>
            <div className="space-y-3">
              {FUNNEL_ORDER.map((status, i) => {
                const value = stats.pipeline[status] ?? 0;
                const maxVal = Math.max(...FUNNEL_ORDER.map((s) => stats.pipeline[s] ?? 0), 1);
                const pct = Math.round((value / maxVal) * 100);
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-neutral-400">{STATUS_LABELS[status]}</span>
                      <span className="text-white">{value}</span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          status === "converted"
                            ? "bg-gradient-to-r from-neon to-emerald-400"
                            : "bg-gradient-to-r from-neon/60 to-neon/30"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="glass-dark border border-white/10 p-12 rounded-[2rem] text-center">
          <p className="text-neutral-400">Не удалось загрузить статистику</p>
        </div>
      )}
    </div>
  );
}
