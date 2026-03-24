"use client";

import { useState } from "react";
import { 
  Play, 
  Pause, 
  Music, 
  Disc, 
  ListMusic, 
  Clock,
  Heart,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlayerStore, Track } from "@/store/usePlayerStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";

interface ArtistProfileClientProps {
  artist: any;
}

export const ArtistProfileClient = ({ artist }: ArtistProfileClientProps) => {
  const [activeTab, setActiveTab] = useState<"tracks" | "albums">("tracks");
  const { currentTrack, isPlaying, setTrack, togglePlay } = usePlayerStore();

  const handlePlayTrack = (track: any) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      const playerTrack: Track = {
        id: track.id,
        title: track.title,
        artist: artist.name,
        fileUrl: track.fileUrl,
        streamUrl: track.streamUrl,
        duration: track.duration,
        cover_url: artist.imageUrl || `/images/mood-${(Math.floor(Math.random() * 2) + 1)}.png`,
      };
      setTrack(playerTrack);
      toast.info(`Воспроизведение: ${track.title}`);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-10">
      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-white/5 pb-1">
        <button
          onClick={() => setActiveTab("tracks")}
          className={cn(
            "pb-4 text-sm font-black uppercase tracking-widest transition-all relative",
            activeTab === "tracks" ? "text-neon" : "text-white/40 hover:text-white"
          )}
        >
          Треки
          {activeTab === "tracks" && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-neon shadow-[0_0_10px_rgba(92,243,135,0.5)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("albums")}
          className={cn(
            "pb-4 text-sm font-black uppercase tracking-widest transition-all relative",
            activeTab === "albums" ? "text-neon" : "text-white/40 hover:text-white"
          )}
        >
          Альбомы
          {activeTab === "albums" && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-neon shadow-[0_0_10px_rgba(92,243,135,0.5)]" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activeTab === "tracks" ? (
          <div className="space-y-4">
            {artist.tracks && artist.tracks.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {artist.tracks.map((track: any, index: number) => (
                  <div
                    key={track.id}
                    className={cn(
                      "group flex items-center justify-between p-4 rounded-2xl transition-all duration-300",
                      currentTrack?.id === track.id
                        ? "bg-neon/10 border border-neon/20"
                        : "hover:bg-white/[0.03] border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                      <span className="text-xs font-black text-neutral-700 w-4">
                        {(index + 1).toString().padStart(2, '0')}
                      </span>
                      
                      <button
                        onClick={() => handlePlayTrack(track)}
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-xl shrink-0",
                          currentTrack?.id === track.id && isPlaying
                            ? "bg-neon text-black scale-105"
                            : "bg-white/5 text-white group-hover:bg-neon group-hover:text-black group-hover:scale-110"
                        )}
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <Pause className="w-5 h-5 fill-current" />
                        ) : (
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <h4 className={cn(
                          "font-black uppercase tracking-tight truncate leading-tight",
                          currentTrack?.id === track.id ? "text-neon" : "text-white"
                        )}>
                          {track.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                            {track.genre || "Без жанра"}
                          </span>
                          <div className="w-1 h-1 rounded-full bg-white/10" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                            {track.bpm ? `${track.bpm} BPM` : "Variable BPM"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-12 pl-4">
                      <div className="hidden md:flex items-center gap-2 text-neutral-500">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs font-bold tabular-nums">
                          {formatDuration(track.duration)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" className="text-neutral-500 hover:text-neon hover:bg-neon/10 rounded-full">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-neutral-500 hover:text-white hover:bg-white/5 rounded-full">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center space-y-4 glass-dark rounded-[2rem] border border-white/5">
                <Music className="w-12 h-12 text-neutral-800 mx-auto" />
                <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">Треки еще не добавлены</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {artist.albums && artist.albums.length > 0 ? (
              artist.albums.map((album: any) => (
                <div 
                  key={album.id}
                  className="group relative h-[300px] rounded-[2rem] overflow-hidden border border-white/5 hover:border-neon/20 transition-all duration-500"
                >
                  {album.coverUrl ? (
                    <Image
                      src={album.coverUrl}
                      alt={album.title}
                      fill
                      className="object-cover brightness-75 group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
                      <Disc className="w-12 h-12 text-neutral-800" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  
                  <div className="absolute inset-x-8 bottom-8">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black uppercase leading-none text-white">{album.title}</h3>
                        <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs">
                          {album.tracks?.length || 0} ТРЕКОВ{album.releaseDate ? ` • ${new Date(album.releaseDate).getFullYear()}` : ""}
                        </p>
                      </div>
                      <Button className="w-full bg-white/10 backdrop-blur-xl border border-white/10 text-white hover:bg-neon hover:text-black font-black uppercase tracking-widest text-xs h-12 rounded-2xl group-hover:bg-neon group-hover:text-black">
                        Смотреть релиз
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center space-y-4 glass-dark rounded-[2rem] border border-white/5">
                <Disc className="w-12 h-12 text-neutral-800 mx-auto" />
                <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">Альбомы не найдены</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
