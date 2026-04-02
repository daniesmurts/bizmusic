"use client";

import { useState, useEffect } from "react";
import { getCurrentSongOfTheWeek, setSongOfTheWeek, getSongOfTheWeekHistory, getTracksForSelection } from "@/lib/actions/song-of-the-week";
import { Button } from "@/components/ui/button";
import { Music, Calendar, Search, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import Image from "next/image";

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  genre: string;
  coverUrl?: string;
}

export default function SongOfTheWeekAdminPage() {
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [expiresDate, setExpiresDate] = useState<string>("");
  const [settingLoading, setSettingLoading] = useState(false);
  
  // Track search
  const [tracks, setTracks] = useState<Track[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTrackDropdown, setShowTrackDropdown] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);

  // Load current and history on mount
  useEffect(() => {
    loadData();
  }, []);

  // Load tracks when dropdown opens or search changes
  useEffect(() => {
    if (showTrackDropdown) {
      loadTracks();
    }
  }, [searchTerm, showTrackDropdown]);

  async function loadData() {
    try {
      setLoading(true);
      const [currentResult, historyResult] = await Promise.all([
        getCurrentSongOfTheWeek(),
        getSongOfTheWeekHistory(5, 0),
      ]);

      if (currentResult.ok) {
        setCurrentSong(currentResult.data);
      }
      if (historyResult.ok) {
        setHistory(historyResult.data);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Ошибка при загрузке данных");
    } finally {
      setLoading(false);
    }
  }

  async function loadTracks() {
    try {
      setTracksLoading(true);
      const result = await getTracksForSelection(20, 0, searchTerm);
      if (result.ok && result.data) {
        setTracks(result.data.tracks);
      }
    } catch (error) {
      console.error("Failed to load tracks:", error);
    } finally {
      setTracksLoading(false);
    }
  }

  async function handleSetSongOfWeek(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedTrack || !expiresDate) {
      toast.error("Выберите трек и дату окончания");
      return;
    }

    try {
      setSettingLoading(true);
      const result = await setSongOfTheWeek(selectedTrack.id, new Date(expiresDate));

      if (result.ok) {
        toast.success("Песня недели установлена успешно!");
        setSelectedTrack(null);
        setSelectedTrackId("");
        setExpiresDate("");
        loadData(); // Reload current and history
      } else {
        toast.error(result.error || "Ошибка при установке песни");
      }
    } catch (error) {
      toast.error("Ошибка при установке песни");
      console.error(error);
    } finally {
      setSettingLoading(false);
    }
  }

  // Get min date (today)
  const today = new Date().toISOString().split("T")[0];
  // Get max date (1 year from now)
  const maxDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-neutral-500">
          <Music className="w-4 h-4 text-neon" />
          <span className="text-[10px] font-black uppercase tracking-widest">Управление серией</span>
        </div>
        <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none">
          Песня <br /><span className="text-neon underline decoration-neon/20 underline-offset-8">Недели</span>
        </h1>
        <p className="text-neutral-400 font-medium">Установите новую бесплатную песню для еженедельного распространения</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Form */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSetSongOfWeek} className="space-y-6 p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem]">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Выбрать трек
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTrackDropdown(!showTrackDropdown)}
                  className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-between hover:border-white/20 transition-colors text-left text-sm font-medium text-white"
                >
                  <span className={selectedTrack ? "" : "text-neutral-500"}>
                    {selectedTrack ? `${selectedTrack.title} — ${selectedTrack.artist}` : "Поиск трека..."}
                  </span>
                  <Search className="w-4 h-4 text-neutral-600" />
                </button>

                {showTrackDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="p-3 border-b border-white/5">
                      <input
                        type="text"
                        placeholder="Поиск по названию или артисту..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neon"
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      {tracksLoading ? (
                        <div className="p-4 text-center text-neutral-400 text-sm">Загрузка...</div>
                      ) : tracks.length > 0 ? (
                        tracks.map((track) => (
                          <button
                            key={track.id}
                            type="button"
                            onClick={() => {
                              setSelectedTrack(track);
                              setSelectedTrackId(track.id);
                              setShowTrackDropdown(false);
                            }}
                            className={`w-full p-4 border-b border-white/5 hover:bg-white/5 text-left transition-colors flex items-center justify-between group ${
                              selectedTrack?.id === track.id ? "bg-neon/10 border-neon/20" : ""
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-white truncate">{track.title}</p>
                              <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
                            </div>
                            {selectedTrack?.id === track.id && (
                              <Check className="w-4 h-4 text-neon flex-shrink-0 ml-2" />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-neutral-400 text-sm">Треков не найдено</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="expires" className="block text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Дата окончания
              </label>
              <input
                id="expires"
                type="date"
                value={expiresDate}
                onChange={(e) => setExpiresDate(e.target.value)}
                min={today}
                max={maxDate}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neon"
              />
              <p className="text-[10px] text-neutral-500 mt-2">
                {expiresDate ? formatDate(new Date(expiresDate), "ru-RU") : "Выберите дату"}
              </p>
            </div>

            <div className="pt-4 border-t border-white/5">
              {selectedTrack && (
                <div className="mb-4 p-4 bg-neon/10 border border-neon/20 rounded-xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neon mb-2">Предпросмотр</p>
                  <p className="text-sm font-bold text-white">{selectedTrack.title}</p>
                  <p className="text-xs text-neutral-400">{selectedTrack.artist} • {selectedTrack.genre}</p>
                </div>
              )}
              <Button
                type="submit"
                disabled={settingLoading || !selectedTrack || !expiresDate}
                className="w-full bg-neon text-black hover:bg-neon/80 disabled:opacity-50 font-black uppercase tracking-widest rounded-xl py-3"
              >
                {settingLoading ? "Установка..." : "Установить"}
              </Button>
            </div>
          </form>
        </div>

        {/* Right: Current & History */}
        <div className="lg:col-span-2 space-y-8">
          {/* Current */}
          {loading ? (
            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] text-center text-neutral-400">
              Загрузка...
            </div>
          ) : currentSong && currentSong.track ? (
            <div className="p-8 bg-gradient-to-br from-neon/10 to-neon/5 border border-neon/20 rounded-[2.5rem] space-y-6">
              <div className="flex items-center gap-3">
                <Music className="w-5 h-5 text-neon" />
                <h2 className="text-2xl font-black uppercase tracking-tight text-white">Текущая песня</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {currentSong.track.coverUrl && (
                  <div className="md:col-span-1">
                    <img
                      src={currentSong.track.coverUrl}
                      alt={currentSong.track.title}
                      className="w-full aspect-square object-cover rounded-xl shadow-lg"
                    />
                  </div>
                )}

                <div className={`space-y-4 ${currentSong.track.coverUrl ? "md:col-span-2" : "md:col-span-3"}`}>
                  <div>
                    <h3 className="text-xl font-black text-white">{currentSong.track.title}</h3>
                    <p className="text-sm text-neon font-bold">{currentSong.track.artist}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Жанр</p>
                      <p className="font-bold text-white">{currentSong.track.genre}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Опубликовано</p>
                      <p className="font-bold text-white text-xs">{formatDate(new Date(currentSong.postedAt), "ru-RU")}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-white/[0.03] border border-white/10 rounded-lg">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Окончание срока</p>
                    <p className="font-bold text-white">{formatDate(new Date(currentSong.expiresAt), "ru-RU")}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] text-center text-neutral-400">
              <p>Ни одна песня недели не установлена</p>
              <p className="text-xs mt-2">Установите первую песню используя форму слева</p>
            </div>
          )}

          {/* History */}
          {history && history.songs.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                <Calendar className="w-5 h-5 text-neutral-500" />
                История
              </h2>

              <div className="space-y-3">
                {history.songs.map((item: any, idx: number) => (
                  <div
                    key={item.id}
                    className="p-4 bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-xl transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate">{item.track.title}</p>
                        <p className="text-xs text-neutral-400 truncate">{item.track.artist}</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {formatDate(new Date(item.postedAt), "ru-RU")}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="inline-block px-2 py-1 rounded bg-white/10 border border-white/20 text-[10px] font-bold text-neutral-300">
                          #{history.songs.length - idx}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
