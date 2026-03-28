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
import { DashboardPlayer } from "@/components/player/DashboardPlayer";
import { ConnectionStatus } from "@/components/player/ConnectionStatus";
import { PlayHistory } from "@/components/player/PlayHistory";
import { PlaylistManager } from "@/components/player/PlaylistManager";
import { toast } from "sonner";

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
  const businessId = dashboardData?.businessId;

  return (
    <div className="space-y-12 animate-fade-in relative z-0 min-h-screen">
      {/* Background gradients for depth - enhanced for brighter accents */}
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] bg-neon/15 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed top-[20%] right-[-5%] w-[600px] h-[600px] bg-purple-500/15 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[10%] w-[800px] h-[800px] bg-blue-500/15 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-1">
          <h2 className="text-4xl font-black uppercase tracking-tighter">Стриминг <span className="text-neon">Плеер</span></h2>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Управление эфиром в реальном времени</p>
        </div>
        <Button 
          onClick={() => toast.success("Создание нового потока в разработке")}
          className="bg-neon text-black rounded-2xl px-8 font-black uppercase text-xs tracking-widest h-12 shadow-lg shadow-neon/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4 mr-2" /> Новый поток
        </Button>
      </div>

      {/* Active Stream Component */}
      <DashboardPlayer 
        locationName={firstLocationName} 
        locationId={dashboardData?.locations?.[0]?.id}
      />


      {/* Grid Layout for Playlists & Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-12">
        {/* Main Content: Playlists */}
        <div className="xl:col-span-2">
          {isLoading ? (
            <div className="space-y-6">
               <Skeleton className="h-[200px] bg-white/5 rounded-[2.5rem]" />
            </div>
          ) : (
          <PlaylistManager 
            playlists={playlists} 
            globalPlaylists={dashboardData?.globalPlaylists || []}
            businessId={businessId} 
          />
          )}
        </div>

        {/* Sidebar: Status & History */}
        <div id="play-history" className="space-y-8 h-full flex flex-col">
          <ConnectionStatus />
          <PlayHistory />
        </div>
      </div>

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
