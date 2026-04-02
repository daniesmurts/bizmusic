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
          "glass-dark border group transition-all cursor-pointer relative overflow-hidden",
          // Mobile: compact horizontal row
          "flex flex-row items-center gap-3 p-3 rounded-2xl h-auto",
          // Desktop: tall card
          "md:flex-col md:justify-between md:p-6 md:rounded-[2.5rem] md:h-[200px]",
          isGlobal ? "border-purple-500/20 hover:border-purple-500/40" : "border-white/10 hover:border-white/20",
          isLocked && "cursor-default border-white/5"
        )}
      >
        {isGlobal && (
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none hidden md:block" />
        )}

        {/* Mobile Layout: icon | info | play */}
        {/* Desktop Layout: icon + badge top, name + play bottom */}

        {/* Icon */}
        <div className={cn(
          "shrink-0 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110",
          "w-10 h-10 md:w-14 md:h-14 md:rounded-2xl",
          isGlobal ? "bg-purple-500/10 border-purple-500/20" : "bg-white/5 border-white/5 group-hover:bg-white/10"
        )}>
          <ListMusic className={cn("w-5 h-5 md:w-7 md:h-7", isGlobal ? "text-purple-400" : "text-white")} />
        </div>

        {/* Badge - desktop only, positioned top-right */}
        <div className="hidden md:block absolute top-6 right-6 z-10">
          {isGlobal ? (
            <div className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-[9px] font-black uppercase tracking-widest border border-purple-500/30">
              Официальный
            </div>
          ) : (
            <div className="px-3 py-1 bg-neon/10 text-neon rounded-full text-[9px] font-black uppercase tracking-widest border border-neon/20">
              Ваш Плейлист
            </div>
          )}
        </div>

        {/* Info */}
        <div className={cn("flex-1 min-w-0", isLocked && "md:blur-[2px] md:opacity-40 transition-all")}>
          <h4 className={cn(
            "font-black uppercase tracking-tight text-white leading-tight truncate",
            "text-sm md:text-xl md:mb-1"
          )}>{list.name}</h4>
          <p className="text-neutral-500 text-[10px] md:text-xs font-bold uppercase tracking-widest">{list.trackCount} ТРЕКОВ • {list.duration || "0Ч 00М"}</p>
        </div>

        {/* Play / Lock Button */}
        <div className="shrink-0 relative z-10">
          {!isLocked ? (
            <Button 
              onClick={(e) => handlePlaylistPlay(e, list)}
              variant="ghost" 
              size="icon" 
              className={cn(
                "w-9 h-9 md:w-10 md:h-10 transition-all group-hover:scale-110",
                isGlobal ? "text-purple-400 hover:text-purple-300" : "group-hover:text-white text-neutral-500"
              )}
            >
              <Play className="w-5 h-5 md:w-6 md:h-6 fill-current" />
            </Button>
          ) : (
            <div className={cn(
              "w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center border",
              isGlobal ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-neon/10 border-neon/20 text-neon"
            )}>
               <Lock className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
          )}
        </div>

        {/* Premium Lock Overlay - desktop only full card overlay, mobile inline lock icon suffices */}
        {isLocked && (
          <div className="absolute inset-0 z-20 hidden md:flex flex-col items-center justify-center bg-black/40 backdrop-blur-[4px] p-4 text-center animate-fade-in group-hover:bg-black/50 transition-all duration-500">
             <div className="space-y-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border mx-auto transition-transform group-hover:scale-110",
                  isGlobal ? "bg-purple-500/20 border-purple-500/30 text-purple-400" : "bg-neon/20 border-neon/30 text-neon"
                )}>
                   <Crown className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                   <p className={cn(
                     "text-[9px] font-black uppercase tracking-[0.2em]",
                     isGlobal ? "text-purple-300" : "text-neon/80"
                   )}>
                     Нужна подписка
                   </p>
                   <Link 
                     href="/dashboard/subscription"
                     className="text-[10px] font-bold uppercase tracking-widest text-white hover:text-neon underline underline-offset-4 decoration-neon/50 transition-colors"
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
            <h3 className="text-2xl font-black uppercase tracking-tighter">Кураторские <span className="text-purple-400">Подборки</span></h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory custom-scrollbar md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0">
            {globalPlaylists.map((list: any) => (
              <div key={list.id} className="min-w-[260px] snap-start md:min-w-0">
                <PlaylistCard list={list} isGlobal={true} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* User Playlists Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 px-2">
            <div className="w-2 h-2 rounded-full bg-neon shadow-[0_0_10px_rgba(92,243,135,0.5)]" />
            <h3 className="text-2xl font-black uppercase tracking-tighter">Ваши <span className="text-neon">Плейлисты</span></h3>
          </div>
          <div className="flex items-center gap-3">
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
                "rounded-2xl px-6 font-black uppercase text-xs tracking-widest h-12 transition-all",
                isSubscribed 
                  ? "border-neon/20 text-neon hover:bg-neon/10" 
                  : "border-white/5 text-neutral-600 cursor-not-allowed"
              )}
            >
              {!isSubscribed && <Lock className="w-3 h-3 mr-2 opacity-50" />}
              <Download className="w-4 h-4 mr-2" /> Шаблоны
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
                "rounded-2xl px-6 font-black uppercase text-xs tracking-widest h-12 transition-all",
                isSubscribed 
                  ? "bg-white text-black hover:scale-105" 
                  : "bg-white/5 text-neutral-600 cursor-not-allowed"
              )}
            >
              {!isSubscribed && <Lock className="w-3 h-3 mr-2 opacity-50" />}
              <Plus className="w-4 h-4 mr-2" /> Создать
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
          {/* Favorite Card */}
          <div className={cn(
            "glass-dark border border-neon/30 group hover:border-neon/60 hover:shadow-[0_0_30px_rgba(92,243,135,0.1)] transition-all relative overflow-hidden",
            "flex flex-row items-center gap-3 p-3 rounded-2xl h-auto",
            "md:flex-col md:justify-between md:p-6 md:rounded-[2.5rem] md:h-[200px]"
          )}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon/10 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none hidden md:block" />
            
            {/* Icon */}
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center border border-neon/20 bg-neon/10 backdrop-blur-sm z-10 shrink-0">
              <Star className="w-5 h-5 md:w-7 md:h-7 text-neon fill-neon" />
            </div>

            {/* Badge - desktop only */}
            <div className="hidden md:block absolute top-6 right-6 z-10 px-3 py-1 bg-neon/20 text-neon rounded-full text-[10px] font-black uppercase tracking-widest border border-neon/30">
              Любимый
            </div>

            {/* Info */}
            <div className={cn("flex-1 min-w-0 z-10", !isSubscribed && "md:blur-[2px] md:opacity-40")}>
              <h4 className="text-sm md:text-xl font-black uppercase tracking-tight text-white md:mb-1 shadow-sm truncate">Избранное</h4>
              <p className="text-neon text-[10px] md:text-xs font-bold uppercase tracking-widest">СКОРО</p>
            </div>

            {/* Play/Lock */}
            <div className="shrink-0 z-10">
              {!isSubscribed ? (
                <div className="w-9 h-9 md:w-12 md:h-12 rounded-full border border-neon/20 bg-neon/10 flex items-center justify-center text-neon">
                   <Lock className="w-3.5 h-3.5 md:w-5 md:h-5" />
                </div>
              ) : (
                <Button 
                  onClick={(e) => handlePlaylistPlay(e, { id: 'starred', name: 'Избранное', trackCount: 34 })}
                  variant="ghost" 
                  size="icon" 
                  className="hover:text-neon text-white bg-white/5 hover:bg-white/10 rounded-full h-9 w-9 md:h-12 md:w-12 transition-all group-hover:scale-110"
                >
                  <Play className="w-4 h-4 md:w-5 md:h-5 fill-current ml-0.5" />
                </Button>
              )}
            </div>
            
            {!isSubscribed && (
              <div className="absolute inset-0 z-20 hidden md:flex flex-col items-center justify-center bg-black/40 backdrop-blur-[4px] p-4 text-center animate-fade-in group-hover:bg-black/50 transition-all duration-500">
                <div className="space-y-3">
                    <div className="w-10 h-10 bg-neon/20 rounded-xl flex items-center justify-center border border-neon/30 text-neon mx-auto transition-transform group-hover:scale-110">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neon/80">Только с подпиской</p>
                      <Link 
                        href="/dashboard/subscription"
                        className="text-[10px] font-bold uppercase tracking-widest text-white hover:text-neon underline underline-offset-4 decoration-neon/50 transition-colors"
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
              className="glass-dark border border-white/10 border-dashed flex items-center gap-3 p-3 rounded-2xl md:flex-col md:items-center md:justify-center md:text-center md:p-8 md:rounded-[2.5rem] md:h-[200px] hover:bg-white/5 hover:border-white/20 transition-colors cursor-pointer group"
            >
               <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/5 flex items-center justify-center md:mb-4 group-hover:scale-110 transition-transform shrink-0">
                 <Plus className="w-5 h-5 md:w-6 md:h-6 text-neutral-400 group-hover:text-white transition-colors" />
               </div>
               <div>
                 <h4 className="text-white font-bold text-sm md:text-lg">Создать плейлист</h4>
                 <p className="text-neutral-500 text-[10px] md:text-xs">Начните с чистого листа</p>
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
