import { create } from "zustand";

export interface Track {
  id: string;
  title: string;
  artist: string;
  fileUrl: string;
  streamUrl?: string;
  duration: number;
  cover_url?: string;
}

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  queue: Track[];
  history: Track[];
  isShuffle: boolean;
  repeatMode: 'off' | 'one' | 'all';
  
  // Wave Mode
  isWaveMode: boolean;
  waveBusinessId: string | null;
  isFetchingWave: boolean;
  // Actions
  setTrack: (track: Track) => void;
  loadPlaylist: (tracks: Track[], startIndex?: number) => void;
  togglePlay: () => void;
  setPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  addToQueue: (track: Track) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  removeFromQueue: (index: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: 'off' | 'one' | 'all') => void;

  setWaveMode: (active: boolean, businessId?: string) => void;
  fetchNextWaveBatch: () => Promise<void>;
  skipWaveTrack: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.8,
  progress: 0,
  queue: [],
  history: [],
  isShuffle: false,
  repeatMode: 'off',
  isWaveMode: false,
  waveBusinessId: null,
  isFetchingWave: false,

  setTrack: (track) => set({ currentTrack: track, isPlaying: true, progress: 0 }),
  loadPlaylist: (tracks, startIndex = 0) => set({
    queue: tracks.slice(startIndex + 1), // queue is what's NEXT
    currentTrack: tracks[startIndex] || null,
    history: [],
    isPlaying: true,
    progress: 0
  }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
  reorderQueue: (startIndex, endIndex) => set((state) => {
    const result = Array.from(state.queue);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return { queue: result };
  }),
  removeFromQueue: (index) => set((state) => ({
    queue: state.queue.filter((_, i) => i !== index)
  })),
  toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
  setRepeatMode: (mode) => set({ repeatMode: mode }),

  setWaveMode: (active, businessId) => {
    set({ isWaveMode: active, waveBusinessId: businessId || null });
    if (active) {
       set({ queue: [], currentTrack: null, isPlaying: false, progress: 0 });
       usePlayerStore.getState().fetchNextWaveBatch();
    }
  },

  fetchNextWaveBatch: async () => {
    const state = usePlayerStore.getState();
    if (!state.isWaveMode || !state.waveBusinessId || state.isFetchingWave) return;
    
    set({ isFetchingWave: true });
    try {
      const response = await fetch('/api/wave/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: state.waveBusinessId,
          excludeTrackIds: state.queue.map(t => t.id)
        })
      });
      const data = await response.json();
      if (data.success && data.tracks.length > 0) {
        const mappedTracks = data.tracks.map((t: any) => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          fileUrl: t.fileUrl,
          streamUrl: t.streamUrl,
          duration: t.duration,
          cover_url: t.coverUrl,
        }));
        set((s) => ({ queue: [...s.queue, ...mappedTracks] }));
        
        const updatedState = usePlayerStore.getState();
        if (!updatedState.currentTrack && updatedState.queue.length > 0) {
          updatedState.nextTrack();
        }
      }
    } catch(err) {
      console.error("Failed to fetch wave batch:", err);
    } finally {
      set({ isFetchingWave: false });
    }
  },

  skipWaveTrack: () => {
    const state = usePlayerStore.getState();
    if (state.isWaveMode && state.waveBusinessId && state.currentTrack) {
       fetch('/api/wave/skip', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ businessId: state.waveBusinessId, trackId: state.currentTrack.id, reason: "Manual Skip in Wave Mode" })
       }).catch(console.error);
    }
    state.nextTrack();
  },
  
  nextTrack: () => {
    const currentState = usePlayerStore.getState();
    if (currentState.isWaveMode && currentState.queue.length <= 3 && !currentState.isFetchingWave) {
      setTimeout(() => usePlayerStore.getState().fetchNextWaveBatch(), 0);
    }

    set((state) => {
      if (state.repeatMode === 'one' && state.currentTrack) {
        return { progress: 0, isPlaying: true };
      }
      
      if (state.queue.length === 0) {
        if (state.repeatMode === 'all' && state.currentTrack) {
          return { progress: 0, isPlaying: false }; 
        }
        return { isPlaying: false, progress: 0 };
      }
      
      let nextIndex = 0;
      if (state.isShuffle && state.queue.length > 1) {
        nextIndex = Math.floor(Math.random() * state.queue.length);
      }
      
      const next = state.queue[nextIndex];
      const newQueue = state.queue.filter((_, i) => i !== nextIndex);
      const newHistory = state.currentTrack
        ? [...state.history, state.currentTrack]
        : state.history;
      
      return {
        currentTrack: next,
        queue: newQueue,
        history: newHistory,
        progress: 0,
        isPlaying: true
      };
    });
  },
  
  prevTrack: () => set((state) => {
    if (state.history.length === 0) {
      // No history — just restart current track
      return { progress: 0 };
    }
    const prev = state.history[state.history.length - 1];
    const newHistory = state.history.slice(0, -1);
    const newQueue = state.currentTrack
      ? [state.currentTrack, ...state.queue]
      : state.queue;
    return {
      currentTrack: prev,
      queue: newQueue,
      history: newHistory,
      progress: 0,
      isPlaying: true,
    };
  }),
}));
