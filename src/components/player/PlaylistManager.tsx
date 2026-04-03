"use client";

import { Button } from "@/components/ui/button";
import { ListMusic, Plus, Star, Filter, ArrowRight, Download, Play, X, Lock, Crown } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { usePlayerStore, Track } from "@/store/usePlayerStore";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPlaylistAction, getPlaylistByIdAction } from "@/lib/actions/playlists";
import { PlaylistBuilderModal } from "@/components/player/PlaylistBuilderModal";
import { cn } from "@/lib/utils";

export function PlaylistManager({ 
  playlists, 
  globalPlaylists = [],
  businessId,
  subscriptionStatus
}: { 
  playlists: any[], 
  globalPlaylists?: any[],
  businessId?: string,
  subscriptionStatus?: string
}) {
  const isSubscribed = subscriptionStatus === "ACTIVE";
  const categories = ["Энергичный", "Спокойный", "Фоновый", "Джаз", "Поп", "Рок"];
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [localPlaylists, setLocalPlaylists] = useState(playlists);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [builderPlaylist, setBuilderPlaylist] = useState<any | null>(null);
  const { loadPlaylist } = usePlayerStore();

  useEffect(() => {
    setLocalPlaylists(playlists);
  }, [playlists]);

  const handleCreate = async () => {
    if (!newPlaylistName.trim()) return;
    setIsCreating(true);

    const res = await createPlaylistAction({
      name: newPlaylistName,
      businessId: businessId
    });

    setIsCreating(false);

    if (res.success && res.data) {
      const newList = {
        id: res.data.id,
        name: res.data.name,
        trackCount: 0,
        duration: "0Ч 00М"
      };
      setLocalPlaylists([newList, ...localPlaylists]);
      setIsCreateOpen(false);
      setNewPlaylistName("");
      toast.success(`Плейлист "${newPlaylistName}" успешно создан`);
      setBuilderPlaylist(newList);
    } else {
      toast.error(res.error || "Ошибка создания плейлиста");
    }
  };

  const handlePlaylistEdit = async (playlist: any, isGlobal: boolean = false) => {
    if (isGlobal) {
      toast.info("Глобальные плейлисты нельзя редактировать");
      return;
    }
    
    if (playlist.id === 'starred') {
      toast.info("Эта функция встроенного плейлиста");
      return;
    }
    
    if (playlist.trackCount === 0) {
      setBuilderPlaylist({ ...playlist, initialTrackIds: [] });
    } else {
      toast("Загрузка редактора...");
      const res = await getPlaylistByIdAction(playlist.id);
      if (res.success && res.data?.tracks) {
        const trackIds = res.data.tracks.map((t: any) => t.trackId);
        setBuilderPlaylist({ ...playlist, initialTrackIds: trackIds });
      } else {
        toast.error("Ошибка загрузки данных");
      }
    }
  };

  const handlePlaylistPlay = async (e: React.MouseEvent, playlist: any) => {
    e.stopPropagation();
    
    if (playlist.id === 'starred') {
      toast.info("Избранное — скоро появится!");
      return;
    }

    if (playlist.trackCount === 0) {
      toast.error("В этом плейлисте пока нет треков!");
      return;
    }
    
    toast("Загрузка треков...");
    const res = await getPlaylistByIdAction(playlist.id);
      
    if (res.success && res.data?.tracks) {
      if (res.data.tracks.length === 0) {
         toast.error("В этом плейлисте пока нет треков!");
         return;
      }
      const tracks = res.data.tracks.map((t: any) => ({
        ...t.track,
        cover_url: t.track.cover_url || undefined,
      }));
      loadPlaylist(tracks);
    } else {
      toast.error("Ошибка загрузки плейлиста");
    }
  };

  const PlaylistCard = ({ list, isGlobal = false }: { list: any, isGlobal?: boolean }) => {
    const isLocked = !isSubscribed;

    return (
      <div 
        onClick={() => !isLocked && handlePlaylistEdit(list, isGlobal)}
        className={cn(
          "glass-dark border group transition-all duration-500 cursor-pointer relative overflow-hidden",
          // Mobile: compact horizontal row
          "flex flex-row items-center gap-3 p-3 rounded-2xl h-auto",
          // Desktop: tall card with proper spacing
          "sm:flex-col sm:p-7 sm:rounded-[2.5rem] sm:min-h-[240px]",
          isGlobal 
            ? "border-purple-500/10 hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]" 
            : "border-white/5 hover:border-neon/40 hover:shadow-[0_0_30px_rgba(34,197,94,0.05)]",
          isLocked && "cursor-default border-white/5 grayscale-[0.5] opacity-80"
        )}
      >
        {/* Card Glow Effect - Desktop */}
        <div className={cn(
          "absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-700",
          isGlobal ? "bg-purple-500/10" : "bg-neon/5"
        )} />

        {/* Badge - desktop only, positioned top-right */}
        <div className="hidden sm:block absolute top-5 right-6 z-20">
          {isGlobal ? (
            <div className="px-3 py-1 bg-purple-500/10 text-purple-300 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-purple-500/20 backdrop-blur-md shadow-sm">
              Официальный
            </div>
          ) : (
            <div className="px-3 py-1 bg-white/5 text-neutral-400 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-white/10 backdrop-blur-md shadow-sm group-hover:border-neon/30 group-hover:text-neon transition-colors">
              Ваш Плейлист
            </div>
          )}
        </div>

        {/* Icon Pedestal */}
        <div className={cn(
          "shrink-0 rounded-xl flex items-center justify-center border transition-all duration-500 shadow-inner",
          "w-11 h-11 sm:w-14 sm:h-14 sm:rounded-[1.1rem] sm:mb-3 sm:mt-1",
          isGlobal 
            ? "bg-purple-500/10 border-purple-500/20 group-hover:bg-purple-500/20 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]" 
            : "bg-white/5 border-white/10 group-hover:bg-white/10 group-hover:scale-110 group-hover:border-neon/30 group-hover:shadow-[0_0_15px_rgba(34,197,94,0.1)]"
        )}>
          <ListMusic className={cn("w-5 h-5 sm:w-7 sm:h-7", isGlobal ? "text-purple-400" : "text-white/80 group-hover:text-white")} />
        </div>

        {/* Info */}
        <div className={cn("flex-1 min-w-0 sm:flex-1 sm:flex sm:flex-col sm:justify-center sm:items-center sm:text-center", isLocked && "sm:blur-[1px] sm:opacity-50 transition-all")}>
          <h4 className={cn(
            "font-black uppercase tracking-tight text-white leading-tight truncate w-full",
            "text-sm sm:text-xl sm:mb-2 group-hover:translate-y-[-2px] transition-transform duration-500"
          )}>{list.name}</h4>
          <div className="flex items-center gap-2 sm:justify-center flex-wrap">
            <span className="text-neutral-500 text-[10px] sm:text-[10px] font-black uppercase tracking-widest tabular-nums">
              {list.trackCount} ТРЕКОВ
            </span>
            <span className="text-white/10 hidden sm:inline">•</span>
            <span className="text-neutral-500 text-[10px] sm:text-[10px] font-black uppercase tracking-widest tabular-nums">
              {list.duration || "0Ч 00М"}
            </span>
          </div>
        </div>

        {/* Play / Lock Button */}
        <div className="shrink-0 relative z-10 sm:mt-auto">
          {!isLocked ? (
            <Button 
              onClick={(e) => handlePlaylistPlay(e, list)}
              variant="ghost" 
              size="icon" 
              className={cn(
                "w-10 h-10 sm:w-12 sm:h-12 transition-all duration-500 rounded-full",
                isGlobal 
                  ? "bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-black shadow-[0_0_20px_rgba(168,85,247,0.2)] border border-purple-500/20" 
                  : "bg-white/5 text-white/80 hover:bg-white hover:text-black border border-white/10 hover:border-white shadow-xl"
              )}
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />
            </Button>
          ) : (
            <div className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border backdrop-blur-sm",
              isGlobal ? "bg-purple-500/5 border-purple-500/10 text-purple-900/40" : "bg-white/5 border-white/5 text-neutral-800"
            )}>
               <Lock className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Premium Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 z-20 hidden sm:flex flex-col items-center justify-center bg-black/60 backdrop-blur-[8px] p-4 text-center opacity-0 group-hover:opacity-100 transition-all duration-500">
             <div className="space-y-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center border mx-auto shadow-2xl",
                  isGlobal ? "bg-purple-500/20 border-purple-500/30 text-purple-400" : "bg-neon/20 border-neon/30 text-neon"
                )}>
                   <Crown className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                   <p className={cn(
                     "text-[10px] font-black uppercase tracking-[0.2em]",
                     isGlobal ? "text-purple-300" : "text-neon"
                   )}>
                     Требуется Elite-подписка
                   </p>
                   <Link 
                     href="/dashboard/subscription"
                     className="inline-block px-4 py-1.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
                   >
                     Активировать
                   </Link>
                </div>
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-12">
      {/* Smart Filters */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 custom-scrollbar px-2">
        <div className="flex items-center justify-center bg-white/5 p-3 rounded-xl border border-white/10 shrink-0">
          <Filter className="w-5 h-5 text-neutral-400" />
        </div>
        {categories.map((cat, i) => (
          <Button 
            key={i} 
            onClick={() => setActiveFilter(activeFilter === cat ? null : cat)}
            variant="outline" 
            className={`rounded-xl font-bold tracking-wide shrink-0 transition-colors ${
              activeFilter === cat 
                ? 'bg-neon/20 border-neon/50 text-neon'
                : 'border-white/10 text-neutral-300 hover:text-white hover:border-white/30 hover:bg-white/5'
            }`}
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Global (Official) Playlists Section */}
      {globalPlaylists.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            <h3 className="text-lg sm:text-2xl lg:text-2xl font-black uppercase tracking-tighter">Кураторские <span className="text-purple-400">Подборки</span></h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
            {globalPlaylists.map((list: any) => (
              <div key={list.id} className="">
                <PlaylistCard list={list} isGlobal={true} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* User Playlists Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center justify-between px-0">
          <div className="flex items-center gap-3 px-2 sm:px-0">
            <div className="w-2 h-2 rounded-full bg-neon shadow-[0_0_10px_rgba(92,243,135,0.5)]" />
            <h3 className="text-lg sm:text-2xl lg:text-2xl font-black uppercase tracking-tighter">Ваши <span className="text-neon">Плейлисты</span></h3>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
            <Button 
              onClick={() => {
                if (!isSubscribed) {
                  toast.error("Доступно только по подписке");
                  return;
                }
                toast("Загрузка шаблонов...");
              }}
              variant="outline" 
              className={cn(
                "rounded-xl sm:rounded-2xl px-4 sm:px-6 font-black uppercase text-[10px] sm:text-xs tracking-widest h-10 sm:h-12 transition-all shrink-0",
                isSubscribed 
                  ? "border-neon/20 text-neon hover:bg-neon/10" 
                  : "border-white/5 text-neutral-600 cursor-not-allowed"
              )}
            >
              {!isSubscribed && <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2 opacity-50" />}
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> <span className="hidden sm:inline">Шаблоны</span>
            </Button>
            <Button 
              onClick={() => {
                if (!isSubscribed) {
                  toast.error("Доступно только по подписке");
                   return;
                }
                setIsCreateOpen(true);
              }}
              className={cn(
                "rounded-xl sm:rounded-2xl px-4 sm:px-6 font-black uppercase text-[10px] sm:text-xs tracking-widest h-10 sm:h-12 transition-all shrink-0",
                isSubscribed 
                  ? "bg-white text-black hover:scale-105" 
                  : "bg-white/5 text-neutral-600 cursor-not-allowed"
              )}
            >
              {!isSubscribed && <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1.5 sm:mr-2 opacity-50" />}
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> <span className="hidden sm:inline">Создать</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
          {/* Favorite Card */}
          <div className={cn(
            "glass-dark border border-neon/20 group hover:border-neon/50 hover:shadow-[0_0_30px_rgba(34,197,94,0.1)] transition-all duration-500 relative overflow-hidden",
            "flex flex-row items-center gap-3 p-3 rounded-2xl h-auto",
            "sm:flex-col sm:p-7 sm:rounded-[2.5rem] sm:min-h-[240px]"
          )}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            
            {/* Badge - desktop only */}
            <div className="hidden sm:block absolute top-5 right-6 z-20 px-3 py-1 bg-neon/20 text-neon rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-neon/30 backdrop-blur-md shadow-sm">
              Любимый
            </div>

            {/* Icon Pedestal */}
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-[1.1rem] flex items-center justify-center border border-neon/30 bg-neon/10 backdrop-blur-sm z-10 shrink-0 sm:mb-3 sm:mt-1 transition-transform group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] shadow-inner">
              <Star className="w-5 h-5 sm:w-7 sm:h-7 text-neon fill-neon" />
            </div>

            {/* Info */}
            <div className={cn("flex-1 min-w-0 z-10 sm:flex sm:flex-col sm:justify-center sm:items-center sm:text-center", !isSubscribed && "sm:blur-[1px] sm:opacity-50")}>
              <h4 className="text-sm sm:text-xl font-black uppercase tracking-tight text-white sm:mb-2 truncate w-full group-hover:translate-y-[-2px] transition-transform duration-500">Избранное</h4>
              <p className="text-neon text-[10px] sm:text-[10px] font-black uppercase tracking-[0.25em] tabular-nums">СКОРО</p>
            </div>

            {/* Play/Lock */}
            <div className="shrink-0 z-10 sm:mt-auto">
              {!isSubscribed ? (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-neon/10 bg-neon/5 flex items-center justify-center text-neon/20 backdrop-blur-sm">
                   <Lock className="w-4 h-4" />
                </div>
              ) : (
                <Button 
                  onClick={(e) => handlePlaylistPlay(e, { id: 'starred', name: 'Избранное', trackCount: 34 })}
                  variant="ghost" 
                  size="icon" 
                  className="bg-white/5 border border-white/10 hover:bg-neon hover:text-black hover:border-neon text-white rounded-full h-10 w-10 sm:h-12 sm:w-12 transition-all duration-500 group-hover:scale-110 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)] shadow-lg"
                >
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </Button>
              )}
            </div>
            
            {!isSubscribed && (
              <div className="absolute inset-0 z-30 hidden sm:flex flex-col items-center justify-center bg-black/60 backdrop-blur-[8px] p-4 text-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                <div className="space-y-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="w-12 h-12 bg-neon/20 rounded-2xl flex items-center justify-center border border-neon/30 text-neon mx-auto shadow-2xl">
                      <Crown className="w-6 h-6" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neon">Только с подпиской</p>
                      <Link 
                        href="/dashboard/subscription"
                        className="inline-block px-4 py-1.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
                      >
                        Активировать
                      </Link>
                    </div>
                </div>
              </div>
            )}
          </div>

          {localPlaylists.length > 0 ? (
            localPlaylists.map((list: any) => (
              <PlaylistCard key={list.id} list={list} />
            ))
          ) : (
            <div 
              onClick={() => setIsCreateOpen(true)}
              className="glass-dark border border-white/10 border-dashed flex items-center gap-3 p-3 rounded-2xl sm:flex-col sm:items-center sm:justify-center sm:text-center sm:p-8 sm:rounded-[2.5rem] sm:h-[200px] hover:bg-white/5 hover:border-white/20 transition-colors cursor-pointer group"
            >
               <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 flex items-center justify-center sm:mb-4 group-hover:scale-110 transition-transform shrink-0">
                 <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-400 group-hover:text-white transition-colors" />
               </div>
               <div>
                 <h4 className="text-white font-bold text-sm sm:text-lg">Создать плейлист</h4>
                 <p className="text-neutral-500 text-[10px] sm:text-xs">Начните с чистого листа</p>
               </div>
            </div>
          )}
        </div>
      </section>

      {/* Create Playlist Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-dark border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-2xl shadow-neon/5 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Новый плейлист</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-white" onClick={() => setIsCreateOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
               <div>
                 <Label className="text-neutral-400 text-xs font-bold uppercase tracking-widest mb-2 block">Название плейлиста</Label>
                 <Input 
                   value={newPlaylistName}
                   onChange={(e) => setNewPlaylistName(e.target.value)}
                   placeholder="Например: Утренний кофе"
                   className="bg-white/5 border-white/10 text-white placeholder:text-neutral-600 focus-visible:ring-neon h-14 rounded-2xl text-lg font-bold"
                   autoFocus
                   onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                 />
               </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button variant="ghost" className="text-neutral-400 hover:text-white rounded-xl font-bold tracking-wide" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
                ОТМЕНА
              </Button>
              <Button className="bg-neon text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform shadow-[0_0_15px_rgba(92,243,135,0.3)]" onClick={handleCreate} disabled={isCreating}>
                {isCreating ? "СОЗДАНИЕ..." : "СОХРАНИТЬ"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Playlist Builder Modal */}
      {builderPlaylist && (
        <PlaylistBuilderModal 
          playlistId={builderPlaylist.id}
          playlistName={builderPlaylist.name}
          initialTrackIds={builderPlaylist.initialTrackIds}
          onClose={() => setBuilderPlaylist(null)}
          onSuccess={() => {
            // Dashboard query is invalidated by the modal; playlist stats are refreshed from server.
          }}
        />
      )}
    </div>
  );
}
