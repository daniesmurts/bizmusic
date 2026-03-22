"use client";

import { Button } from "@/components/ui/button";
import { 
  Play, 
  ListMusic, 
  Settings,
  Plus,
  ArrowRight
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getDashboardDataAction } from "@/lib/actions/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { FeaturedMusic } from "@/components/FeaturedMusic";

export default function PlayerPage() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: async () => {
      const result = await getDashboardDataAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const playlists = dashboardData?.playlists || [];
  const businessName = dashboardData?.businessName || "Ваш бизнес";
  const firstLocationName = dashboardData?.locations?.[0]?.name || "—";

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-1">
          <h2 className="text-4xl font-black uppercase tracking-tighter">Стриминг <span className="text-neon">Плеер</span></h2>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Управление эфиром в реальном времени</p>
        </div>
        <Button className="bg-neon text-black rounded-2xl px-8 font-black uppercase text-xs tracking-widest h-12 shadow-lg shadow-neon/20 hover:scale-105 transition-transform">
          <Plus className="w-4 h-4 mr-2" /> Новый поток
        </Button>
      </div>

      {/* Active Stream Card */}
      <div className="glass-dark border border-white/10 rounded-[3rem] p-10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-0" />
        <div className="absolute inset-0 bg-neon/5 mix-blend-overlay z-[-1]" />
        
        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-neon text-black rounded-full">
              <span className="w-2 h-2 bg-black rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">В ЭФИРЕ</span>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-black uppercase tracking-tighter leading-tight">
                {isLoading ? <Skeleton className="h-12 w-64 bg-white/10" /> : "Музыкальный поток"}
              </div>
              <div className="text-neutral-300 font-medium">Текущий поток: {isLoading ? <Skeleton className="inline-block h-4 w-32 bg-white/10" /> : firstLocationName}</div>
            </div>
            <div className="flex gap-4">
               <Button className="bg-white text-black hover:bg-neutral-200 rounded-2xl px-8 py-7 font-black uppercase text-xs tracking-widest gap-2">
                 <Settings className="w-4 h-4" /> Настроить
               </Button>
               <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 rounded-2xl px-8 py-7 font-black uppercase text-xs tracking-widest">
                 История
               </Button>
            </div>
          </div>

          <div className="glass-dark border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4 backdrop-blur-3xl">
             <div className="w-20 h-20 bg-neon/10 rounded-full flex items-center justify-center border border-neon/20 shadow-[0_0_30px_rgba(92,243,135,0.2)]">
               <Play className="text-neon w-8 h-8 fill-current ml-1" />
             </div>
             <div className="space-y-1">
               <span className="text-neutral-500 font-black uppercase tracking-widest text-[10px]">Сейчас играет</span>
               <h4 className="text-white font-black uppercase tracking-tighter">—</h4>
               <p className="text-neon text-xs font-bold font-mono">00:00 / 00:00</p>
             </div>
          </div>
        </div>
      </div>

      {/* Playlist Management */}
      <section className="space-y-6">
        <h3 className="text-xl font-black uppercase tracking-tighter px-2">Ваши <span className="text-neon">Плейлисты</span></h3>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-24 bg-white/5 rounded-[2.5rem]" />
            <Skeleton className="h-24 bg-white/5 rounded-[2.5rem]" />
          </div>
        ) : playlists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {playlists.map((list: any) => (
              <div key={list.id} className="glass-dark border border-white/10 p-6 rounded-[2.5rem] flex items-center justify-between group hover:border-white/20 transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-white/5 bg-neon/10 animate-in fade-in zoom-in duration-500">
                     <ListMusic className="w-8 h-8 text-neon" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black uppercase tracking-tight text-white mb-1">{list.name}</h4>
                    <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">{list.trackCount} ТРЕКОВ</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="hover:text-neon text-neutral-500 transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-dark border border-white/10 p-12 rounded-[2.5rem] text-center space-y-4">
             <p className="text-neutral-400 font-medium">У вас пока нет созданных плейлистов.</p>
             <Button className="bg-neon/10 border border-neon/20 text-neon hover:bg-neon hover:text-black rounded-xl">
               Создать первый плейлист
             </Button>
          </div>
        )}
      </section>

      {/* Featured Music */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black uppercase tracking-tighter">Рекомендации <span className="text-neon">месяца</span></h2>
          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest italic">Популярные треки</p>
        </div>
        <FeaturedMusic />
      </section>
    </div>
  );
}
