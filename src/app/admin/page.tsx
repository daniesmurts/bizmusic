import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { businesses, tracks, playLogs, licenses } from "@/db/schema";
import { sql } from "drizzle-orm";
import {
  Users,
  Music,
  CreditCard,
  Activity,
  TrendingUp,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AdminOverviewPage() {
  // Run all four stat queries in parallel — previously executed sequentially
  const [
    [businessRow],
    [trackRow],
    [playLogRow],
    [revenueRow],
  ] = await Promise.all([
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(businesses),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(tracks),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(playLogs),
    db.select({ total: sql<number>`cast(coalesce(sum("totalCost"), 0) as int)` }).from(licenses),
  ]);

  const businessesCount = businessRow?.count ?? 0;
  const tracksCount     = trackRow?.count ?? 0;
  const playLogsCount   = playLogRow?.count ?? 0;
  const totalRevenue    = revenueRow?.total ?? 0;

  const stats = [
    { 
      name: "Общая выручка", 
      value: `${totalRevenue.toLocaleString('ru-RU')} ₽`, 
      change: "+12.5%", 
      trend: "up",
      icon: CreditCard,
      color: "text-neon",
      bg: "bg-neon/10"
    },
    { 
      name: "Активные бизнесы", 
      value: businessesCount || 0, 
      change: "+4", 
      trend: "up",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10"
    },
    { 
      name: "Всего треков", 
      value: tracksCount || 0, 
      change: "+12", 
      trend: "up",
      icon: Music,
      color: "text-purple-400",
      bg: "bg-purple-400/10"
    },
    { 
      name: "Проигрываний (всего)", 
      value: playLogsCount?.toLocaleString('ru-RU') || 0, 
      change: "+1.2k", 
      trend: "up",
      icon: Play,
      color: "text-orange-400",
      bg: "bg-orange-400/10"
    },
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-neutral-500">
           <Activity className="w-4 h-4 text-neon" />
           <span className="text-[10px] font-black uppercase tracking-widest">Рабочий стол • Прямой эфир</span>
        </div>
        <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none">
          Панель <br /><span className="text-neon underline decoration-neon/20 underline-offset-8">Управления</span>
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            className="group relative p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-white/10 transition-all duration-500"
          >
            <div className={cn("absolute top-0 right-0 p-12 blur-[80px] rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-700", stat.bg)} />
            
            <div className="relative z-10 flex flex-col gap-6">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{stat.name}</p>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-black tracking-tighter leading-none text-white">{stat.value}</span>
                  <div className="flex items-center gap-1 text-[10px] font-black text-neon bg-neon/10 px-2 py-1 rounded-full mb-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.change}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Sections (Placeholders) */}
      <div className="grid lg:grid-cols-2 gap-8">
         <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] space-y-8 h-[400px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-24 bg-blue-500/5 blur-[100px] rounded-full" />
            <div className="flex items-center justify-between relative z-10">
               <h3 className="text-xl font-black uppercase tracking-normal">Последние транзакции</h3>
               <button className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">Смотреть всё</button>
            </div>
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30 relative z-10">
               <CreditCard className="w-12 h-12" />
               <p className="text-xs font-black uppercase tracking-widest">История платежей пуста</p>
            </div>
         </div>

         <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] space-y-8 h-[400px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-24 bg-neon/5 blur-[100px] rounded-full" />
            <div className="flex items-center justify-between relative z-10">
               <h3 className="text-xl font-black uppercase tracking-normal">Новые клиенты</h3>
               <button className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">Верификация</button>
            </div>
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30 relative z-10">
               <Users className="w-12 h-12" />
               <p className="text-xs font-black uppercase tracking-widest">Нет ожидающих заявок</p>
            </div>
         </div>
      </div>
    </div>
  );
}
