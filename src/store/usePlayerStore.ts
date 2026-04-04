import { create } from "zustand";

export interface Track {
  id: string;
  title: string;
  artist: string;
  fileUrl: string;
  streamUrl?: string;
  duration: number;
  cover_url?: string;
  isAnnouncement?: boolean;
  announcementId?: string; // voiceAnnouncements.id for logging
}

export interface AnnouncementScheduleState {
  enabled: boolean;
  frequency: number; // every N tracks
  mode: "sequential" | "random" | "weighted";
  announcements: Track[];
  weights: Record<string, number>;
  nextIndex: number;
  tracksSinceLastAnnouncement: number;
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
  activeLocationId: string | null;
  isFetchingWave: boolean;
  waveError: string | null;

  // Announcement Scheduling
  announcementSchedule: AnnouncementScheduleState;

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
  setActiveLocationId: (locationId: string | null) => void;
  fetchNextWaveBatch: () => Promise<void>;
  skipWaveTrack: () => void;

  // Announcement scheduling actions
  setAnnouncementSchedule: (config: Partial<AnnouncementScheduleState>) => void;
  loadAnnouncementQueue: (announcements: Track[], config?: { frequency?: number; mode?: "sequential" | "random" | "weighted"; weights?: Record<string, number> }) => void;
  disableAnnouncementSchedule: () => void;
}

const defaultAnnouncementSchedule: AnnouncementScheduleState = {
  enabled: false,
  frequency: 0,
  mode: "sequential",
  announcements: [],
  weights: {},
  nextIndex: 0,
  tracksSinceLastAnnouncement: 0,
};

function pickNextAnnouncement(schedule: AnnouncementScheduleState): Track | null {
  if (schedule.announcements.length === 0) return null;

  if (schedule.mode === "random") {
    const idx = Math.floor(Math.random() * schedule.announcements.length);
    return schedule.announcements[idx];
  }

  if (schedule.mode === "weighted") {
    // Weighted random: higher weight = more likely
    const weighted: { track: Track; weight: number }[] = schedule.announcements.map((a) => ({
      track: a,
      weight: schedule.weights[a.id] ?? 5,
    }));
    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const entry of weighted) {
      rand -= entry.weight;
      if (rand <= 0) return entry.track;
    }
    return weighted[weighted.length - 1].track;
  }

  // Sequential
  const idx = schedule.nextIndex % schedule.announcements.length;
  return schedule.announcements[idx];
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
  activeLocationId: null,
  isFetchingWave: false,
  waveError: null,
  announcementSchedule: { ...defaultAnnouncementSchedule },

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

  // Announcement scheduling actions
  setAnnouncementSchedule: (config) => set((state) => ({
    announcementSchedule: { ...state.announcementSchedule, ...config },
  })),

  loadAnnouncementQueue: (announcements, config) => set((state) => ({
    announcementSchedule: {
      ...state.announcementSchedule,
      enabled: true,
      announcements,
      frequency: config?.frequency ?? state.announcementSchedule.frequency,
      mode: config?.mode ?? state.announcementSchedule.mode,
      weights: config?.weights ?? state.announcementSchedule.weights,
      nextIndex: 0,
      tracksSinceLastAnnouncement: 0,
    },
  })),

  disableAnnouncementSchedule: () => set({
    announcementSchedule: { ...defaultAnnouncementSchedule },
  }),

  setWaveMode: (active, businessId) => {
    set({ isWaveMode: active, waveBusinessId: businessId || null, waveError: null });
    if (active) {
       set({ queue: [], history: [], currentTrack: null, isPlaying: false, progress: 0 });
       usePlayerStore.getState().fetchNextWaveBatch();
    }
  },

  setActiveLocationId: (locationId) => set({ activeLocationId: locationId }),

  fetchNextWaveBatch: async () => {
    const state = usePlayerStore.getState();
    if (!state.isWaveMode || !state.waveBusinessId || state.isFetchingWave) return;
    
    set({ isFetchingWave: true, waveError: null });
    try {
      const response = await fetch('/api/wave/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: state.waveBusinessId,
          excludeTrackIds: [
            ...state.queue.map((t) => t.id),
            ...(state.currentTrack ? [state.currentTrack.id] : []),
          ],
        })
      });
      if (!response.ok) {
        throw new Error(`Wave API error: ${response.status}`);
      }
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Wave generation failed");
      }

      if (data.tracks.length > 0) {
        const mappedTracks: Track[] = (data.tracks as Array<{
          id: string;
          title: string;
          artist: string;
          fileUrl: string;
          streamUrl?: string;
          duration: number;
          coverUrl?: string;
        }>).map((t) => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          fileUrl: t.fileUrl,
          streamUrl: t.streamUrl,
          duration: t.duration,
          cover_url: t.coverUrl,
        }));

        // Start playback immediately when Wave is empty; otherwise just append.
        set((s) => {
          const mergedQueue = [...s.queue, ...mappedTracks];
          if (!s.currentTrack && mergedQueue.length > 0) {
            const [first, ...rest] = mergedQueue;
            return {
              currentTrack: first,
              queue: rest,
              isPlaying: true,
              progress: 0,
            };
          }
          return { queue: mergedQueue };
        });
      }
    } catch(err) {
      console.error("Failed to fetch wave batch:", err);
      const message = err instanceof Error ? err.message : "Не удалось загрузить треки Бизнес-Волны";
      set({ waveError: message });
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
         body: JSON.stringify({
           businessId: state.waveBusinessId,
           locationId: state.activeLocationId,
           trackId: state.currentTrack.id,
           reason: "Manual Skip in Wave Mode"
         })
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

      // Check if it's time for an announcement injection
      const schedule = state.announcementSchedule;
      if (
        schedule.enabled &&
        schedule.frequency > 0 &&
        schedule.announcements.length > 0 &&
        schedule.tracksSinceLastAnnouncement + 1 >= schedule.frequency
      ) {
        const announcement = pickNextAnnouncement(schedule);
        if (announcement) {
          const newHistory = state.currentTrack
            ? [...state.history, state.currentTrack]
            : state.history;

          return {
            currentTrack: announcement,
            history: newHistory,
            progress: 0,
            isPlaying: true,
            announcementSchedule: {
              ...schedule,
              tracksSinceLastAnnouncement: 0,
              nextIndex: schedule.mode === "sequential"
                ? (schedule.nextIndex + 1) % schedule.announcements.length
                : schedule.nextIndex,
            },
          };
        }
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
        isPlaying: true,
        announcementSchedule: {
          ...state.announcementSchedule,
          tracksSinceLastAnnouncement: state.announcementSchedule.enabled
            ? state.announcementSchedule.tracksSinceLastAnnouncement + 1
            : 0,
        },
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
