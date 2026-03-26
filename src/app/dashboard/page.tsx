"use client";

import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getDashboardDataAction } from "@/lib/actions/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Music,
  MapPin,
  Plus,
  Settings,
  CreditCard,
  ShieldCheck,
  BarChart3,
  Play,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FeaturedMusic } from "@/components/FeaturedMusic";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: async () => {
      const result = await getDashboardDataAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const stats = {
    locationCount: dashboardData?.stats?.locationCount ?? 0,
    trackCount: dashboardData?.stats?.trackCount ?? 0,
    licenseStatus: dashboardData?.stats?.licenseStatus || (isLoading ? "..." : "—")
  };

  const locations = dashboardData?.locations || [];

  return (
    <div className="space-y-12 pb-20 relative z-0 min-h-screen animate-fade-in">
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] bg-neon/15 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed top-[20%] right-[-5%] w-[600px] h-[600px] bg-blue-500/15 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[10%] w-[800px] h-[800px] bg-purple-500/15 rounded-full blur-[150px] pointer-events-none -z-10" />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-2">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter">Обзор <span className="text-neon">Активности</span></h2>
          <p className="text-neutral-400 font-medium text-xs sm:text-sm italic break-all sm:break-normal">
            Добро пожаловать, <span className="text-white font-bold not-italic">{user?.email}</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link href="/dashboard/settings" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-2xl px-6 py-5 sm:py-6 font-black uppercase text-[10px] sm:text-xs tracking-widest gap-2">
              <Settings className="w-4 h-4" /> Настройки
            </Button>
          </Link>
          <Button className="w-full sm:w-auto bg-neon text-black hover:scale-105 transition-transform rounded-2xl px-6 sm:px-8 py-5 sm:py-6 font-black uppercase text-[10px] sm:text-xs tracking-widest gap-2 shadow-lg shadow-neon/20">
            <Plus className="w-4 h-4" /> Добавить точку
          </Button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-dark border border-white/10 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] space-y-4">
          <div className="w-12 h-12 bg-neon/10 rounded-xl flex items-center justify-center">
            <MapPin className="text-neon w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white leading-none mb-1">
              {isLoading ? <Skeleton className="h-10 w-12 bg-white/5" /> : stats.locationCount}
            </div>
            <div className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Активные локации</div>
          </div>
        </div>
        <div className="glass-dark border border-white/10 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] space-y-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Music className="text-blue-500 w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white leading-none mb-1">
              {isLoading ? <Skeleton className="h-10 w-20 bg-white/5" /> : stats.trackCount}
            </div>
            <div className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Треков в плейлистах</div>
          </div>
        </div>
        <div className="glass-dark border border-white/10 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] space-y-4">
          <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
            <ShieldCheck className="text-orange-500 w-6 h-6" />
          </div>
          <div>
            <div className={cn(
               "text-xl sm:text-2xl font-black uppercase tracking-tight leading-none mb-1",
               stats.licenseStatus === 'ACTIVE' ? 'text-neon' : stats.licenseStatus === 'GENERATING' ? 'text-yellow-400' : 'text-orange-500'
            )}>
              {isLoading ? <Skeleton className="h-8 w-24 bg-white/5" /> : stats.licenseStatus === 'ACTIVE' ? 'АКТИВНА' : stats.licenseStatus === 'GENERATING' ? 'ФОРМИРУЕТСЯ' : stats.licenseStatus === 'FAILED' ? 'ОШИБКА' : 'НЕ АКТИВНА'}
            </div>
            <div className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] sm:text-xs">Статус лицензии</div>
          </div>
        </div>
      </div>

      {/* Locations List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black uppercase tracking-tighter">Ваши <span className="text-neon">локации</span></h2>
          <Link href="#" className="text-neon text-[10px] font-black uppercase tracking-widest hover:underline underline-offset-4">Посмотреть все</Link>
        </div>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-24 glass-dark rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : locations.length > 0 ? (
          <div className="glass-dark border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden">
            {locations.map((loc: { id: string; name: string; address?: string }) => (
              <div key={loc.id} className="p-5 sm:p-8 flex items-center justify-between border-b border-white/5 group hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-900 rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/5 relative overflow-hidden group-hover:scale-105 transition-transform">
                    <Music className="text-neon/40 w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-xl font-black uppercase tracking-tight text-white mb-0.5 sm:mb-1">{loc.name}</h3>
                    <p className="text-neutral-500 text-[10px] sm:text-sm font-medium">{loc.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-12">
                  <div className="hidden md:block">
                    <div className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] mb-1">Статус</div>
                    <div className="text-white font-black text-sm uppercase">Онлайн</div>
                  </div>
                  <Button size="icon" className="w-10 h-10 sm:w-12 sm:h-12 bg-neon/10 border border-neon/20 text-neon rounded-full hover:bg-neon hover:text-black">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-dark border border-white/10 p-12 rounded-[2.5rem] text-center space-y-4">
             <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
               <MapPin className="text-neutral-500 w-8 h-8" />
             </div>
             <p className="text-neutral-400 font-medium">У вас пока нет добавленных локаций.</p>
             <Button className="bg-neon/10 border border-neon/20 text-neon hover:bg-neon hover:text-black rounded-xl">
               Добавить первую точку
             </Button>
          </div>
        )}
      </section>

      {/* Featured Music */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black uppercase tracking-tighter">Рекомендации <span className="text-neon">месяца</span></h2>
          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest italic">Подборка от редакции</p>
        </div>
        <FeaturedMusic />
      </section>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
         <Link href="/dashboard/player" className="glass-dark border border-white/10 p-10 rounded-[2.5rem] space-y-6 relative overflow-hidden group">
           <div className="relative z-10 space-y-4">
             <h3 className="text-3xl font-black uppercase tracking-tight leading-none">Управление <br />Эфиром</h3>
             <p className="text-neutral-400 font-medium">Перейдите в плеер для управления музыкой в ваших заведениях.</p>
             <div className="text-neon flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                Открыть плеер <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
             </div>
           </div>
         </Link>

         <Link href="/dashboard/contract" className="glass-dark border border-white/10 p-10 rounded-[2.5rem] space-y-6 relative overflow-hidden group">
           <div className="relative z-10 space-y-4">
             <h3 className="text-3xl font-black uppercase tracking-tight leading-none">Документы и <br />Договоры</h3>
             <p className="text-neutral-400 font-medium">Ваши лицензии и сертификаты соответствия в одном месте.</p>
             <div className="text-neon flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                Проверить статус <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
             </div>
           </div>
         </Link>
      </div>
    </div>
  );
}
