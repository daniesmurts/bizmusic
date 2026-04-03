"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getAnnouncementAnalyticsAction,
  type AnnouncementAnalyticsPeriod,
  type AnnouncementAnalyticsData,
} from "@/lib/actions/announcement-analytics";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  BarChart3,
  Play,
  SkipForward,
  Clock,
  TrendingDown,
  Volume2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS: { id: AnnouncementAnalyticsPeriod; label: string }[] = [
  { id: "7d", label: "7 дней" },
  { id: "30d", label: "30 дней" },
  { id: "90d", label: "90 дней" },
];

function skipRateColor(rate: number): string {
  if (rate < 20) return "text-emerald-400";
  if (rate < 50) return "text-amber-400";
  return "text-red-400";
}

function skipRateBadgeVariant(rate: number): string {
  if (rate < 20) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (rate < 50) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return "bg-red-500/15 text-red-400 border-red-500/30";
}

function HourlyChart({ data }: { data: AnnouncementAnalyticsData["hourlyDistribution"] }) {
  const maxPlays = Math.max(...data.map((b) => b.plays), 1);

  const peakHour = data.reduce((best, b) => (b.plays > best.plays ? b : best), data[0]);

  return (
    <div>
      <div className="flex items-end gap-1 h-28 py-1">
        {data.map((bucket) => {
          const heightPct = maxPlays > 0 ? (bucket.plays / maxPlays) * 100 : 0;
          const isPeak = bucket.hour === peakHour.hour && bucket.plays > 0;
          return (
            <div key={bucket.hour} className="flex-1 flex flex-col items-center gap-1 group/bar relative">
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap bg-black/90 border border-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                {bucket.plays}
              </div>
              <div className="w-full flex items-end justify-center" style={{ height: "100px" }}>
                <div
                  className={cn(
                    "w-full max-w-[14px] rounded-t-sm transition-all duration-500",
                    isPeak
                      ? "bg-neon shadow-sm shadow-neon/50"
                      : bucket.plays > 0
                      ? "bg-white/30 group-hover/bar:bg-white/50"
                      : "bg-white/5"
                  )}
                  style={{ height: `${Math.max(heightPct, bucket.plays > 0 ? 4 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis labels — show every 6th hour */}
      <div className="flex gap-1 mt-1">
        {data.map((bucket) => (
          <div key={bucket.hour} className="flex-1 text-center">
            {bucket.hour % 6 === 0 && (
              <span className="text-neutral-500 text-[9px] font-bold">
                {bucket.hour.toString().padStart(2, "0")}
              </span>
            )}
          </div>
        ))}
      </div>

      {peakHour.plays > 0 && (
        <p className="text-neutral-500 text-[11px] mt-2">
          Пиковое время:{" "}
          <span className="text-neon font-bold">
            {peakHour.hour.toString().padStart(2, "0")}:00 — {(peakHour.hour + 1).toString().padStart(2, "0")}:00
          </span>{" "}
          · {peakHour.plays} воспроизв. (мск)
        </p>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="glass-dark border border-white/10 p-6 rounded-[2rem] space-y-4">
      <div
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center",
          accent ? "bg-neon/10" : "bg-white/5"
        )}
      >
        <Icon className={cn("w-5 h-5", accent ? "text-neon" : "text-neutral-400")} />
      </div>
      <div>
        <div className={cn("text-3xl font-black leading-none mb-1", accent ? "text-neon" : "text-white")}>
          {value}
        </div>
        <div className="text-[11px] uppercase tracking-widest font-bold text-neutral-500">{label}</div>
        {sub && <div className="text-[11px] text-neutral-600 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="glass-dark border border-white/10 p-6 rounded-[2rem] space-y-4">
            <Skeleton className="w-11 h-11 rounded-xl bg-white/5" />
            <Skeleton className="h-10 w-20 bg-white/5" />
            <Skeleton className="h-3 w-32 bg-white/5" />
          </div>
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-[2rem] bg-white/5" />
      <Skeleton className="h-64 w-full rounded-[2rem] bg-white/5" />
    </div>
  );
}

export default function AnnouncementAnalyticsPage() {
  const [period, setPeriod] = useState<AnnouncementAnalyticsPeriod>("30d");

  const { data, isLoading, isError } = useQuery<AnnouncementAnalyticsData>({
    queryKey: ["announcement-analytics", period],
    queryFn: async () => {
      const result = await getAnnouncementAnalyticsAction(period);
      if (!result.success) throw new Error(result.error ?? "Ошибка загрузки");
      return result.data!;
    },
    staleTime: 60_000,
  });

  return (
    <div className="space-y-10 pb-32 relative z-0 min-h-screen animate-fade-in">
      {/* Background blurs */}
      <div className="fixed top-[-10%] left-[-10%] w-[700px] h-[700px] bg-neon/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed top-[30%] right-[-5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-1">
        <div className="flex items-start gap-4">
          <Link href="/dashboard/announcements">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-2xl border border-white/10 hover:bg-white/5 text-neutral-400 hover:text-white mt-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="space-y-1">
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white">
              Аналитика <span className="text-neon">анонсов</span>
            </h2>
            <p className="text-neutral-400 font-medium text-xs sm:text-sm italic">
              Статистика воспроизведения и вовлечённости
            </p>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-2 glass-dark border border-white/10 p-1.5 rounded-2xl self-start sm:self-auto">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setPeriod(opt.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                period === opt.id
                  ? "bg-neon text-black shadow-sm shadow-neon/30"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <LoadingSkeleton />}

      {isError && (
        <div className="glass-dark border border-red-500/20 p-8 rounded-[2rem] flex items-center gap-4">
          <AlertCircle className="w-8 h-8 text-red-400 shrink-0" />
          <div>
            <p className="text-white font-bold">Ошибка загрузки данных</p>
            <p className="text-neutral-400 text-sm">Попробуйте обновить страницу</p>
          </div>
        </div>
      )}

      {data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard
              icon={Play}
              label="Воспроизведений"
              value={data.totalPlays.toLocaleString("ru-RU")}
              sub="за выбранный период"
              accent
            />
            <StatCard
              icon={SkipForward}
              label="Пропущено"
              value={data.totalSkipped.toLocaleString("ru-RU")}
              sub={`из ${data.totalPlays.toLocaleString("ru-RU")} воспроизведений`}
            />
            <StatCard
              icon={TrendingDown}
              label="Skip Rate"
              value={
                <span className={skipRateColor(data.overallSkipRate)}>
                  {data.overallSkipRate}%
                </span>
              }
              sub={
                data.overallSkipRate < 20
                  ? "Отличная вовлечённость"
                  : data.overallSkipRate < 50
                  ? "Средняя вовлечённость"
                  : "Низкая вовлечённость"
              }
            />
          </div>

          {/* Empty state */}
          {data.totalPlays === 0 && (
            <div className="glass-dark border border-white/10 p-12 rounded-[2rem] text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
                <BarChart3 className="w-8 h-8 text-neutral-600" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Пока нет данных</p>
                <p className="text-neutral-500 text-sm mt-1">
                  Включите авто-расписание анонсов, чтобы начать собирать статистику
                </p>
              </div>
              <Link href="/dashboard/announcements/schedule">
                <Button className="bg-neon text-black rounded-2xl px-6 h-10 font-black uppercase text-xs tracking-widest gap-2 hover:scale-105 transition-transform">
                  Настроить расписание
                </Button>
              </Link>
            </div>
          )}

          {data.totalPlays > 0 && (
            <>
              {/* Per-announcement table */}
              <div className="glass-dark border border-white/10 rounded-[2rem] overflow-hidden">
                <div className="px-6 sm:px-8 py-6 border-b border-white/10 flex items-center gap-3">
                  <Volume2 className="text-neon w-5 h-5" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">
                    Статистика по анонсам
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-6 sm:px-8 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                          Анонс
                        </th>
                        <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 whitespace-nowrap">
                          Воспроиз.
                        </th>
                        <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 whitespace-nowrap">
                          Прослушано
                        </th>
                        <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 whitespace-nowrap">
                          Skip Rate
                        </th>
                        <th className="text-right px-6 sm:px-8 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 whitespace-nowrap">
                          Ср. длит.
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.announcementStats.map((row, idx) => (
                        <tr
                          key={row.announcementId}
                          className={cn(
                            "border-b border-white/5 hover:bg-white/3 transition-colors",
                            idx === 0 && "bg-neon/3"
                          )}
                        >
                          <td className="px-6 sm:px-8 py-4">
                            <div className="flex items-center gap-3">
                              {idx === 0 && (
                                <div className="w-5 h-5 rounded-md bg-neon/15 flex items-center justify-center shrink-0">
                                  <BarChart3 className="w-3 h-3 text-neon" />
                                </div>
                              )}
                              <div>
                                <p className="text-white font-bold text-xs leading-tight line-clamp-1">
                                  {row.title}
                                </p>
                                <p className="text-neutral-500 text-[10px] mt-0.5 capitalize">
                                  {row.provider} · {row.voiceName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-white font-bold text-sm">
                              {row.totalPlays.toLocaleString("ru-RU")}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-neutral-300 text-sm">
                              {row.completedPlays.toLocaleString("ru-RU")}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span
                              className={cn(
                                "inline-flex items-center px-2.5 py-0.5 rounded-xl text-[11px] font-black border",
                                skipRateBadgeVariant(row.skipRate)
                              )}
                            >
                              {row.skipRate}%
                            </span>
                          </td>
                          <td className="px-6 sm:px-8 py-4 text-right">
                            <span className="text-neutral-400 text-sm font-mono">
                              {row.avgListenDurationSec}с
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Hourly distribution chart */}
              <div className="glass-dark border border-white/10 p-6 sm:p-8 rounded-[2rem] space-y-6">
                <div className="flex items-center gap-3">
                  <Clock className="text-neon w-5 h-5" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">
                    Распределение по часам
                  </h3>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">мск</span>
                </div>
                <HourlyChart data={data.hourlyDistribution} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
