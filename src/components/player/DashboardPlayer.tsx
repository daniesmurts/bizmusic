"use client";

import { usePlayerStore, Track } from "@/store/usePlayerStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Music,
  ListVideo,
  ChevronUp,
  ChevronDown,
  Trash2,
  ShieldCheck,
  ThumbsDown,
  Heart,
} from "lucide-react";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clearTrackReactionAction, getTrackReactionSummaryAction, setTrackReactionAction, type TrackReactionType } from "@/lib/actions/track-reactions";
import { toast } from "sonner";
import { logTrackSkipAction } from "@/lib/actions/track-skips";


export function DashboardPlayer({ 
  locationName, 
  locationId 
}: { 
  locationName: string; 
  locationId?: string; 
}) {

  const {
    currentTrack,
    isPlaying,
    progress,
    volume,
    isShuffle,
    repeatMode,
    queue,
    togglePlay,
    setProgress,
    setVolume,
    nextTrack,
    prevTrack,
    toggleShuffle,
    setRepeatMode,
    reorderQueue,
    removeFromQueue
  } = usePlayerStore();
  const queryClient = useQueryClient();

  const [isMuted, setIsMuted] = useState(volume === 0);
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: reactionData } = useQuery({
    queryKey: ["track-reaction", currentTrack?.id],
    queryFn: async () => {
      const res = await getTrackReactionSummaryAction(currentTrack!.id);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    enabled: !!currentTrack?.id,
    staleTime: 30_000,
  });

  const { mutate: mutateReaction, isPending: isReactionPending } = useMutation({
    mutationFn: async (reactionType: TrackReactionType) => {
      if (!currentTrack?.id) throw new Error("Трек не выбран");

      if (reactionData?.userReaction === reactionType) {
        const clearRes = await clearTrackReactionAction(currentTrack.id);
        if (!clearRes.success) throw new Error(clearRes.error);
        return clearRes.data;
      }

      const setRes = await setTrackReactionAction(currentTrack.id, reactionType);
      if (!setRes.success) throw new Error(setRes.error);
      return setRes.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["track-reaction", currentTrack?.id] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Не удалось сохранить реакцию";
      toast.error(message);
    },
  });

  useEffect(() => {
    setIsMuted(volume === 0);
  }, [volume]);

  const slides = [
    {
      badge: isPlaying ? "В ЭФИРЕ • ЛИЦЕНЗИЯ АКТИВНА" : "ЛИЦЕНЗИЯ АКТИВНА",
      icon: <ShieldCheck className="w-4 h-4" />,
      titleLine1: isPlaying ? "Аудио" : "Музыка",
      titleLine2: "для Бизнеса",
      description: "Прямые лицензии с правообладателями. Выплаты РАО и ВОИС не требуются.",
      isNeon: isPlaying
    },
    {
      badge: "НОВИНКА",
      icon: <Music className="w-4 h-4" />,
      titleLine1: "Летний",
      titleLine2: "Вайб 2026",
      description: "Более 5,000 новых треков добавлено в каталоги для ресторанов и кафе.",
      isNeon: false
    },
    {
      badge: "АНОНС",
      icon: <ListVideo className="w-4 h-4" />,
      titleLine1: "Умное",
      titleLine2: "Расписание",
      description: "Скоро: автоматическая смена плейлистов в зависимости от времени суток.",
      isNeon: false
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Handle local UI overrides or calls to global window audio element
  // The actual `<audio>` element is located in `src/components/Player.tsx`
  // We are just providing a UI to control it here.
  const handleSliderChange = (val: number[]) => {
    if (val.length > 0) {
      const newProgress = val[0];
      // Note: we'd ideally seek the audio element as well, 
      // but `src/components/Player.tsx`'s own slider does `audioRef.current.currentTime = newTime`.
      // By changing `progress` in store, we only update state. 
      // The audio element needs to respond to progress change if we do this, 
      // but `usePlayerStore` doesn't currently notify the Player to seek unless we dispatch an event.
      // For now, this updates the visual progress.
      setProgress(newProgress);
      window.dispatchEvent(new CustomEvent('player-seek', { detail: { progress: newProgress } }));
    }
  };

  const handleVolumeChange = (val: number[]) => {
    if (val.length > 0) {
      const newVolume = val[0] / 100;
      setVolume(newVolume);
      if (newVolume > 0) setIsMuted(false);
    }
  };

  const cycleRepeat = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };
  
  const moveInQueue = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      reorderQueue(index, index - 1);
    } else if (direction === 'down' && index < queue.length - 1) {
      reorderQueue(index, index + 1);
    }
  };

  const handleNext = async () => {
    if (currentTrack) {
      logTrackSkipAction({ 
        trackId: currentTrack.id, 
        locationId,
        reason: 'manual_next' 
      });
    }
    nextTrack();
  };

  const handlePrev = async () => {
    if (currentTrack) {
      logTrackSkipAction({ 
        trackId: currentTrack.id, 
        locationId,
        reason: 'manual_prev' 
      });
    }
    prevTrack();
  };


  return (
    <div className="space-y-6 mb-24 md:mb-0">
      <div className="glass-dark border border-white/10 rounded-[3rem] p-10 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-0" />
        <div className="absolute inset-0 bg-neon/5 mix-blend-overlay z-[-1]" />

        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          {/* Slider Content */}
          <div className="space-y-8 flex flex-col justify-between h-full py-2">
            <div className="relative h-[260px] w-full">
              {slides.map((slide, index) => (
                <div 
                  key={index}
                  className={cn(
                    "absolute inset-0 transition-all duration-700 ease-in-out",
                    currentSlide === index ? "opacity-100 translate-y-0 z-10" : "opacity-0 translate-y-4 z-0 pointer-events-none"
                  )}
                >
                  <div className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 transition-colors duration-500",
                    slide.isNeon ? "bg-neon/10 text-neon border border-neon/30 shadow-[0_0_15px_rgba(92,243,135,0.2)]" : "bg-white/5 text-neutral-400 border border-white/10"
                  )}>
                    {slide.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {slide.badge}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-tight text-white drop-shadow-md">
                      {slide.titleLine1} <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-neon to-emerald-400">{slide.titleLine2}</span>
                    </h2>
                    <p className="text-neutral-400 font-medium tracking-wide text-sm max-w-[280px] leading-relaxed">
                      {slide.description}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Pagination Dots */}
              <div className="absolute bottom-0 left-0 flex gap-2">
                {slides.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setCurrentSlide(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300", 
                      currentSlide === i ? "w-6 bg-neon" : "w-1.5 bg-white/20 hover:bg-white/40"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Player controls */}
          <div className="glass-dark border border-white/10 rounded-[2.5rem] p-8 flex flex-col space-y-6 backdrop-blur-3xl relative overflow-hidden">
            {/* Visualizer BG */}
            {isPlaying && (
              <div className="absolute inset-0 opacity-10 pointer-events-none flex items-end justify-center gap-1 pb-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="w-4 bg-neon rounded-t-full animate-music-bar" style={{ animationDelay: `${Math.random() * 0.5}s`, height: `${Math.max(20, Math.random() * 100)}%` }} />
                ))}
              </div>
            )}

            <div className="flex items-center gap-6 relative z-10">
              <div className="w-24 h-24 rounded-2xl bg-neutral-900 border border-white/10 overflow-hidden flex-shrink-0 relative shadow-2xl shadow-black/50">
                {currentTrack?.cover_url ? (
                  <Image src={currentTrack.cover_url} alt={currentTrack.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neon/40">
                    <Music className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-neutral-500 font-black uppercase tracking-widest text-[10px] mb-1">Сейчас играет</div>
                <h4 className="text-xl text-white font-black uppercase tracking-tighter truncate leading-tight">
                  {currentTrack ? currentTrack.title : "—"}
                </h4>
                <p className="text-neon text-sm font-bold uppercase truncate tracking-widest mt-1">
                  {currentTrack ? currentTrack.artist : "Ожидание трека..."}
                </p>
                {currentTrack && (
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => mutateReaction("LIKE")}
                      disabled={isReactionPending}
                      className={cn(
                        "h-8 rounded-full border text-xs font-black uppercase tracking-widest transition-colors",
                        reactionData?.userReaction === "LIKE"
                          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                          : "border-white/10 text-neutral-400 hover:text-white"
                      )}
                    >
                      <span className="relative flex items-center mr-1">
                        <Heart
                          className={cn(
                            "w-4 h-4 transition-transform duration-300",
                            reactionData?.userReaction === "LIKE"
                              ? "text-emerald-400 scale-110 animate-pulse"
                              : "text-neutral-400 group-hover:text-white scale-100"
                          )}
                          fill={reactionData?.userReaction === "LIKE" ? "#34d399" : "none"}
                          strokeWidth={1.5}
                        />
                      </span>
                      {reactionData?.likes ?? 0}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => mutateReaction("DISLIKE")}
                      disabled={isReactionPending}
                      className={cn(
                        "h-8 rounded-full border text-xs font-black uppercase tracking-widest",
                        reactionData?.userReaction === "DISLIKE"
                          ? "border-rose-400/40 bg-rose-400/10 text-rose-300"
                          : "border-white/10 text-neutral-400 hover:text-white"
                      )}
                    >
                      <ThumbsDown className="w-3.5 h-3.5 mr-1" /> {reactionData?.dislikes ?? 0}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 relative z-10 w-full pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className={cn("text-neutral-500 hover:text-white transition-colors h-8 w-8", isShuffle && "text-neon")} onClick={toggleShuffle}>
                  <Shuffle className="w-4 h-4" />
                </Button>
                
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" className="text-white hover:text-neon transition-colors h-10 w-10" onClick={handlePrev}>
                    <SkipBack className="w-6 h-6 fill-current" />
                  </Button>
                  <Button 
                    className="bg-neon text-black hover:scale-105 transition-transform h-14 w-14 rounded-full p-0 shadow-[0_0_20px_rgba(92,243,135,0.3)] hover:shadow-[0_0_30px_rgba(92,243,135,0.5)]"
                    onClick={togglePlay}
                  >
                    {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="text-white hover:text-neon transition-colors h-10 w-10" onClick={handleNext}>
                    <SkipForward className="w-6 h-6 fill-current" />
                  </Button>
                </div>


                <Button variant="ghost" size="icon" className={cn("text-neutral-500 hover:text-white transition-colors h-8 w-8", repeatMode !== 'off' && "text-neon")} onClick={cycleRepeat}>
                  {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Slider 
                  value={[progress]} 
                  max={100} 
                  step={0.1}
                  className="hover:cursor-pointer"
                  onValueChange={handleSliderChange}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Up Next / Queue Section */}
      {queue.length > 0 && (
        <div className="glass-dark border border-white/10 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <ListVideo className="w-5 h-5 text-neon" />
            <h3 className="text-lg font-black uppercase tracking-tight text-white">Очередь воспроизведения</h3>
            <span className="ml-2 text-xs font-bold text-neutral-500 px-2 py-0.5 bg-white/5 rounded-full">{queue.length}</span>
          </div>
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {queue.slice(0, 5).map((track, i) => (
              <div key={track.id + i} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all">
                <div className="text-xs font-mono font-bold text-neutral-600 w-4">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{track.title}</div>
                  <div className="text-xs text-neutral-500 truncate">{track.artist}</div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex flex-col">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-400 hover:text-white" onClick={() => moveInQueue(i, 'up')} disabled={i === 0}>
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-400 hover:text-white" onClick={() => moveInQueue(i, 'down')} disabled={i === queue.length - 1}>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => removeFromQueue(i)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {queue.length > 5 && (
              <div className="text-center py-4">
                <span className="text-xs font-bold text-neutral-500 tracking-widest uppercase">И ещё {queue.length - 5} треков...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
