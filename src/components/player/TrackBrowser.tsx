"use client";

import { useQuery } from "@tanstack/react-query";
import { getTracksAction } from "@/lib/actions/tracks";
import { Input } from "@/components/ui/input";
import {
  Search,
  Play,
  Pause,
  ListPlus,
  Loader2,
  Library,
  ChevronDown,
  ChevronUp,
  Music,
  X,
} from "lucide-react";
import { useState, useRef } from "react";
import { usePlayerStore, Track } from "@/store/usePlayerStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const MOOD_FILTERS = ["Энергичный", "Спокойный", "Фоновый", "Романтичный", "Весёлый", "Грустный"];
const GENRE_FILTERS = ["Джаз", "Поп", "Рок", "Электроника", "Классика", "Лаунж", "R&B"];

interface CatalogTrack {
  id: string;
  title: string;
  artist: string;
  fileUrl: string;
  streamUrl?: string;
  duration: number;
  cover_url?: string;
  genre?: string;
  bpm?: number;
  moodTags?: string[];
}

export function TrackBrowser() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { currentTrack, isPlaying, loadPlaylist, togglePlay, addToQueue } = usePlayerStore();

  const { data: tracks, isLoading } = useQuery<CatalogTrack[]>({
    queryKey: ["tracks-catalog"],
    queryFn: async () => {
      const res = await getTracksAction();
      if (!res.success) throw new Error(res.error);
      return (res.data || []) as CatalogTrack[];
    },
    enabled: isExpanded,
  });

  const filtered = (tracks || []).filter((t) => {
    if (search) {
      const s = search.toLowerCase();
      const searchable = [t.title, t.artist, t.genre, ...(t.moodTags || [])].filter(Boolean).join(" ").toLowerCase();
      if (!searchable.includes(s)) return false;
    }
    if (activeMood && !(t.moodTags || []).some((tag: string) => tag.toLowerCase() === activeMood.toLowerCase())) return false;
    if (activeGenre && t.genre?.toLowerCase() !== activeGenre.toLowerCase()) return false;
    return true;
  });

  const handlePlay = (track: CatalogTrack) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      const playlistTracks: Track[] = filtered.map((item) => ({
        id: item.id,
        title: item.title,
        artist: item.artist,
        fileUrl: item.fileUrl,
        streamUrl: item.streamUrl,
        duration: item.duration,
        cover_url: item.cover_url,
      }));
      const startIndex = Math.max(0, filtered.findIndex((item) => item.id === track.id));
      loadPlaylist(playlistTracks, startIndex);
    }
  };

  const handleAddToQueue = (track: CatalogTrack) => {
    addToQueue({
      id: track.id,
      title: track.title,
      artist: track.artist,
      fileUrl: track.fileUrl,
      streamUrl: track.streamUrl,
      duration: track.duration,
      cover_url: track.cover_url,
    });
    toast.success(`«${track.title}» добавлен в очередь`);
  };

  const clearFilters = () => {
    setSearch("");
    setActiveMood(null);
    setActiveGenre(null);
  };

  const hasActiveFilters = search || activeMood || activeGenre;

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between glass-dark border border-white/10 hover:border-white/20 rounded-2xl sm:rounded-[2rem] px-5 py-4 sm:px-8 sm:py-5 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
            <Library className="w-6 h-6 text-purple-400" />
          </div>
          <div className="text-left">
            <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">Каталог музыки</h3>
            <p className="text-neutral-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
              {isExpanded ? `${filtered.length} треков` : "Поиск и прослушивание всех треков"}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
        ) : (
          <ChevronDown className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="glass-dark border border-white/10 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию, артисту, жанру..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-neutral-600 focus-visible:ring-neon h-12 rounded-xl font-bold text-sm"
            />
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-600 shrink-0">Настроение:</span>
              {MOOD_FILTERS.map((mood) => (
                <button
                  key={mood}
                  onClick={() => setActiveMood(activeMood === mood ? null : mood)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors",
                    activeMood === mood
                      ? "bg-neon/20 border-neon/50 text-neon"
                      : "border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
                  )}
                >
                  {mood}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-600 shrink-0">Жанр:</span>
              {GENRE_FILTERS.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setActiveGenre(activeGenre === genre ? null : genre)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors",
                    activeGenre === genre
                      ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                      : "border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
                  )}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Track List */}
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar space-y-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-neutral-500 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-neon" />
                <p className="text-sm font-bold uppercase tracking-widest">Загрузка каталога...</p>
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((track) => {
                const isCurrentTrack = currentTrack?.id === track.id;
                const isTrackPlaying = isCurrentTrack && isPlaying;

                return (
                  <div
                    key={track.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all group",
                      isCurrentTrack
                        ? "bg-neon/5 border-neon/20"
                        : "border-transparent hover:bg-white/5 hover:border-white/5"
                    )}
                  >
                    {/* Play Button */}
                    <button
                      onClick={() => handlePlay(track)}
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 transition-all",
                        isCurrentTrack
                          ? "bg-neon text-black border-neon"
                          : "bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {isTrackPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5 fill-current" />
                      )}
                    </button>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-bold truncate",
                          isCurrentTrack ? "text-neon" : "text-white"
                        )}>
                          {track.title}
                        </span>
                        {isTrackPlaying && (
                          <div className="flex items-end gap-[2px] h-3">
                            <div className="w-[2px] bg-neon animate-[pulse_0.6s_ease-in-out_infinite] h-1" />
                            <div className="w-[2px] bg-neon animate-[pulse_0.6s_ease-in-out_infinite_0.15s] h-2" />
                            <div className="w-[2px] bg-neon animate-[pulse_0.6s_ease-in-out_infinite_0.3s] h-3" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 truncate">{track.artist}</p>
                    </div>

                    {/* Tags (hidden on small mobile) */}
                    <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                      {track.genre && (
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-white/5 text-neutral-500 border border-white/10">
                          {track.genre}
                        </span>
                      )}
                      {track.bpm && (
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-white/5 text-neutral-500 border border-white/10">
                          {track.bpm}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => handleAddToQueue(track)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/10 text-neutral-400 hover:text-neon hover:border-neon/30 hover:bg-neon/5 transition-all shrink-0 opacity-0 group-hover:opacity-100 sm:opacity-100"
                      title="Добавить в очередь"
                    >
                      <ListPlus className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                  <Music className="text-neutral-600 w-7 h-7" />
                </div>
                <p className="text-neutral-500 font-medium text-sm">Ничего не найдено</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-neon text-xs font-bold uppercase tracking-widest hover:underline">
                    Сбросить фильтры
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
