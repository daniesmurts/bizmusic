"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  ListMusic, 
  Settings,
  Plus,
  ArrowRight,
  MapPin,
  ChevronDown,
  Check
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
import { WaveControls } from "@/components/player/WaveControls";
import { TrackBrowser } from "@/components/player/TrackBrowser";
import { toast } from "sonner";
import { usePlayerStore } from "@/store/usePlayerStore";

export default function PlayerPage() {
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const setActiveLocationId = usePlayerStore((state) => state.setActiveLocationId);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard-data"],
    queryFn: async () => {
      const result = await getDashboardDataAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const playlists = dashboardData?.playlists || [];
  const locations = dashboardData?.locations || [];
  const businessId = dashboardData?.businessId;

  useEffect(() => {
    if (!locations.length) {
      setSelectedLocationId("");
      setActiveLocationId(null);
      return;
    }

    const hasSelected = locations.some((location) => location.id === selectedLocationId);
    if (!hasSelected) {
      const fallbackLocationId = locations[0].id;
      setSelectedLocationId(fallbackLocationId);
      setActiveLocationId(fallbackLocationId);
    }
  }, [locations, selectedLocationId, setActiveLocationId]);

  const selectedLocation = useMemo(() => {
    if (!locations.length) return null;
    return locations.find((location) => location.id === selectedLocationId) ?? locations[0];
  }, [locations, selectedLocationId]);

  useEffect(() => {
    setActiveLocationId(selectedLocation?.id ?? null);
  }, [selectedLocation?.id, setActiveLocationId]);

  // Close location dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(e.target as Node)) {
        setIsLocationOpen(false);
      }
    }
    if (isLocationOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isLocationOpen]);

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocationId(locationId);
    setActiveLocationId(locationId || null);
    setIsLocationOpen(false);
  };

  return (
    <div className="space-y-12 animate-fade-in relative z-0 min-h-screen">
      {/* Background gradients for depth - enhanced for brighter accents */}
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] bg-neon/15 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed top-[20%] right-[-5%] w-[600px] h-[600px] bg-purple-500/15 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[10%] w-[800px] h-[800px] bg-blue-500/15 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter">Стриминг <span className="text-neon">Плеер</span></h2>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Управление эфиром в реальном времени</p>
          {locations.length > 0 && (
            <div className="relative" ref={locationDropdownRef}>
              <button
                onClick={() => setIsLocationOpen(!isLocationOpen)}
                className={cn(
                  "flex items-center gap-3 w-full sm:w-auto min-w-[240px] h-12 rounded-2xl border px-4 transition-all",
                  isLocationOpen
                    ? "border-neon/40 bg-neon/5"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                )}
              >
                <MapPin className="w-4 h-4 text-neon shrink-0" />
                <span className="text-sm font-black uppercase tracking-widest text-white truncate flex-1 text-left">
                  {selectedLocation?.name || "Выберите филиал"}
                </span>
                <ChevronDown className={cn(
                  "w-4 h-4 text-neutral-400 transition-transform shrink-0",
                  isLocationOpen && "rotate-180"
                )} />
              </button>

              {isLocationOpen && (
                <div className="absolute top-full left-0 right-0 sm:right-auto mt-2 z-30 min-w-[280px] glass-dark border border-white/10 rounded-2xl p-2 shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-2 duration-200">
                  {locations.map((location) => {
                    const isActive = location.id === selectedLocation?.id;
                    return (
                      <button
                        key={location.id}
                        onClick={() => handleLocationSelect(location.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                          isActive
                            ? "bg-neon/10 text-neon border border-neon/20"
                            : "text-white hover:bg-white/5 border border-transparent"
                        )}
                      >
                        <MapPin className={cn("w-4 h-4 shrink-0", isActive ? "text-neon" : "text-neutral-500")} />
                        <span className="text-xs font-black uppercase tracking-widest truncate flex-1">{location.name}</span>
                        {isActive && <Check className="w-4 h-4 text-neon shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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
        locationName={selectedLocation?.name || "—"} 
        locationId={selectedLocation?.id}
      />

      {businessId && (
        <WaveControls 
          businessId={businessId} 
          subscriptionStatus={dashboardData?.stats?.licenseStatus || "INACTIVE"}
        />
      )}

      {/* Music Catalog Browser */}
      <TrackBrowser />

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
            subscriptionStatus={dashboardData?.stats?.licenseStatus || "INACTIVE"}
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
