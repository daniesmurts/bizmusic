"use client";

import { usePlayerStore } from "@/store/usePlayerStore";
import { Play, Pause, SkipForward, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function MiniPlayer() {
  const pathname = usePathname();
  const { currentTrack, isPlaying, togglePlay, nextTrack, queue } = usePlayerStore();

  // Don't show on the player page (full player is already visible there)
  const isPlayerPage = pathname === "/dashboard/player";

  if (!currentTrack || isPlayerPage) return null;

  return (
    <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-[85] lg:bottom-0 px-2 pb-1 lg:px-4 lg:pb-2">
      <div className="max-w-2xl mx-auto bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
        {/* Track Icon */}
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 overflow-hidden">
          {currentTrack.cover_url ? (
            <img src={currentTrack.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Music className="w-5 h-5 text-neon/60" />
          )}
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-bold truncate",
            isPlaying ? "text-neon" : "text-white"
          )}>
            {currentTrack.title}
          </p>
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest truncate">
            {currentTrack.artist}
          </p>
        </div>

        {/* Playing Indicator */}
        {isPlaying && (
          <div className="flex items-end gap-[2px] h-4 shrink-0">
            <div className="w-[2px] bg-neon animate-[pulse_0.6s_ease-in-out_infinite] h-1" />
            <div className="w-[2px] bg-neon animate-[pulse_0.6s_ease-in-out_infinite_0.15s] h-2.5" />
            <div className="w-[2px] bg-neon animate-[pulse_0.6s_ease-in-out_infinite_0.3s] h-4" />
            <div className="w-[2px] bg-neon animate-[pulse_0.6s_ease-in-out_infinite_0.45s] h-2" />
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={togglePlay}
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center transition-all",
              isPlaying
                ? "bg-neon text-black"
                : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5 fill-current" />
            )}
          </button>
          {queue.length > 0 && (
            <button
              onClick={nextTrack}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
