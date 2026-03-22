"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Music, ListMusic, Plus, Upload, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackUploader } from "@/components/admin/TrackUploader";
import { TrackMetadataForm } from "@/components/admin/TrackMetadataForm";
import { TrackTable } from "@/components/admin/TrackTable";
import { PlaylistEditor } from "@/components/admin/PlaylistEditor";
import {
  getTracksAction,
  createTrackAction,
  updateTrackAction,
  deleteTrackAction,
  type TrackInput,
} from "@/lib/actions/tracks";
import {
  getPlaylistsAction,
  createPlaylistAction,
  deletePlaylistAction,
  updatePlaylistTracksAction,
} from "@/lib/actions/playlists";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AdminTrack, AdminPlaylist } from "@/types/admin";
import { usePlayerStore } from "@/store/usePlayerStore";

type ContentView = "tracks" | "playlists";

export default function AdminContentPage() {
  const queryClient = useQueryClient();

  // Listen for playback events to refresh play counts
  useEffect(() => {
    const handleTrackPlayed = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tracks"] });
    };

    window.addEventListener('track-played', handleTrackPlayed);
    return () => window.removeEventListener('track-played', handleTrackPlayed);
  }, [queryClient]);
  const [currentView, setCurrentView] = useState<ContentView>("tracks");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingTrack, setEditingTrack] = useState<AdminTrack | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    fileName: string;
    url: string;
    duration: number;
  } | null>(null);

  // Fetch tracks
  const { data: tracksData } = useQuery({
    queryKey: ["admin-tracks"],
    queryFn: async () => {
      const result = await getTracksAction();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as AdminTrack[];
    },
  });

  // Fetch playlists
  const { data: playlistsData } = useQuery({
    queryKey: ["admin-playlists"],
    queryFn: async () => {
      const result = await getPlaylistsAction();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as AdminPlaylist[];
    },
  });

  // Create track mutation
  const createTrackMutation = useMutation({
    mutationFn: async (data: TrackInput) => {
      const result = await createTrackAction(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tracks"] });
      toast.success("Трек успешно создан!");
      setShowUploadModal(false);
      setUploadedFile(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update track mutation
  const updateTrackMutation = useMutation({
    mutationFn: async ({ trackId, data }: { trackId: string; data: Partial<TrackInput> }) => {
      const result = await updateTrackAction(trackId, data);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tracks"] });
      toast.success("Трек обновлен!");
      setEditingTrack(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete track mutation
  const deleteTrackMutation = useMutation({
    mutationFn: async (trackId: string) => {
      const result = await deleteTrackAction(trackId);
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tracks"] });
      toast.success("Трек удален");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Create playlist mutation
  const createPlaylistMutation = useMutation({
    mutationFn: async (name: string) => {
      const result = await createPlaylistAction({ name });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-playlists"] });
      toast.success("Плейлист создан!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete playlist mutation
  const deletePlaylistMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      const result = await deletePlaylistAction(playlistId);
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-playlists"] });
      toast.success("Плейлист удален");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
  
  // Update playlist tracks mutation
  const updatePlaylistTracksMutation = useMutation({
    mutationFn: async ({ playlistId, trackIds }: { playlistId: string; trackIds: string[] }) => {
      const result = await updatePlaylistTracksAction(playlistId, trackIds);
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-playlists"] });
      toast.success("Состав плейлиста сохранен!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleUploadComplete = useCallback(
    (fileName: string, url: string, duration: number) => {
      setUploadedFile({ fileName, url, duration });
    },
    []
  );

  const handleSaveTrack = (formData: {
    title: string;
    artist: string;
    bpm?: number;
    genre: string;
    moodTags: string[];
    energyLevel: number;
    isExplicit: boolean;
  }) => {
    if (editingTrack) {
      updateTrackMutation.mutate({
        trackId: editingTrack.id,
        data: {
          ...formData,
          fileUrl: editingTrack.fileUrl,
        },
      });
    } else if (uploadedFile) {
      createTrackMutation.mutate({
        ...formData,
        fileUrl: uploadedFile.url, // Store the full public URL
        fileName: uploadedFile.fileName,
        duration: Math.round(uploadedFile.duration),
      });
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    await deleteTrackMutation.mutateAsync(trackId);
  };
  
  const handleToggleFeatured = async (trackId: string, isFeatured: boolean) => {
    await updateTrackMutation.mutateAsync({ 
      trackId, 
      data: { isFeatured } 
    });
  };

  const setTrack = usePlayerStore((state) => state.setTrack);

  const handlePlayTrack = (track: AdminTrack) => {
    setTrack({
      id: track.id,
      title: track.title,
      artist: track.artist,
      fileUrl: track.fileUrl,
      streamUrl: track.streamUrl,
      duration: track.duration,
    });
    toast.info(`Воспроизведение: ${track.title}`);
  };

  const handleEditTrack = (track: AdminTrack) => {
    setEditingTrack(track);
  };

  const handleCreatePlaylist = (name: string) => {
    createPlaylistMutation.mutate(name);
  };

  const handleUpdatePlaylist = (playlistId: string, trackIds: string[]) => {
    updatePlaylistTracksMutation.mutate({ playlistId, trackIds });
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    await deletePlaylistMutation.mutateAsync(playlistId);
  };

  const tracks: AdminTrack[] = tracksData || [];
  const playlists: AdminPlaylist[] = playlistsData || [];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-neutral-500">
            {currentView === "tracks" ? (
              <>
                <Music className="w-4 h-4 text-neon" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Медиатека • Управление контентом
                </span>
              </>
            ) : (
              <>
                <ListMusic className="w-4 h-4 text-neon" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Плейлисты • Курирование
                </span>
              </>
            )}
          </div>
          <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none">
            {currentView === "tracks" ? (
              <>
                Музыкальная <br />
                <span className="text-neon underline decoration-neon/20 underline-offset-8">
                  Библиотека
                </span>
              </>
            ) : (
              <>
                Управление <br />
                <span className="text-neon underline decoration-neon/20 underline-offset-8">
                  Плейлистами
                </span>
              </>
            )}
          </h1>
        </div>

        <div className="flex gap-4">
          {/* View Toggle */}
          <div className="flex bg-white/[0.02] border border-white/10 rounded-2xl p-1">
            <button
              onClick={() => setCurrentView("tracks")}
              className={cn(
                "px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                currentView === "tracks"
                  ? "bg-neon text-black shadow-[0_0_20px_rgba(92,243,135,0.3)]"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              <Music className="w-4 h-4" />
              Треки
            </button>
            <button
              onClick={() => setCurrentView("playlists")}
              className={cn(
                "px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                currentView === "playlists"
                  ? "bg-neon text-black shadow-[0_0_20px_rgba(92,243,135,0.3)]"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              <ListMusic className="w-4 h-4" />
              Плейлисты
            </button>
          </div>

          {currentView === "tracks" && (
            <Button
              onClick={() => setShowUploadModal(true)}
              className="bg-neon text-black hover:scale-105 transition-transform rounded-2xl px-8 h-14 font-black uppercase tracking-widest shadow-[0_0_20px_rgba(92,243,135,0.3)] gap-3"
            >
              <Plus className="w-5 h-5" />
              Добавить трек
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {currentView === "tracks" ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="glass-dark border border-white/5 rounded-2xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
                Всего треков
              </p>
              <p className="text-4xl font-black text-white">{tracks.length}</p>
            </div>
            <div className="glass-dark border border-white/5 rounded-2xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
                С явным контентом (18+)
              </p>
              <p className="text-4xl font-black text-red-400">
                {tracks.filter((t) => t.isExplicit).length}
              </p>
            </div>
            <div className="glass-dark border border-white/5 rounded-2xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
                Популярные (Featured)
              </p>
              <p className="text-4xl font-black text-amber-400">
                {tracks.filter((t) => t.isFeatured).length}
              </p>
            </div>
            <div className="glass-dark border border-white/5 rounded-2xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
                Всего проигрываний
              </p>
              <p className="text-4xl font-black text-neon">
                {tracks
                  .reduce((sum, t) => sum + (t._count?.playLogs || 0), 0)
                  .toLocaleString("ru-RU")}
              </p>
            </div>
            <div className="glass-dark border border-white/5 rounded-2xl p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">
                Общая длительность
              </p>
              <p className="text-4xl font-black text-purple-400">
                {(() => {
                  const totalSeconds = tracks.reduce((sum, t) => sum + t.duration, 0);
                  const coreHours = Math.floor(totalSeconds / 3600);
                  const coreMins = Math.round((totalSeconds % 3600) / 60);
                  if (coreHours > 0) return `${coreHours}ч ${coreMins}м`;
                  return `${coreMins}м`;
                })()}
              </p>
            </div>
          </div>

          {/* Track Table */}
          <TrackTable
            tracks={tracks}
            onEdit={handleEditTrack}
            onDelete={handleDeleteTrack}
            onPlay={handlePlayTrack}
            onToggleFeatured={handleToggleFeatured}
          />
        </>
      ) : (
        <PlaylistEditor
          tracks={tracks}
          playlists={playlists}
          onCreatePlaylist={handleCreatePlaylist}
          onUpdatePlaylist={handleUpdatePlaylist}
          onDeletePlaylist={handleDeletePlaylist}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="glass-dark border border-white/10 rounded-[3rem] p-8 md:p-12 relative">
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadedFile(null);
                }}
                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors group"
              >
                <X className="w-5 h-5 text-neutral-400 group-hover:text-white" />
              </button>

              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 text-neutral-500 mb-4">
                  <Upload className="w-4 h-4 text-neon" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {uploadedFile ? "Информация о треке" : "Загрузка файла"}
                  </span>
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
                  {uploadedFile ? "Данные трека" : "Загрузить новый трек"}
                </h2>
              </div>

              {/* Content */}
              {!uploadedFile ? (
                <TrackUploader onUploadComplete={handleUploadComplete} />
              ) : (
                <TrackMetadataForm
                  fileName={uploadedFile.fileName}
                  fileUrl={uploadedFile.url}
                  duration={uploadedFile.duration}
                  onSubmit={handleSaveTrack}
                  onCancel={() => {
                    setShowUploadModal(false);
                    setUploadedFile(null);
                  }}
                />
              )}

              {/* Loading State */}
              {(createTrackMutation.isPending || updateTrackMutation.isPending) && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-[3rem] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-neon/30 border-t-neon rounded-full animate-spin" />
                    <p className="text-white font-black uppercase tracking-widest text-sm">
                      Сохранение...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTrack && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="glass-dark border border-white/10 rounded-[3rem] p-8 md:p-12 relative">
              {/* Close Button */}
              <button
                onClick={() => setEditingTrack(null)}
                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors group"
              >
                <X className="w-5 h-5 text-neutral-400 group-hover:text-white" />
              </button>

              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 text-neutral-500 mb-4">
                  <Save className="w-4 h-4 text-neon" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Редактирование
                  </span>
                </div>
                <h2 className="text-4xl font-black uppercase tracking-tighter text-white">
                  Изменить трек
                </h2>
              </div>

              {/* Form */}
              <TrackMetadataForm
                fileName={editingTrack.fileUrl}
                fileUrl={editingTrack.streamUrl || editingTrack.fileUrl}
                duration={editingTrack.duration}
                onSubmit={handleSaveTrack}
                onCancel={() => setEditingTrack(null)}
                initialData={editingTrack}
              />

              {/* Loading State */}
              {updateTrackMutation.isPending && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-[3rem] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-neon/30 border-t-neon rounded-full animate-spin" />
                    <p className="text-white font-black uppercase tracking-widest text-sm">
                      Сохранение...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
