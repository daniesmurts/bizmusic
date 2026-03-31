"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminAnalyticsAction, exportAdminAnalyticsCSVAction } from "@/lib/actions/admin-analytics";
import { 
  Users, 
  Play, 
  Clock, 
  Activity,
  Hexagon,
  CreditCard,
  Music,
  ListMusic,
  Mic2,
  BarChart3,
  UserMinus,
  UserPlus,
  Shield,
  MapPin,
  FileCheck,
  ScrollText,
  Building2,
  Sparkles,
  Zap,
  WifiOff,
  AlertTriangle,
  HeartPulse,
  Download,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import { subDays, subMonths, startOfDay, formatISO } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from "recharts";
import dynamic from "next/dynamic";

const PlaybackHeatmap = dynamic(() => import("@/components/PlaybackHeatmap").then(m => m.PlaybackHeatmap), { ssr: false });

export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "content">("overview");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "12m" | "all">("30d");

  const computedRange = useMemo(() => {
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const to = formatISO(tomorrow, { representation: "date" });

    switch (dateRange) {
      case "7d":
        return { from: formatISO(subDays(today, 6), { representation: "date" }), to };
      case "30d":
        return { from: formatISO(subDays(today, 29), { representation: "date" }), to };
      case "90d":
        return { from: formatISO(subDays(today, 89), { representation: "date" }), to };
      case "12m":
        return { from: formatISO(subMonths(today, 12), { representation: "date" }), to };
      case "all":
        return undefined;
    }
  }, [dateRange]);

  const { data: analytics, isLoading, isFetching } = useQuery({
    queryKey: ["admin-analytics", computedRange],
    queryFn: async () => {
      const result = await getAdminAnalyticsAction(computedRange);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const [isExporting, setIsExporting] = useState(false);
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportAdminAnalyticsCSVAction(computedRange);
      if (result.success && result.data && typeof result.data === 'string') {
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `bizmuzik-analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("Export failed: " + ((result as any).error || "Unknown error"));
      }
    } catch (error) {
      console.error("Export Error:", error);
      alert("Export failed. Check console.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-12 animate-pulse">
        <div className="h-20 w-1/3 bg-white/5 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 rounded-[2.5rem]" />)}
        </div>
        <div className="h-[400px] bg-white/5 rounded-[3rem]" />
      </div>
    );
  }

  const summary = analytics?.summary || { users: 0, businesses: 0, tracks: 0, plays: 0, hours: 0, revenue: 0, likes: 0, dislikes: 0, reactionRatio: 0 };
  const topTracks = analytics?.topTracks || [];
  const topLikedTracks = analytics?.reactions?.topLikedTracks || [];
  const topDislikedTracks = analytics?.reactions?.topDislikedTracks || [];

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-neutral-500">
             <Activity className="w-4 h-4 text-neon" />
             <span className="text-[10px] font-black uppercase tracking-widest leading-none">Центр управления • Аналитика</span>
          </div>
          <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-none">
            Глобальная <br /><span className="text-neon outline-text">Статистика</span>
          </h1>
        </div>
        
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-3 bg-white/[0.05] border border-white/10 rounded-2xl hover:bg-white/[0.1] transition-all text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
          >
            <Download className={cn("w-3.5 h-3.5", isExporting && "animate-bounce")} />
            {isExporting ? "Экспорт..." : "Скачать CSV"}
          </button>

          {/* Tab Switcher */}
          <div className="flex p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
            {(["overview", "users", "content"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === tab 
                    ? "bg-neon text-black shadow-lg shadow-neon/20" 
                    : "text-neutral-500 hover:text-white"
                )}
              >
                {tab === "overview" ? "Обзор" : tab === "users" ? "Клиенты" : "Контент"}
              </button>
            ))}
          </div>

          {/* Date Range Picker */}
          <div className="flex p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
            {(["7d", "30d", "90d", "12m", "all"] as const).map((range) => {
              const labels: Record<typeof range, string> = {
                "7d": "7 дней",
                "30d": "30 дней",
                "90d": "90 дней",
                "12m": "12 мес",
                "all": "Всё",
              };
              return (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={cn(
                    "px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    dateRange === range
                      ? "bg-white/10 text-white shadow-inner border border-white/10"
                      : "text-neutral-500 hover:text-white"
                  )}
                >
                  {labels[range]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading overlay for range changes */}
      {isFetching && !isLoading && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-black/80 border border-white/10 rounded-xl backdrop-blur-xl">
          <div className="w-3 h-3 border-2 border-neon border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Обновление...</span>
        </div>
      )}

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <StatCard 
          label="Всего пользователей" 
          value={summary.users} 
          icon={Users} 
          color="text-blue-400"
          bg="bg-blue-400/10"
          pop={analytics?.pop?.users}
        />
        <StatCard 
          label="Часы прослушивания" 
          value={`${summary.hours} ч`} 
          icon={Clock} 
          color="text-orange-400"
          bg="bg-orange-400/10"
          pop={analytics?.pop?.hours}
        />
        <StatCard 
          label="Всего проигрываний" 
          value={summary.plays.toLocaleString()} 
          icon={Play} 
          color="text-neon"
          bg="bg-neon/10"
          pop={analytics?.pop?.plays}
        />
        <StatCard 
          label="Общая выручка" 
          value={`${summary.revenue.toLocaleString()} ₽`} 
          icon={CreditCard} 
          color="text-purple-400"
          bg="bg-purple-400/10"
          pop={analytics?.pop?.revenue}
        />
        <StatCard 
          label="Лайки" 
          value={summary.likes.toLocaleString()} 
          icon={Activity} 
          color="text-emerald-400"
          bg="bg-emerald-400/10"
        />
        <StatCard 
          label="Дизлайки" 
          value={summary.dislikes.toLocaleString()} 
          icon={Activity} 
          color="text-rose-400"
          bg="bg-rose-400/10"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Activity Charts Panel */}
        <div className="lg:col-span-2 p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] relative overflow-hidden group">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[60%] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Активность пользователей</h3>
              <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">DAU / WAU / MAU</p>
            </div>
            <Hexagon className="w-8 h-8 text-white/10" />
          </div>
          <div className="h-auto w-full mt-8 relative z-10 space-y-8">
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={analytics?.activity?.dau || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} width={30} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" name="DAU" stroke="#34d399" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={analytics?.activity?.wau || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} width={30} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" name="WAU" stroke="#60a5fa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={analytics?.activity?.mau || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} width={30} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" name="MAU" stroke="#a78bfa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={analytics?.revenueTrend?.map((d: any) => ({ ...d, revenue: d.revenue ? Number(d.revenue) / 100 : 0 })) || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} width={40} tickFormatter={(v: any) => `${v.toLocaleString()} ₽`} />
                <Tooltip formatter={(v: any) => `${v.toLocaleString()} ₽`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Выручка" stroke="#a3e635" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>

            {/* Playback Heatmap */}
            <div className="mt-12">
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Тепловая карта прослушиваний</h3>
              <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mb-4">Активность по дням недели и часам</p>
              {analytics?.playbackHeatmap && analytics.playbackHeatmap.length > 0 ? (
                <PlaybackHeatmap data={analytics.playbackHeatmap as any} />
              ) : (
                <div className="h-[320px] flex items-center justify-center text-neutral-500">Нет данных для отображения</div>
              )}
            </div>
          </div>
        </div>

        {/* Top Content Sidebar */}
        <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-24 bg-neon/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="relative z-10">
             <h3 className="text-2xl font-black uppercase tracking-tight mb-8">Топ Треков</h3>
             <div className="space-y-6">
                {topTracks.map((track: any, i: number) => (
                  <div key={track.id} className="flex items-center justify-between group/item">
                    <div className="flex items-center gap-4">
                      <div className="text-[10px] font-black text-neutral-500 w-4">{i + 1}</div>
                      <div>
                         <div className="text-xs font-black uppercase tracking-tight text-white group-hover/item:text-neon transition-colors truncate max-w-[140px]">{track.title}</div>
                         <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest truncate max-w-[140px]">{track.artist}</div>
                      </div>
                    </div>
                    <div className="text-[10px] font-black text-neutral-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                      {track.playCount} ▶️
                    </div>
                  </div>
                ))}
             </div>
             
             <div className="mt-10 space-y-6 border-t border-white/5 pt-8">
               <div className="flex items-center justify-between">
                 <h4 className="text-sm font-black uppercase tracking-widest text-emerald-300">Топ по лайкам</h4>
                 <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">L/D: {summary.reactionRatio}</span>
               </div>
               <div className="space-y-3">
                 {topLikedTracks.length > 0 ? topLikedTracks.map((track: any) => (
                   <div key={track.id} className="flex items-center justify-between text-xs">
                     <span className="font-bold text-white truncate max-w-[140px]">{track.title}</span>
                     <span className="font-black text-emerald-400">👍 {track.likes}</span>
                   </div>
                 )) : (
                   <p className="text-xs font-bold uppercase tracking-widest text-neutral-600">Нет реакций</p>
                 )}
               </div>
             </div>

             <div className="mt-8 space-y-6">
               <h4 className="text-sm font-black uppercase tracking-widest text-rose-300">Топ по дизлайкам</h4>
               <div className="space-y-3">
                 {topDislikedTracks.length > 0 ? topDislikedTracks.map((track: any) => (
                   <div key={track.id} className="flex items-center justify-between text-xs">
                     <span className="font-bold text-white truncate max-w-[140px]">{track.title}</span>
                     <span className="font-black text-rose-400">👎 {track.dislikes}</span>
                   </div>
                 )) : (
                   <p className="text-xs font-bold uppercase tracking-widest text-neutral-600">Нет реакций</p>
                 )}
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Secondary Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
         <DistributionPieCard 
            title="Типы клиентов" 
            data={analytics?.distributions?.userTypes} 
         />
         <DistributionCard 
            title="Статус подписок" 
            data={analytics?.distributions?.subscriptions} 
            color="text-neon" 
            bg="bg-neon/10" 
         />
         <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col justify-between">
            <div className="space-y-2">
               <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400">Система</h4>
               <p className="text-xs font-medium text-neutral-500">Все метрики синхронизированы в реальном времени.</p>
            </div>
            <div className="pt-8">
               <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Загрузка API</span>
                  <span className="text-xs font-black text-neon">24ms</span>
               </div>
               <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-neon w-[15%]" />
               </div>
            </div>
         </div>
      </div>

      {/* Phase 2: Engagement */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 text-neutral-500 px-2">
          <BarChart3 className="w-4 h-4 text-violet-400" />
          <span className="text-[10px] font-black uppercase tracking-widest">Вовлечённость</span>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
           <DistributionCard title="Топ плейлистов" data={analytics?.engagement?.topPlaylists?.map((p:any) => ({ type: p.name, count: p.play_count }))} color="text-indigo-400" bg="bg-indigo-400/10" />
           <DistributionCard title="Топ артистов" data={analytics?.engagement?.topArtists?.map((a:any) => ({ type: a.artist, count: a.play_count }))} color="text-pink-400" bg="bg-pink-400/10" />
           <DistributionCard title="Топ жанров" data={analytics?.engagement?.topGenres?.map((g:any) => ({ type: g.genre, count: g.play_count }))} color="text-cyan-400" bg="bg-cyan-400/10" />
           <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400">Retention</h4>
              <div className="flex items-center gap-4">
                 <div className="text-3xl font-black text-emerald-400">{100 - (analytics?.engagement?.churn?.churnRate ?? 0)}%</div>
                 <div className="text-[10px] font-black uppercase text-neutral-500">Удержание пользователей</div>
              </div>
           </div>
        </div>
      </div>

      {/* Phase 3 & 4: Compliance & AI */}
      <div className="grid lg:grid-cols-2 gap-8">
         <div className="space-y-6">
            <div className="flex items-center gap-3 text-neutral-500 px-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Бизнес и комплаенс</span>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
               <DistributionCard title="По типу бизнеса" data={analytics?.compliance?.segmentation?.byType} color="text-violet-400" bg="bg-violet-400/10" />
               <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-6">
                  <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400">Локации</h4>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Активные</span>
                        <span className="text-sm font-black text-emerald-400">{analytics?.compliance?.locations?.activeLocCount}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Здоровье</span>
                        <span className="text-sm font-black text-white">{analytics?.compliance?.locations?.locationHealthRate}%</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <div className="space-y-6">
            <div className="flex items-center gap-3 text-neutral-500 px-2">
              <Sparkles className="w-4 h-4 text-fuchsia-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">AI и фичи</span>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
               <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-6">
                  <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400">Использование</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <p className="text-xs font-black text-fuchsia-400">{analytics?.aiFeatures?.usage?.totalAi}</p>
                        <p className="text-[8px] font-black uppercase text-neutral-500">AI Запросов</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-xs font-black text-violet-400">{analytics?.aiFeatures?.usage?.totalTts}</p>
                        <p className="text-[8px] font-black uppercase text-neutral-500">TTS Запросов</p>
                     </div>
                  </div>
               </div>
               <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400">Инсайты</h4>
                  {analytics?.aiFeatures?.insights?.peakHour && (
                    <div className="flex items-start gap-2">
                       <span className="text-lg">🔥</span>
                       <p className="text-[10px] font-bold text-neutral-300">Пик: {analytics.aiFeatures.insights.peakHour.hour}:00</p>
                    </div>
                  )}
               </div>
            </div>
         </div>
      </div>

      {/* Phase 5: Health */}
      <div className="space-y-6">
         <div className="flex items-center gap-3 text-neutral-500 px-2">
           <HeartPulse className="w-4 h-4 text-rose-400" />
           <span className="text-[10px] font-black uppercase tracking-widest">Здоровье системы</span>
         </div>
         <div className="grid md:grid-cols-3 gap-6">
            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-6">
               <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400">Платежи</h4>
                  <span className="text-rose-400 font-black text-lg">{analytics?.health?.payments?.failureRate}% ошибок</span>
               </div>
               <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${analytics?.health?.payments?.failureRate}%` }} />
               </div>
            </div>
            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-6 text-center">
               <p className="text-2xl font-black text-orange-400">{analytics?.health?.playbackAnomaly?.silentLocations}</p>
               <p className="text-[10px] font-black uppercase text-neutral-500">Тихих локаций</p>
            </div>
            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-4">
               <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400">Поддержка</h4>
               <p className="text-[10px] text-neutral-500 font-bold uppercase">Helpdesk: Online</p>
            </div>
         </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, pop }: any) {
  return (
    <div className="group relative p-8 bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-white/10 transition-all duration-500">
      <div className={cn("absolute top-0 right-0 p-12 blur-[80px] rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-700", bg)} />
      <div className="relative z-10 space-y-6">
        <div className="flex justify-between items-start">
           <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner transition-transform group-hover:scale-110", bg)}>
             <Icon className={cn("w-6 h-6", color)} />
           </div>
           {pop !== undefined && pop !== 0 && (
             <div className={cn(
               "flex items-center gap-0.5 px-2.5 py-1 rounded-full text-[9px] font-black",
               pop > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
             )}>
               {pop > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
               {Math.abs(pop)}%
             </div>
           )}
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{label}</p>
          <span className="text-3xl font-black tracking-tighter leading-none text-white">{value}</span>
        </div>
      </div>
    </div>
  );
}

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e'];

function DistributionPieCard({ title, data }: any) {
  const chartData = data?.map((d: any) => ({
    name: d.type || d.status || d.plan || d.country,
    value: Number(d.count)
  })) || [];

  return (
    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-4">
       <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400">{title}</h4>
       <div className="h-[200px] w-full">
         <ResponsiveContainer width="100%" height="100%">
           <PieChart>
             <Pie
               data={chartData}
               innerRadius={60}
               outerRadius={80}
               paddingAngle={5}
               dataKey="value"
               stroke="none"
             >
               {chartData.map((_entry: any, index: number) => (
                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
               ))}
             </Pie>
             <Tooltip 
               contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '1rem' }} 
               itemStyle={{ color: '#fff', fontSize: '10px', textTransform: 'uppercase' }}
             />
           </PieChart>
         </ResponsiveContainer>
       </div>
       <div className="grid grid-cols-2 gap-2">
         {chartData.map((d: any, i: number) => (
           <div key={i} className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
             <span className="text-[8px] font-black uppercase tracking-widest text-neutral-500 truncate">{d.name}</span>
           </div>
         ))}
       </div>
    </div>
  );
}

function DistributionCard({ title, data, color, bg }: any) {
  const maxCount = Math.max(...(data?.map((d: any) => Number(d.count)) || [1]), 1);
  return (
    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-8">
       <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400">{title}</h4>
       <div className="space-y-4">
          {data?.map((item: any) => (
            <div key={item.type || item.status} className="space-y-2">
               <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-white">{item.type || item.status}</span>
                  <span className="text-neutral-500">{item.count}</span>
               </div>
               <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-1000", bg?.replace('/10', '') || "bg-white", color)} 
                    style={{ width: `${Math.max((Number(item.count) / maxCount) * 100, 2)}%`, backgroundColor: 'currentColor' }} 
                  />
               </div>
            </div>
          ))}
       </div>
    </div>
  );
}
