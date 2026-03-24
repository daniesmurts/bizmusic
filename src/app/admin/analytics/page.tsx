"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminAnalyticsAction } from "@/lib/actions/admin-analytics";
import { 
  Users, 
  Play, 
  Clock, 
  Activity,
  Hexagon,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function AdminAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "content">("overview");

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const result = await getAdminAnalyticsAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

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

  const summary = analytics?.summary || { users: 0, businesses: 0, tracks: 0, plays: 0, hours: 0, revenue: 0 };
  const topTracks = analytics?.topTracks || [];

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
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Всего пользователей" 
          value={summary.users} 
          icon={Users} 
          color="text-blue-400"
          bg="bg-blue-400/10"
        />
        <StatCard 
          label="Часы прослушивания" 
          value={`${summary.hours} ч`} 
          icon={Clock} 
          color="text-orange-400"
          bg="bg-orange-400/10"
        />
        <StatCard 
          label="Всего проигрываний" 
          value={summary.plays.toLocaleString()} 
          icon={Play} 
          color="text-neon"
          bg="bg-neon/10"
        />
        <StatCard 
          label="Общая выручка" 
          value={`${summary.revenue.toLocaleString()} ₽`} 
          icon={CreditCard} 
          color="text-purple-400"
          bg="bg-purple-400/10"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Growth Chart Panel */}
        <div className="lg:col-span-2 p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] relative overflow-hidden group">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[60%] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Динамика роста</h3>
              <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Прирост новых пользователей за 6 месяцев</p>
            </div>
            <Hexagon className="w-8 h-8 text-white/10" />
          </div>

          <div className="h-[300px] w-full mt-8 relative z-10 flex items-end justify-between px-4 pb-8 border-b border-white/5">
             {(() => {
               const maxCount = Math.max(...(analytics?.growth?.map((g: any) => Number(g.count)) || [1]), 1);
               return analytics?.growth?.map((item: any, i: number) => (
               <div key={i} className="flex flex-col items-center gap-4 group/bar w-full">
                  <div className="relative w-12 flex justify-center">
                    <div 
                      className="w-8 bg-blue-500/20 group-hover/bar:bg-blue-500/40 border-t-2 border-blue-500 rounded-lg transition-all duration-700" 
                      style={{ height: `${Math.max((Number(item.count) / maxCount) * 250, 20)}px` }}
                    />
                    <div className="absolute -top-8 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-blue-500 text-black text-[10px] font-black px-2 py-1 rounded">
                      {item.count}
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-neutral-600 group-hover/bar:text-white transition-colors rotate-45 md:rotate-0">
                    {item.month}
                  </span>
               </div>
             ));
             })()}
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
                      {track.playCount} проигрываний
                    </div>
                  </div>
                ))}
             </div>
             
             <button className="w-full mt-10 py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white hover:bg-white/5 transition-all">
                Полный отчет медиатеки
             </button>
          </div>
        </div>
      </div>

      {/* Secondary Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
         <DistributionCard 
            title="Типы клиентов" 
            data={analytics?.distributions?.userTypes} 
            color="text-blue-500" 
            bg="bg-blue-500/10" 
         />
         <DistributionCard 
            title="Статус подписок" 
            data={analytics?.distributions?.subscriptions} 
            color="text-neon" 
            bg="bg-neon/10" 
         />
         <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col justify-between">
            <div className="space-y-2">
               <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400">Производительность</h4>
               <p className="text-xs font-medium text-neutral-500">Система работает стабильно. Все метрики синхронизированы.</p>
            </div>
            <div className="pt-8">
               <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Нагрузка API</span>
                  <span className="text-xs font-black text-neon">24ms</span>
               </div>
               <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-neon w-[15%]" />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }: any) {
  return (
    <div className="group relative p-8 bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-white/10 transition-all duration-500">
      <div className={cn("absolute top-0 right-0 p-12 blur-[80px] rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-700", bg)} />
      
      <div className="relative z-10 space-y-6">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner transition-transform group-hover:scale-110", bg)}>
          <Icon className={cn("w-6 h-6", color)} />
        </div>
        
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{label}</p>
          <span className="text-3xl font-black tracking-tighter leading-none text-white">{value}</span>
        </div>
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
                    className={cn("h-full transition-all duration-1000", bg.replace('/10', ''), color)} 
                    style={{ width: `${Math.max((Number(item.count) / maxCount) * 100, 2)}%`, backgroundColor: 'currentColor' }} 
                  />
               </div>
            </div>
          ))}
       </div>
    </div>
  );
}
