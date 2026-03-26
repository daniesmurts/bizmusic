"use client";

import { useEffect, useState } from "react";

const FEATURED_TRACKS_PLAYED_KEY = "featured-tracks-played";

/**
 * Hook to manage featured track play limits for anonymous/unsubscribed users.
 * Uses localStorage to track which featured tracks have been played.
 */
export function useFeaturedTrackPlay() {
  const [playedTracks, setPlayedTracks] = useState<Set<string>>(new Set());
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FEATURED_TRACKS_PLAYED_KEY);
      if (stored) {
        setPlayedTracks(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error("Failed to load featured tracks play history:", error);
    }
    setIsHydrated(true);
  }, []);

  // Sync to localStorage whenever playedTracks changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(FEATURED_TRACKS_PLAYED_KEY, JSON.stringify(Array.from(playedTracks)));
    } catch (error) {
      console.error("Failed to save featured tracks play history:", error);
    }
  }, [playedTracks, isHydrated]);

  const hasPlayedBefore = (trackId: string): boolean => {
    return playedTracks.has(trackId);
  };

  const markAsPlayed = (trackId: string): void => {
    setPlayedTracks((prev) => new Set(prev).add(trackId));
  };

  const clearPlayHistory = (): void => {
    setPlayedTracks(new Set());
  };

  return {
    hasPlayedBefore,
    markAsPlayed,
    clearPlayHistory,
    isHydrated,
  };
}
