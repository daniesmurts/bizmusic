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
  
  // Actions
  setTrack: (track: Track) => void;
  togglePlay: () => void;
  setPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  addToQueue: (track: Track) => void;
  nextTrack: () => void;
  prevTrack: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.8,
  progress: 0,
  queue: [],

  setTrack: (track) => set({ currentTrack: track, isPlaying: true, progress: 0 }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
  
  nextTrack: () => set((state) => {
    if (state.queue.length === 0) return state;
    const next = state.queue[0];
    return {
      currentTrack: next,
      queue: state.queue.slice(1),
      progress: 0,
      isPlaying: true
    };
  }),
  
  prevTrack: () => set((state) => ({ progress: 0 })), // Simplification for now
}));
