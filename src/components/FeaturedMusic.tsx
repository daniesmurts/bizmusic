"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Pause, Music, Zap, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getFeaturedTracksAction } from "@/lib/actions/tracks";
import { getBusinessDetailsAction } from "@/lib/actions/dashboard";
import { usePlayerStore, Track } from "@/store/usePlayerStore";
import { useAuth } from "@/components/AuthProvider";
import { useFeaturedTrackPlay } from "@/hooks/useFeaturedTrackPlay";
import { SubscriptionPromptModal } from "@/components/SubscriptionPromptModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const FeaturedMusic = () => {
  const { currentTrack, isPlaying, setTrack, togglePlay } = usePlayerStore();
  const { user } = useAuth();
  const { hasPlayedBefore, markAsPlayed, isHydrated } = useFeaturedTrackPlay();
  const [subscriptionStatus, setSubscriptionStatus] = useState<"ACTIVE" | "INACTIVE" | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [submittedPlayTrackId, setSubmittedPlayTrackId] = useState<string | null>(null);

  // Fetch subscription status if user is logged in
  useEffect(() => {
    if (!user) {
      setSubscriptionStatus(null);
      return;
    }

    async function checkSubscription() {
      try {
        const result = await getBusinessDetailsAction();
        if (result.success && result.data) {
          setSubscriptionStatus(result.data.subscriptionStatus || "INACTIVE");
        } else {
          setSubscriptionStatus("INACTIVE");
        }
      } catch (error) {
        console.error("Failed to check subscription:", error);
        setSubscriptionStatus("INACTIVE");
      }
    }

    checkSubscription();
  }, [user]);

  const { data: featuredTracks, isLoading, isError } = useQuery({
    queryKey: ["featured-tracks"],
    queryFn: async () => {
      const result = await getFeaturedTracksAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    retry: 1,
  });

  // Helper to check if user can play a track
  const canPlayTrack = (trackId: string): boolean => {
    // If logged in with active subscription, always allow
    if (user && subscriptionStatus === "ACTIVE") {
      return true;
    }

    // If not logged in or no active subscription, check if already played
    return !hasPlayedBefore(trackId);
  };

  // Helper to get play button state info
  const getPlayButtonState = (trackId: string) => {
    const isCurrentTrack = currentTrack?.id === trackId;
    const alreadyPlayed = hasPlayedBefore(trackId);
    const hasActiveSubscription = user && subscriptionStatus === "ACTIVE";
    const isDisabled = !hasActiveSubscription && alreadyPlayed;

    return { isCurrentTrack, alreadyPlayed, isDisabled, hasActiveSubscription };
  };

  const handlePlayPause = (track: any) => {
    if (!isHydrated) return; // Wait for localStorage to hydrate

    const { isCurrentTrack, isDisabled } = getPlayButtonState(track.id);

    // If track is disabled, show subscription modal
    if (isDisabled) {
      setSubmittedPlayTrackId(track.id);
      setShowSubscriptionModal(true);
      return;
    }

    if (isCurrentTrack) {
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

      // Mark as played only if user is not subscribed
      if (!user || subscriptionStatus !== "ACTIVE") {
        markAsPlayed(track.id);
      }
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

  if (isError) {
    console.error("[FeaturedMusic] Failed to load tracks — check server logs for details");
    return null;
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
          {(() => {
            const { isCurrentTrack, alreadyPlayed, isDisabled } = getPlayButtonState(track.id);
            return (
              <div className="relative group/btn">
                <button
                  onClick={() => handlePlayPause(track)}
                  disabled={isDisabled}
                  title={isDisabled ? "Вы уже прослушали этот трек. Подпишитесь для неограниченного доступа" : ""}
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl",
                    isCurrentTrack && isPlaying
                      ? "bg-primary text-primary-foreground scale-105"
                      : isDisabled
                      ? "bg-white/10 text-white/50 cursor-not-allowed"
                      : "bg-white/5 text-white group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110"
                  )}
                >
                  {isCurrentTrack && isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>
                {isDisabled && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-neutral-900 border border-white/10 rounded-lg text-[10px] text-neutral-300 whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                    Одно прослушивание. Подпишитесь для доступа
                  </div>
                )}
              </div>
            );
          })()}

          {/* Info */}
          <div className="flex-1 min-w-0 pr-4">
            <h4 className="text-white font-black uppercase tracking-tight truncate leading-tight">
              {track.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              {track.artistProfile?.slug ? (
                <Link 
                  href={`/artists/${track.artistProfile.slug}`}
                  className="text-neutral-500 text-[10px] font-black uppercase tracking-widest truncate max-w-[120px] hover:text-neon transition-colors"
                >
                  {track.artist}
                </Link>
              ) : (
                <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest truncate max-w-[120px]">
                  {track.artist}
                </p>
              )}
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
      
      <SubscriptionPromptModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)} 
      />
    </div>
  );
};
