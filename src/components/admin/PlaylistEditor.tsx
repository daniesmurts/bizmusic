"use client";

import { useState, useMemo } from "react";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Music,
  Plus,
  Trash2,
  GripVertical,
  Clock,
  Zap,
  X,
  Save,
  ListMusic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  bpm?: number | null;
  moodTags: string[];
}

interface Playlist {
  id: string;
  name: string;
  businessId?: string | null;
  tracks?: { track: Track }[];
}

interface PlaylistEditorProps {
  tracks: Track[];
  playlists: Playlist[];
  onCreatePlaylist: (name: string) => void;
  onUpdatePlaylist: (playlistId: string, trackIds: string[]) => void;
  onDeletePlaylist: (playlistId: string) => void;
}

// Sortable Track Item Component
function SortableTrackItem({
  track,
  onRemove,
  index,
}: {
  track: Track;
  onRemove: () => void;
  index: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl",
        "hover:border-neon/30 hover:bg-neon/5 transition-all"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors"
      >
        <GripVertical className="w-5 h-5 text-neutral-500" />
      </div>

      {/* Track Number */}
      <div className="w-8 h-8 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center">
        <span className="text-sm font-black text-neon">{index + 1}</span>
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-black uppercase tracking-tight truncate">
          {track.title}
        </p>
        <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
          {track.artist}
        </p>
      </div>

      {/* Duration */}
      <div className="flex items-center gap-2 text-neutral-400">
        <Clock className="w-4 h-4" />
        <span className="text-sm font-bold">{formatDuration(track.duration)}</span>
      </div>

      {/* BPM */}
      {track.bpm && (
        <div className="flex items-center gap-2 text-neutral-400">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-bold">{track.bpm}</span>
        </div>
      )}

      {/* Mood Tags */}
      <div className="hidden lg:flex flex-wrap gap-1 max-w-[150px]">
        {track.moodTags.slice(0, 2).map((tag) => (
          <Badge
            key={tag}
            className="bg-white/5 border-white/10 text-neutral-400 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
          >
            {tag}
          </Badge>
        ))}
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/30 transition-colors group/btn"
      >
        <X className="w-4 h-4 text-neutral-400 group-hover/btn:text-red-400" />
      </button>
    </div>
  );
}

export const PlaylistEditor = ({
  tracks,
  playlists,
  onCreatePlaylist,
  onUpdatePlaylist,
  onDeletePlaylist,
}: PlaylistEditorProps) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    playlists[0]?.id || null
  );
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [showTrackSelector, setShowTrackSelector] = useState(false);

  // Get available tracks (not in current playlist)
  const availableTracks = useMemo(() => {
    const playlistTrackIds = new Set(playlistTracks.map((t) => t.id));
    return tracks.filter((t) => !playlistTrackIds.has(t.id));
  }, [tracks, playlistTracks]);

  // Load playlist tracks when selected playlist changes
  const loadPlaylist = (playlistId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (playlist?.tracks) {
      setPlaylistTracks(playlist.tracks.map((pt) => pt.track));
    } else {
      setPlaylistTracks([]);
    }
    setSelectedPlaylistId(playlistId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPlaylistTracks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddTrack = (track: Track) => {
    setPlaylistTracks([...playlistTracks, track]);
    setShowTrackSelector(false);
  };

  const handleRemoveTrack = (trackId: string) => {
    setPlaylistTracks(playlistTracks.filter((t) => t.id !== trackId));
  };

  const handleSavePlaylist = () => {
    if (!selectedPlaylistId) return;

    const trackIds = playlistTracks.map((t) => t.id);
    onUpdatePlaylist(selectedPlaylistId, trackIds);
    toast.success("Плейлист сохранен!");
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      toast.error("Введите название плейлиста");
      return;
    }

    onCreatePlaylist(newPlaylistName.trim());
    setNewPlaylistName("");
    setShowCreateModal(false);
  };

  const handleDeletePlaylist = () => {
    if (!selectedPlaylistId) return;

    const confirmed = confirm(
      "Вы уверены, что хотите удалить этот плейлист?"
    );
    if (confirmed) {
      onDeletePlaylist(selectedPlaylistId);
      setSelectedPlaylistId(null);
      setPlaylistTracks([]);
    }
  };

  const totalDuration = playlistTracks.reduce(
    (sum, t) => sum + t.duration,
    0
  );
  const totalMinutes = Math.round(totalDuration / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-neon/10 border border-neon/20 flex items-center justify-center">
            <ListMusic className="w-7 h-7 text-neon" />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
              Плейлисты
            </h2>
            <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
              {playlists.length} плейлистов
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-white/10 hover:bg-white/20 text-white rounded-2xl h-12 px-6 font-black uppercase tracking-widest gap-2"
        >
          <Plus className="w-5 h-5" />
          Создать
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Playlist Selector */}
        <div className="space-y-4">
          <Label className="text-white font-black uppercase tracking-widest text-xs">
            Выберите плейлист
          </Label>

          <div className="space-y-2">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => loadPlaylist(playlist.id)}
                className={cn(
                  "w-full p-4 rounded-2xl border text-left transition-all",
                  selectedPlaylistId === playlist.id
                    ? "bg-neon/10 border-neon/20"
                    : "bg-white/[0.02] border-white/5 hover:border-white/10"
                )}
              >
                <p className="text-white font-black uppercase tracking-tight">
                  {playlist.name}
                </p>
                {playlist.businessId && (
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">
                    Для бизнеса
                  </p>
                )}
              </button>
            ))}

            {playlists.length === 0 && (
              <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl">
                <Music className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400 text-sm font-bold uppercase tracking-widest">
                  Нет плейлистов
                </p>
              </div>
            )}
          </div>

          {/* Delete Playlist Button */}
          {selectedPlaylistId && (
            <Button
              onClick={handleDeletePlaylist}
              variant="outline"
              className="w-full bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-2xl h-12 font-black uppercase tracking-widest gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Удалить плейлист
            </Button>
          )}
        </div>

        {/* Playlist Editor */}
        <div className="lg:col-span-2 space-y-6">
          {selectedPlaylistId ? (
            <>
              {/* Stats */}
              <div className="flex items-center gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                    Треков
                  </p>
                  <p className="text-3xl font-black text-white">
                    {playlistTracks.length}
                  </p>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                    Длительность
                  </p>
                  <p className="text-3xl font-black text-neon">
                    {hours}ч {minutes}м
                  </p>
                </div>
              </div>

              {/* Track List */}
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={playlistTracks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {playlistTracks.map((track, index) => (
                      <SortableTrackItem
                        key={track.id}
                        track={track}
                        index={index}
                        onRemove={() => handleRemoveTrack(track.id)}
                      />
                    ))}

                    {playlistTracks.length === 0 && (
                      <div className="p-12 text-center bg-white/[0.02] border border-white/5 rounded-2xl">
                        <Music className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                        <p className="text-white font-black uppercase tracking-tight mb-2">
                          Плейлист пуст
                        </p>
                        <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
                          Добавьте треки из библиотеки
                        </p>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Add Track Button */}
              <Button
                onClick={() => setShowTrackSelector(true)}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl h-14 font-black uppercase tracking-widest gap-2"
              >
                <Plus className="w-5 h-5" />
                Добавить трек
              </Button>

              {/* Save Button */}
              <Button
                onClick={handleSavePlaylist}
                className="w-full bg-neon text-black hover:scale-[1.02] transition-transform rounded-2xl h-14 font-black uppercase tracking-widest shadow-[0_0_20px_rgba(92,243,135,0.3)] gap-2"
              >
                <Save className="w-5 h-5" />
                Сохранить плейлист
              </Button>
            </>
          ) : (
            <div className="p-12 text-center bg-white/[0.02] border border-white/5 rounded-2xl h-full flex items-center justify-center">
              <div>
                <ListMusic className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                <p className="text-neutral-400 text-sm font-bold uppercase tracking-widest">
                  Выберите плейлист для редактирования
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl">
          <div className="w-full max-w-md">
            <div className="glass-dark border border-white/10 rounded-[3rem] p-8">
              <div className="mb-6">
                <h3 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
                  Новый плейлист
                </h3>
                <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
                  Создайте плейлист для курирования музыки
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="text-white font-black uppercase tracking-widest text-xs">
                    Название
                  </Label>
                  <Input
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Например: Morning Cafe"
                    className="mt-2 bg-white/[0.02] border-white/10 text-white rounded-2xl h-14 px-6"
                    autoFocus
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewPlaylistName("");
                    }}
                    variant="outline"
                    className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-2xl h-14 font-black uppercase tracking-widest"
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={handleCreatePlaylist}
                    className="flex-1 bg-neon text-black hover:scale-105 transition-transform rounded-2xl h-14 font-black uppercase tracking-widest"
                  >
                    Создать
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Track Selector Modal */}
      {showTrackSelector && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl">
          <div className="w-full max-w-2xl max-h-[70vh] overflow-y-auto">
            <div className="glass-dark border border-white/10 rounded-[3rem] p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-white">
                    Добавить трек
                  </h3>
                  <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
                    {availableTracks.length} доступных треков
                  </p>
                </div>
                <button
                  onClick={() => setShowTrackSelector(false)}
                  className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {availableTracks.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => handleAddTrack(track)}
                    className="w-full p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4 hover:border-neon/30 hover:bg-neon/5 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center">
                      <Plus className="w-5 h-5 text-neon" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black uppercase tracking-tight truncate">
                        {track.title}
                      </p>
                      <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
                        {track.artist}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-bold">
                        {Math.floor(track.duration / 60)}:
                        {(track.duration % 60).toString().padStart(2, "0")}
                      </span>
                    </div>
                  </button>
                ))}

                {availableTracks.length === 0 && (
                  <div className="p-12 text-center">
                    <Music className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400 text-sm font-bold uppercase tracking-widest">
                      Нет доступных треков
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
