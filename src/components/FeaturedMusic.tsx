"use client";

import { useQuery } from "@tanstack/react-query";
import { Play, Pause, Music, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFeaturedTracksAction } from "@/lib/actions/tracks";
import { usePlayerStore, Track } from "@/store/usePlayerStore";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const FeaturedMusic = () => {
  const { currentTrack, isPlaying, setTrack, togglePlay } = usePlayerStore();

  const { data: featuredTracks, isLoading } = useQuery({
    queryKey: ["featured-tracks"],
    queryFn: async () => {
      const result = await getFeaturedTracksAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const handlePlayPause = (track: any) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      const playerTrack: Track = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        fileUrl: track.fileUrl,
        streamUrl: track.streamUrl,
        duration: track.duration,
        cover_url: `/images/mood-${(Math.floor(Math.random() * 2) + 1)}.png`,
      };
      setTrack(playerTrack);
      toast.info(`Воспроизведение: ${track.title}`);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 glass-dark rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!featuredTracks || featuredTracks.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {featuredTracks.map((track: any) => (
        <div
          key={track.id}
          className={cn(
            "group relative flex items-center gap-4 p-4 rounded-3xl transition-all duration-500 border border-white/5",
            currentTrack?.id === track.id
              ? "bg-neon/10 border-neon/30 shadow-[0_0_30px_rgba(92,243,135,0.1)]"
              : "glass-dark hover:border-white/20"
          )}
        >
          {/* Status Icon */}
          <div className="absolute -top-2 -right-2 z-10">
            <div className="w-8 h-8 rounded-full bg-neon text-black flex items-center justify-center shadow-lg shadow-neon/40 animate-in zoom-in duration-500">
               <Star className="w-4 h-4 fill-current" />
            </div>
          </div>

          {/* Play Button */}
          <button
            onClick={() => handlePlayPause(track)}
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl",
              currentTrack?.id === track.id && isPlaying
                ? "bg-primary text-primary-foreground scale-105"
                : "bg-white/5 text-white group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110"
            )}
          >
            {currentTrack?.id === track.id && isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Info */}
          <div className="flex-1 min-w-0 pr-4">
            <h4 className="text-white font-black uppercase tracking-tight truncate leading-tight">
              {track.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest truncate max-w-[120px]">
                {track.artist}
              </p>
              {track.genre && (
                <>
                  <div className="w-1 h-1 rounded-full bg-white/10" />
                  <span className="text-primary text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                    {track.genre}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Visualization (Only when playing) */}
          {currentTrack?.id === track.id && isPlaying && (
            <div className="flex items-center gap-0.5 h-4">
               {[1, 2, 3, 4].map((i) => (
                 <div 
                   key={i} 
                   className="w-0.5 bg-neon animate-pulse" 
                   style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}
                 />
               ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
