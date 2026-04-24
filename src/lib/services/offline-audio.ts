import { get, set, keys, del } from 'idb-keyval';

// Maximum number of tracks to keep in the browser's persistent cache
// 20 tracks is roughly ~100MB depending on encoding and length
const MAX_CACHED_TRACKS = 20; 

export async function isAudioCached(trackId: string): Promise<boolean> {
  try {
    const blob = await get<Blob>(`track-${trackId}`);
    return !!blob;
  } catch (err) {
    return false;
  }
}

export async function getCachedAudioUrl(trackId: string): Promise<string | null> {
  try {
    const blob = await get<Blob>(`track-${trackId}`);
    if (blob) {
      // Browsers handle Blob Object URLs automatically, but they must be revoked 
      // by the consuming component to prevent memory leaks!
      return URL.createObjectURL(blob);
    }
  } catch (err) {
    console.error("Failed to read from IDB:", err);
  }
  return null;
}

export async function cacheAudioTrack(trackId: string, url: string): Promise<void> {
  const isCached = await isAudioCached(trackId);
  if (isCached) return; 

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(120_000) }); // 2 min max
    if (!response.ok) throw new Error(`Network response was not ok (${response.status})`);
    
    const blob = await response.blob();
    await set(`track-${trackId}`, blob);
    await enforceCacheLimit();
  } catch (error) {
    console.error(`Failed to cache track ${trackId}:`, error);
  }
}

async function enforceCacheLimit() {
  try {
    const allKeys = await keys();
    const trackKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith('track-'));
    
    // Very simple limiting: if we exceed limit, delete the oldest
    // idb-keyval roughly preserves insertion order in V8, ensuring oldest are typically cleared first
    if (trackKeys.length > MAX_CACHED_TRACKS) {
      const excess = trackKeys.length - MAX_CACHED_TRACKS;
      const keysToDelete = trackKeys.slice(0, excess);
      await Promise.all(keysToDelete.map(k => del(k)));
    }
  } catch (err) {
    console.error("Cache enforce limit error:", err);
  }
}
