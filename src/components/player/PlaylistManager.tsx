"use client";

import { Button } from "@/components/ui/button";
import { ListMusic, Plus, Star, Filter, ArrowRight, Download, Play, X } from "lucide-react";
import { toast } from "sonner";
import { usePlayerStore, Track } from "@/store/usePlayerStore";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPlaylistAction, getPlaylistByIdAction } from "@/lib/actions/playlists";
import { PlaylistBuilderModal } from "@/components/player/PlaylistBuilderModal";

export function PlaylistManager({ playlists, businessId }: { playlists: any[], businessId?: string }) {
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
      // Automatically open the builder for the new playlist
      setBuilderPlaylist(newList);
    } else {
      toast.error(res.error || "Ошибка создания плейлиста");
    }
  };

  const handlePlaylistEdit = async (playlist: any) => {
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

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
        <h3 className="text-2xl font-black uppercase tracking-tighter px-2">Ваши <span className="text-neon">Плейлисты</span></h3>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => toast("Загрузка шаблонов...")}
            variant="outline" 
            className="border-neon/20 text-neon hover:bg-neon/10 rounded-2xl px-6 font-black uppercase text-xs tracking-widest h-12"
          >
            <Download className="w-4 h-4 mr-2" /> Шаблоны
          </Button>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-white text-black rounded-2xl px-6 font-black uppercase text-xs tracking-widest h-12 hover:scale-105 transition-transform"
          >
            <Plus className="w-4 h-4 mr-2" /> Создать
          </Button>
        </div>
      </div>

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

      {/* Playlists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Starred / Favorite Playlist Hook Example */}
        <div className="glass-dark border border-neon/30 p-6 rounded-[2.5rem] flex flex-col justify-between group hover:border-neon/60 hover:shadow-[0_0_30px_rgba(92,243,135,0.1)] transition-all relative overflow-hidden h-[200px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-neon/10 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="flex justify-between items-start">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-neon/20 bg-neon/10 backdrop-blur-sm z-10">
                <Star className="w-7 h-7 text-neon fill-neon" />
            </div>
            <div className="px-3 py-1 bg-neon/20 text-neon rounded-full text-[10px] font-black uppercase tracking-widest border border-neon/30 z-10">
              Любимый
            </div>
          </div>
          <div className="mt-auto flex justify-between items-end z-10">
            <div>
              <h4 className="text-xl font-black uppercase tracking-tight text-white mb-1 shadow-sm">Избранное</h4>
              <p className="text-neon text-xs font-bold uppercase tracking-widest">СКОРО</p>
            </div>
            <Button 
              onClick={(e) => handlePlaylistPlay(e, { id: 'starred', name: 'Избранное', trackCount: 34 })}
              variant="ghost" 
              size="icon" 
              className="hover:text-neon text-white bg-white/5 hover:bg-white/10 rounded-full h-12 w-12 transition-all group-hover:scale-110"
            >
              <Play className="w-5 h-5 fill-current ml-1" />
            </Button>
          </div>
        </div>

        {localPlaylists.length > 0 ? (
          localPlaylists.map((list: any) => (
            <div 
              key={list.id} 
              onClick={() => handlePlaylistEdit(list)}
              className="glass-dark border border-white/10 p-6 rounded-[2.5rem] flex flex-col justify-between group hover:border-white/20 transition-all h-[200px] cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5 bg-white/5 transition-transform group-hover:scale-110 group-hover:bg-white/10">
                  <ListMusic className="w-7 h-7 text-white" />
              </div>
              <div className="mt-auto flex justify-between items-end">
                <div>
                  <h4 className="text-xl font-black uppercase tracking-tight text-white mb-1 leading-tight">{list.name}</h4>
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">{list.trackCount} ТРЕКОВ • {list.duration || "2Ч 15М"}</p>
                </div>
                <Button 
                  onClick={(e) => handlePlaylistPlay(e, list)}
                  variant="ghost" 
                  size="icon" 
                  className="group-hover:text-white text-neutral-500 transition-colors"
                >
                  <Play className="w-6 h-6 fill-current" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div 
            onClick={() => setIsCreateOpen(true)}
            className="glass-dark border border-white/10 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center text-center p-8 h-[200px] hover:bg-white/5 hover:border-white/20 transition-colors cursor-pointer group"
          >
             <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               <Plus className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
             </div>
             <h4 className="text-white font-bold text-lg">Создать плейлист</h4>
             <p className="text-neutral-500 text-xs">Начните с чистого листа</p>
          </div>
        )}
      </div>

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
            // Optimistically update the track count to > 0 so the user can play it immediately
            setLocalPlaylists(localPlaylists.map(p => 
              p.id === builderPlaylist.id ? { ...p, trackCount: p.trackCount || 1 /* trigger play mode */ } : p
            ));
          }}
        />
      )}
    </div>
  );
}
