"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Maximize2,
  Repeat,
  Shuffle,
  Music
} from "lucide-react";
import Image from "next/image";

import { toast } from "sonner";
import { OfflineManager } from "./player/OfflineManager";
import { getCachedAudioUrl } from "@/lib/services/offline-audio";

export const Player = () => {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    volume, 
    setVolume, 
    progress, 
    setProgress,
    nextTrack,
    prevTrack: storePrevTrack,
    isShuffle,
    toggleShuffle,
    repeatMode,
    setRepeatMode,
    isWaveMode,
    skipWaveTrack,
    activeLocationId
  } = usePlayerStore();
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioSource, setAudioSource] = useState<string | undefined>(undefined);

  const lastLoggedTrackKeyRef = useRef<string | null>(null);
  // Track announcement play start time for listenDurationSec calculation
  const announcementStartTimeRef = useRef<number | null>(null);

  // Load from local IDB cache if available
  useEffect(() => {
    if (!currentTrack) {
      return;
    }
    
    let isActive = true;
    let objectUrl: string | null = null;
    const fallbackSrc = currentTrack.streamUrl || currentTrack.fileUrl;
    
    async function loadAudioSource() {
      try {
        const cachedUrl = await getCachedAudioUrl(currentTrack!.id);
        if (!isActive) return;
        
        if (cachedUrl) {
          objectUrl = cachedUrl;
          setAudioSource(cachedUrl);
        } else {
          setAudioSource(fallbackSrc);
        }
      } catch {
        if (isActive) setAudioSource(fallbackSrc);
      }
    }
    
    loadAudioSource();

    return () => {
      isActive = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [currentTrack]);

  // Sync audio element with store
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying && audioSource) {
      audioRef.current.play().then(() => {
        // Log the play event when playback actually starts AND it's a new track session
        const logKey = currentTrack ? `${currentTrack.id}:${activeLocationId || "none"}` : null;
        if (currentTrack && logKey && lastLoggedTrackKeyRef.current !== logKey) {
          fetch('/api/player/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trackId: currentTrack.id,
              locationId: activeLocationId,
            })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              lastLoggedTrackKeyRef.current = logKey;
              window.dispatchEvent(new CustomEvent('track-played', { detail: { trackId: currentTrack.id } }));
            } else {
              console.error("Failed to log play (API):", data.error);
            }
          })
          .catch(err => {
            console.error("Failed to log play (Network):", err);
          });

          // Track announcement play start
          if (currentTrack.isAnnouncement) {
            announcementStartTimeRef.current = Date.now();
          } else {
            announcementStartTimeRef.current = null;
          }
        }
      }).catch((err) => {
        if (err.name === 'AbortError') return;
        console.error("Playback failed:", err);
        // Sometimes browsers block autoplay
        if (err.name === 'NotAllowedError') {
          toast.error("Нажмите Play для начала воспроизведения");
        }
      });
    } else if (!isPlaying) {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack, audioSource, activeLocationId]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Listen for seek events from DashboardPlayer
  useEffect(() => {
    const handleSeekEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ progress: number }>;
      if (audioRef.current && audioRef.current.duration) {
        const newTime = (customEvent.detail.progress / 100) * audioRef.current.duration;
        audioRef.current.currentTime = newTime;
        setProgress(customEvent.detail.progress);
      }
    };
    window.addEventListener('player-seek', handleSeekEvent);
    return () => window.removeEventListener('player-seek', handleSeekEvent);
  }, [setProgress]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const currentTime = audioRef.current.currentTime;
    const duration = audioRef.current.duration;
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleAudioError = () => {
    if (!currentTrack) return;
    console.error("Audio playback error for track:", currentTrack.id, currentTrack.title);
    toast.error(`Не удалось воспроизвести: ${currentTrack.title}`);
    if (currentTrack.isAnnouncement) {
      logAnnouncementPlay(true);
    }
    nextTrack();
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Fire announcement-specific play log
  const logAnnouncementPlay = (wasSkipped: boolean) => {
    if (!currentTrack?.isAnnouncement || !currentTrack.announcementId) return;
    const listenDurationSec = announcementStartTimeRef.current
      ? Math.round((Date.now() - announcementStartTimeRef.current) / 1000)
      : 0;
    announcementStartTimeRef.current = null;
    fetch('/api/player/announcement-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        announcementId: currentTrack.announcementId,
        trackId: currentTrack.id,
        locationId: activeLocationId,
        wasSkipped,
        listenDurationSec,
      }),
    }).catch(console.error);
  };

  const handlePrevTrack = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      // If more than 3 seconds in, restart current track
      audioRef.current.currentTime = 0;
      setProgress(0);
    } else {
      storePrevTrack();
    }
  };

  const handleSliderChange = (val: number[]) => {
    if (audioRef.current && val.length > 0) {
      const newProgress = val[0];
      const newTime = (newProgress / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress(newProgress);
    }
  };

  const handleVolumeChange = (val: number[]) => {
    if (val.length > 0) {
      const newVolume = val[0] / 100;
      setVolume(newVolume);
      if (newVolume > 0) setIsMuted(false);
    }
  };

  if (!currentTrack) return null;

  const currentTimeFromProgress = duration > 0 ? (progress / 100) * duration : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 animate-slide-up">
      <OfflineManager />
      <div className="max-w-7xl mx-auto glass-dark border border-white/10 rounded-3xl p-4 flex items-center justify-between shadow-2xl shadow-neon/10 gap-8">
        <audio 
          ref={audioRef}
          src={audioSource || undefined}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleAudioError}
          onEnded={() => {
            logAnnouncementPlay(false);
            nextTrack();
          }}
        />

        {/* Track Info */}
        <div className="flex items-center gap-4 w-[30%] min-w-0">
          <div className="w-14 h-14 bg-neutral-900 rounded-xl overflow-hidden flex-shrink-0 border border-white/5 relative">
            {currentTrack.cover_url ? (
              <Image src={currentTrack.cover_url} alt={currentTrack.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neon/40">
                <Music className="w-6 h-6" />
              </div>
            )}
            {isPlaying && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-neon overflow-hidden">
                <div className="h-full bg-white/40 animate-pulse w-full" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-white font-black text-sm uppercase truncate tracking-tight">{currentTrack.title}</h4>
              {isWaveMode && (
                <span className="bg-neon/20 text-neon px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border border-neon/30 flex-shrink-0">
                  Wave Active
                </span>
              )}
            </div>
            <p className="text-neutral-500 text-xs font-bold uppercase truncate tracking-widest">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-xl">
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`transition-colors h-8 w-8 ${isShuffle ? 'text-neon' : 'text-neutral-500 hover:text-white'}`}
              onClick={toggleShuffle}
            >
              <Shuffle className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:text-neon transition-colors h-10 w-10 p-0"
              onClick={handlePrevTrack}
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </Button>
            <Button 
              className="bg-neon text-black hover:scale-110 transition-transform h-12 w-12 rounded-full p-0 shadow-lg shadow-neon/20"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:text-neon transition-colors h-10 w-10 p-0"
              onClick={() => {
                logAnnouncementPlay(true);
                if (isWaveMode) {
                  skipWaveTrack();
                } else {
                  nextTrack();
                }
              }}
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`transition-colors h-8 w-8 ${repeatMode !== 'off' ? 'text-neon' : 'text-neutral-500 hover:text-white'}`}
              onClick={() => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')}
            >
              <Repeat className="w-4 h-4" />
              {repeatMode === 'one' && <span className="absolute text-[8px] font-black">1</span>}
            </Button>
          </div>
          
          <div className="flex items-center gap-3 w-full">
            <span className="text-[10px] font-black text-neutral-500 w-10 text-right">
              {formatTime(currentTimeFromProgress)}
            </span>
            <Slider 
              value={[progress]} 
              max={100} 
              step={0.1}
              className="hover:cursor-pointer"
              onValueChange={handleSliderChange}
            />
            <span className="text-[10px] font-black text-neutral-500 w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume & Toggles */}
        <div className="flex items-center justify-end gap-6 w-[30%]">
          <div className="flex items-center gap-2 w-32">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-neutral-400 hover:text-white h-8 w-8"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Slider 
              value={[isMuted ? 0 : volume * 100]} 
              max={100}
              onValueChange={handleVolumeChange}
              className="w-full"
            />
          </div>
          <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white h-8 w-8">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
