"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTracksAction } from "@/lib/actions/tracks";
import { updatePlaylistTracksAction } from "@/lib/actions/playlists";
import { Button } from "@/components/ui/button";
import { X, Search, Plus, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { Track } from "@/store/usePlayerStore";

interface PlaylistBuilderModalProps {
  playlistId: string;
  playlistName: string;
  initialTrackIds?: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export function PlaylistBuilderModal({ playlistId, playlistName, initialTrackIds = [], onClose, onSuccess }: PlaylistBuilderModalProps) {
  const [search, setSearch] = useState("");
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set(initialTrackIds));
  const queryClient = useQueryClient();

  const { data: trackData, isLoading } = useQuery({
    queryKey: ["tracks"],
    queryFn: async () => {
      const res = await getTracksAction();
      if (!res.success) throw new Error(res.error);
      return res.data as any[];
    }
  });

  const { mutate: saveTracks, isPending } = useMutation({
    mutationFn: async () => {
      const res = await updatePlaylistTracksAction(playlistId, Array.from(selectedTrackIds));
      if (!res.success) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      toast.success("Треки успешно добавлены в плейлист!");
      queryClient.invalidateQueries({ queryKey: ["dashboard-data"] });
      onSuccess();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "Ошибка сохранения плейлиста");
    }
  });

  const toggleTrack = (id: string) => {
    const newSet = new Set(selectedTrackIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedTrackIds(newSet);
  };

  const filteredTracks = (trackData || []).filter((t: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const searchable = [
      t.title,
      t.artist,
      t.genre,
      ...(t.moodTags || []),
      t.bpm?.toString()
    ].filter(Boolean).join(" ").toLowerCase();
    
    return searchable.includes(s);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-dark border border-white/10 rounded-[2rem] p-8 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl shadow-neon/5 relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Редактор плейлиста</h3>
            <p className="text-neon text-xs font-bold uppercase tracking-widest">{playlistName}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-white" onClick={onClose} disabled={isPending}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск треков или артистов..."
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-neutral-600 focus-visible:ring-neon h-12 rounded-2xl font-bold"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2 mb-6 min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500 space-y-4">
               <Loader2 className="w-8 h-8 animate-spin text-neon" />
               <p className="text-sm font-bold uppercase tracking-widest">Загрузка библиотеки...</p>
            </div>
          ) : filteredTracks.length > 0 ? (
            filteredTracks.map((track: any) => (
              <div 
                key={track.id} 
                onClick={() => toggleTrack(track.id)}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-colors cursor-pointer ${
                  selectedTrackIds.has(track.id) 
                    ? "bg-neon/10 border-neon/30" 
                    : "border-transparent hover:bg-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex flex-col gap-1 w-full max-w-[80%] pr-4">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-white leading-tight">{track.title}</div>
                    {track.isAnnouncement && (
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] font-black uppercase tracking-widest bg-neon/10 text-neon px-1.5 py-0.5 rounded border border-neon/20">
                          Анонс
                        </span>
                        {track.provider && (
                          <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                            track.provider === 'google' 
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {track.provider === 'google' ? 'Google' : 'Salute'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-neutral-500">{track.artist || "Голосовое сообщение"}</div>
                  {(track.genre || (track.moodTags && track.moodTags.length > 0) || track.bpm) && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {track.genre && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/5 text-neutral-400 border border-white/10">{track.genre}</span>
                      )}
                      {track.bpm && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/5 text-neutral-400 border border-white/10">{track.bpm} BPM</span>
                      )}
                      {track.moodTags?.map((tag: string) => (
                        <span key={tag} className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-neon/10 text-neon/80 border border-neon/20">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors flex-shrink-0 ${
                  selectedTrackIds.has(track.id) ? "bg-neon text-black border-neon" : "border-white/10 text-neutral-400 bg-white/5"
                }`}>
                  {selectedTrackIds.has(track.id) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-center text-neutral-500 text-sm font-medium">
               По вашему запросу ничего не найдено
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-white/10">
          <div className="text-sm font-bold text-neutral-400">
            Выбрано: <span className="text-white">{selectedTrackIds.size}</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" className="text-neutral-400 hover:text-white rounded-xl font-bold" onClick={onClose} disabled={isPending}>
              ОТМЕНА
            </Button>
            <Button 
              className="bg-neon text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform" 
              onClick={() => saveTracks()}
              disabled={isPending || selectedTrackIds.size === 0}
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isPending ? "СОХРАНЕНИЕ..." : "СОХРАНИТЬ ТРЕКИ"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
