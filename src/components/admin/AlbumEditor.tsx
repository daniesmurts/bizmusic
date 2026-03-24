"use client";

import { useState, useMemo, useEffect } from "react";
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
  X,
  Save,
  Image as ImageIcon,
  Calendar,
  User,
  Type
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "./ImageUpload";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AdminTrack, AlbumWithTracks, AdminArtist } from "@/types/admin";

interface AlbumEditorProps {
  tracks: AdminTrack[];
  artists?: AdminArtist[];
  initialData?: AlbumWithTracks | null;
  onSubmit: (data: {
    title: string;
    artist: string;
    artistId?: string;
    coverUrl?: string;
    description?: string;
    releaseDate?: string;
    trackIds: string[];
  }) => void;
  onCancel: () => void;
  isPending?: boolean;
}

function SortableTrackItem({
  track,
  onRemove,
  index,
}: {
  track: AdminTrack;
  onRemove: () => void;
  index: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
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
        "group flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl transition-all",
        isDragging ? "opacity-50 scale-105 z-50 ring-2 ring-neon/50 bg-neon/5" : "hover:border-white/10"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors"
      >
        <GripVertical className="w-5 h-5 text-neutral-500" />
      </div>

      <div className="w-8 h-8 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center">
        <span className="text-sm font-black text-neon">{index + 1}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white font-black uppercase tracking-tight truncate">{track.title}</p>
        <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest truncate">{track.artist}</p>
      </div>

      <div className="flex items-center gap-2 text-neutral-400 text-xs font-bold">
        <Clock className="w-3 h-3" />
        {formatDuration(track.duration)}
      </div>

      <button
        onClick={onRemove}
        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/20 group/btn transition-all"
      >
        <X className="w-4 h-4 text-neutral-500 group-hover/btn:text-red-400" />
      </button>
    </div>
  );
}

export function AlbumEditor({ tracks, artists = [], initialData, onSubmit, onCancel, isPending }: AlbumEditorProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [artist, setArtist] = useState(initialData?.artist || "");
  const [artistId, setArtistId] = useState<string | undefined>(initialData?.artistId || undefined);
  const [coverUrl, setCoverUrl] = useState(initialData?.coverUrl || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [releaseDate, setReleaseDate] = useState(
    initialData?.releaseDate ? new Date(initialData.releaseDate).toISOString().split('T')[0] : ""
  );
  const [albumTracks, setAlbumTracks] = useState<AdminTrack[]>(initialData?.tracks || []);
  const [showTrackSelector, setShowTrackSelector] = useState(false);
  const [showArtistDropdown, setShowArtistDropdown] = useState(false);

  const filteredArtists = artists.filter(a => 
    a.name.toLowerCase().includes(artist.toLowerCase())
  );

  const availableTracks = useMemo(() => {
    const selectedIds = new Set(albumTracks.map(t => t.id));
    return tracks.filter(t => !selectedIds.has(t.id));
  }, [tracks, albumTracks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setAlbumTracks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = () => {
    if (!title || !artist) {
      toast.error("Название и исполнитель обязательны");
      return;
    }
    onSubmit({
      title,
      artist,
      artistId,
      coverUrl,
      description,
      releaseDate,
      trackIds: albumTracks.map(t => t.id)
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid lg:grid-cols-2 gap-12">
        {/* Left Column: Metadata */}
        <div className="space-y-8">
          <div className="space-y-6 bg-white/[0.02] border border-white/5 p-8 rounded-[3rem]">
            <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
              <Type className="w-6 h-6 text-neon" />
              Информация об альбоме
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Название альбома</Label>
                <div className="relative group">
                  <Music className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-neon transition-colors" />
                  <Input 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    placeholder="Название альбома"
                    className="bg-white/5 border-white/10 rounded-2xl h-14 pl-12 text-lg font-bold transition-all focus:border-neon/50 focus:ring-neon/20"
                  />
                </div>
              </div>

              <div className="space-y-2 relative">
                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Исполнитель</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-neon transition-colors" />
                  <Input 
                    value={artist} 
                    onChange={(e) => {
                      setArtist(e.target.value);
                      setArtistId(undefined);
                      setShowArtistDropdown(true);
                    }} 
                    onFocus={() => setShowArtistDropdown(true)}
                    placeholder="Имя артиста или группы"
                    className="bg-white/5 border-white/10 rounded-2xl h-14 pl-12 text-lg font-bold transition-all focus:border-neon/50 focus:ring-neon/20 pr-12"
                  />
                  {artistId && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <Badge className="bg-neon/10 border-neon/20 text-neon rounded-full px-2 py-0.5 text-[8px] font-black uppercase">
                        Привязан
                      </Badge>
                    </div>
                  )}
                </div>
                
                {showArtistDropdown && filteredArtists.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-2 p-2 bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    {filteredArtists.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setArtist(a.name);
                          setArtistId(a.id);
                          setShowArtistDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
                          {a.imageUrl ? (
                            <img src={a.imageUrl} alt={a.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-4 h-4 text-neutral-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-white group-hover:text-neon transition-colors">
                            {a.name}
                          </p>
                          <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                            {a._count?.tracks || 0} треков
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {showArtistDropdown && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowArtistDropdown(false)} 
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Дата релиза</Label>
                <div className="relative group">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-neon transition-colors" />
                  <Input 
                    type="date"
                    value={releaseDate} 
                    onChange={(e) => setReleaseDate(e.target.value)} 
                    className="bg-white/5 border-white/10 rounded-2xl h-14 pl-12 text-lg font-bold transition-all focus:border-neon/50 focus:ring-neon/20 appearance-none flex-row-reverse"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Описание (необязательно)</Label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Расскажите об альбоме..."
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm font-bold text-white transition-all focus:outline-none focus:border-neon/50 focus:ring-2 focus:ring-neon/20 resize-none"
                />
              </div>
            </div>
          </div>

          <ImageUpload 
            onUploadComplete={(url) => setCoverUrl(url)} 
            defaultValue={coverUrl}
            label="Обложка альбома"
          />
        </div>

        {/* Right Column: Track List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center">
                   <Music className="w-5 h-5 text-neon" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white">Треклист</h3>
             </div>
             <Button
                onClick={() => setShowTrackSelector(true)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl h-10 px-4 font-black uppercase tracking-widest text-[10px] gap-2"
             >
                <Plus className="w-4 h-4" />
                Добавить треки
             </Button>
          </div>

          <div className="bg-white/[0.01] border border-white/5 rounded-[3rem] p-8 min-h-[400px]">
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={albumTracks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {albumTracks.map((track, index) => (
                    <SortableTrackItem 
                      key={track.id} 
                      track={track} 
                      index={index} 
                      onRemove={() => setAlbumTracks(albumTracks.filter(t => t.id !== track.id))} 
                    />
                  ))}
                  
                  {albumTracks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                      <Music className="w-12 h-12 text-neutral-700" />
                      <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">Список треков пуст</p>
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 h-16 rounded-2xl border-white/10 text-neutral-400 hover:text-white uppercase font-black tracking-widest"
              disabled={isPending}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              className="flex-3 h-16 rounded-2xl bg-neon text-black font-black uppercase tracking-widest shadow-[0_0_30px_rgba(92,243,135,0.3)] gap-3 hover:scale-[1.02] transition-transform"
              disabled={isPending}
            >
              {isPending ? <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <Save className="w-6 h-6" />}
              {initialData ? "Сохранить изменения" : "Создать альбом"}
            </Button>
          </div>
        </div>
      </div>

      {/* Track Selector Modal */}
      {showTrackSelector && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="glass-dark border border-white/10 rounded-[4rem] p-10 relative">
              <button 
                onClick={() => setShowTrackSelector(false)}
                className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>

              <h3 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">Выбор треков</h3>
              <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mb-8">{availableTracks.length} треков доступно</p>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {availableTracks.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      setAlbumTracks([...albumTracks, track]);
                      toast.success(`Добавлено: ${track.title}`);
                    }}
                    className="w-full p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center justify-between group hover:border-neon hover:bg-neon/5 transition-all"
                  >
                    <div className="flex items-center gap-4 text-left">
                       <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-neon/30">
                          <Plus className="w-5 h-5 text-neutral-400 group-hover:text-neon" />
                       </div>
                       <div>
                          <p className="text-white font-black uppercase tracking-tight">{track.title}</p>
                          <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">{track.artist}</p>
                       </div>
                    </div>
                    <div className="text-neutral-600 text-xs font-bold font-mono">
                       {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                    </div>
                  </button>
                ))}
                
                {availableTracks.length === 0 && (
                   <div className="py-20 text-center opacity-30 uppercase font-black tracking-widest text-xs">Все треки уже добавлены</div>
                )}
              </div>
              
              <Button 
                onClick={() => setShowTrackSelector(false)}
                className="w-full mt-8 h-14 rounded-2xl bg-white text-black font-black uppercase tracking-widest"
              >
                Готово
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
