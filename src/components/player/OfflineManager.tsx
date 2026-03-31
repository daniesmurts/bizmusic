"use client";

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { cacheAudioTrack } from '@/lib/services/offline-audio';

export function OfflineManager() {
  const { queue, currentTrack } = usePlayerStore();
  const currentlyCachingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // We want to cache the current track AND the next 2 tracks in the queue
    const tracksToCache = [];
    if (currentTrack) tracksToCache.push(currentTrack);
    if (queue.length > 0) tracksToCache.push(queue[0]);
    if (queue.length > 1) tracksToCache.push(queue[1]);

    tracksToCache.forEach(track => {
      if (!currentlyCachingRef.current.has(track.id)) {
        currentlyCachingRef.current.add(track.id);
        const sourceUrl = track.streamUrl || track.fileUrl;
        
        cacheAudioTrack(track.id, sourceUrl)
          .catch(e => console.error("OfflineManager:", e))
          .finally(() => {
            // Unmark once complete (success or fail)
            currentlyCachingRef.current.delete(track.id);
          });
      }
    });

  }, [currentTrack, queue]);

  // Non-visual background component
  return null;
}
