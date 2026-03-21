"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Play,
  Pause,
  Edit2,
  Trash2,
  Filter,
  Music,
  Clock,
  Zap,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AdminTrack } from "@/types/admin";
import { usePlayerStore } from "@/store/usePlayerStore";

interface TrackTableProps {
  tracks: AdminTrack[];
  onEdit: (track: AdminTrack) => void;
  onDelete: (trackId: string) => Promise<void>;
  onPlay: (track: AdminTrack) => void;
}

export const TrackTable = ({
  tracks,
  onEdit,
  onDelete,
  onPlay,
}: TrackTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMoodTag, setSelectedMoodTag] = useState<string | null>(null);
  const { currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const playingTrackId = isPlaying ? currentTrack?.id : null;

  // Get all unique mood tags from tracks
  const allMoodTags = useMemo(() => {
    const tags = new Set<string>();
    tracks.forEach((track) => {
      track.moodTags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [tracks]);

  // Filter tracks
  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      const matchesSearch =
        !searchQuery ||
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag = !selectedMoodTag || track.moodTags.includes(selectedMoodTag);

      return matchesSearch && matchesTag;
    });
  }, [tracks, searchQuery, selectedMoodTag]);

  const handlePlayPause = (track: AdminTrack) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      onPlay(track);
    }
  };

  const handleDelete = async (trackId: string) => {
    const confirmed = confirm(
      "Вы уверены, что хотите удалить этот трек? Это действие нельзя отменить."
    );
    if (confirmed) {
      await onDelete(trackId);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedMoodTag(null);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию или исполнителю..."
            className="pl-12 bg-white/[0.02] border-white/10 text-white rounded-2xl h-14"
          />
        </div>

        {allMoodTags.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-neutral-500" />
            <div className="flex flex-wrap gap-2">
              {allMoodTags.slice(0, 5).map((tag) => (
                <button
                  key={tag}
                  onClick={() =>
                    setSelectedMoodTag(selectedMoodTag === tag ? null : tag)
                  }
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border",
                    selectedMoodTag === tag
                      ? "bg-neon text-black border-neon"
                      : "bg-white/[0.02] text-neutral-400 border-white/10 hover:border-white/20 hover:text-white"
                  )}
                >
                  {tag}
                </button>
              ))}
              {allMoodTags.length > 5 && (
                <span className="text-xs font-bold text-neutral-500 px-2">
                  +{allMoodTags.length - 5}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {(searchQuery || selectedMoodTag) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {searchQuery && (
              <Badge className="bg-white/10 border-white/20 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest gap-2 flex items-center">
                Поиск: {searchQuery}
                <button
                  onClick={() => setSearchQuery("")}
                  className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                >
                  <svg className="w-3 h-3" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>
              </Badge>
            )}
            {selectedMoodTag && (
              <Badge className="bg-neon/10 border-neon/20 text-neon px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest gap-2 flex items-center">
                Тег: {selectedMoodTag}
                <button
                  onClick={() => setSelectedMoodTag(null)}
                  className="hover:bg-neon/20 rounded-full p-0.5 transition-colors"
                >
                  <svg className="w-3 h-3" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>
              </Badge>
            )}
          </div>
          <Button
            onClick={clearFilters}
            variant="ghost"
            className="text-neutral-500 hover:text-white text-xs font-black uppercase tracking-widest h-8"
          >
            Очистить всё
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="glass-dark border border-white/5 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Трек
                </th>
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Длительность
                </th>
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  BPM
                </th>
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Энергия
                </th>
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Настроение
                </th>
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Жанр
                </th>
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Проигрываний
                </th>
                <th className="text-right py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTracks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <Music className="w-8 h-8 text-neutral-600" />
                      </div>
                      <div>
                        <p className="text-white font-black uppercase tracking-tight">
                          Треки не найдены
                        </p>
                        <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest mt-1">
                          {searchQuery || selectedMoodTag
                            ? "Измените параметры поиска"
                            : "Загрузите первый трек"}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTracks.map((track) => (
                  <tr
                    key={track.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handlePlayPause(track)}
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center border transition-all",
                            playingTrackId === track.id
                              ? "bg-neon text-black border-neon"
                              : "bg-white/5 text-white border-white/10 group-hover:border-white/20"
                          )}
                        >
                          {playingTrackId === track.id ? (
                            <Pause className="w-5 h-5 fill-current" />
                          ) : (
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p className="text-white font-black uppercase tracking-tight truncate max-w-[200px]">
                            {track.title}
                          </p>
                          <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
                            {track.artist}
                          </p>
                          {track.isExplicit && (
                            <Badge className="mt-1 bg-red-500/10 border-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              18+
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-neutral-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-bold">
                          {formatDuration(track.duration)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {track.bpm ? (
                        <div className="flex items-center gap-2 text-neutral-400">
                          <Zap className="w-4 h-4" />
                          <span className="text-sm font-bold">{track.bpm}</span>
                        </div>
                      ) : (
                        <span className="text-neutral-600">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={cn(
                              "w-2 h-6 rounded-sm transition-colors",
                              level <= (track as any).energyLevel || 5
                                ? "bg-neon"
                                : "bg-white/10"
                            )}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {track.moodTags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            className="bg-white/5 border-white/10 text-neutral-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
                          >
                            <Tag className="w-2 h-2 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                        {track.moodTags.length > 3 && (
                          <span className="text-[9px] font-bold text-neutral-600">
                            +{track.moodTags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-[10px] font-black uppercase tracking-widest text-neon/80 bg-neon/5 px-3 py-1.5 rounded-full border border-neon/10">
                        {track.genre || "Unknown"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-bold text-neutral-400">
                        {track._count?.playLogs || 0}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => onEdit(track)}
                          variant="ghost"
                          size="icon"
                          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(track.id)}
                          variant="ghost"
                          size="icon"
                          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filteredTracks.length > 0 && (
          <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02]">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
              Показано {filteredTracks.length} из {tracks.length} треков
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
