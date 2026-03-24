"use client";

import { AlbumWithTracks } from "@/types/admin";
import { 
  Play, 
  Edit2, 
  Trash2, 
  Music, 
  Calendar, 
  User,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface AlbumTableProps {
  albums: AlbumWithTracks[];
  onEdit: (album: AlbumWithTracks) => void;
  onDelete: (id: string) => void;
  onPlay?: (album: AlbumWithTracks) => void;
}

export function AlbumTable({ albums, onEdit, onDelete, onPlay }: AlbumTableProps) {
  if (albums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
        <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
          <Music className="w-10 h-10 text-neutral-600" />
        </div>
        <h3 className="text-xl font-black uppercase tracking-tight text-white mb-2">Альбомов пока нет</h3>
        <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">Создайте свой первый музыкальный сборник</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {albums.map((album) => (
        <div 
          key={album.id} 
          className="group relative bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 hover:border-white/10 transition-all duration-500 hover:-translate-y-1"
        >
          {/* Cover Art */}
          <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-6 bg-white/5 border border-white/10 group-hover:border-neon/20 transition-all">
            {album.coverUrl ? (
              <img 
                src={album.coverUrl} 
                alt={album.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-12 h-12 text-neutral-700" />
              </div>
            )}
            
            {/* Play Overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                onClick={() => onPlay?.(album)}
                className="w-16 h-16 rounded-full bg-neon text-black hover:scale-110 transition-transform shadow-[0_0_30px_rgba(92,243,135,0.4)]"
              >
                <Play className="w-8 h-8 fill-current" />
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-neon transition-colors truncate">
                {album.title}
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 mt-1">
                <User className="w-3 h-3" />
                <span>{album.artist}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  <Music className="w-3 h-3" />
                  <span>{album.tracks?.length || 0} треков</span>
                </div>
                {album.releaseDate && (
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-600">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(album.releaseDate), "yyyy", { locale: ru })}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(album)}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-neutral-400 hover:text-white transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm("Вы уверены, что хотите удалить этот альбом?")) {
                      onDelete(album.id);
                    }
                  }}
                  className="w-10 h-10 rounded-xl bg-red-500/5 border border-red-500/5 hover:bg-red-500/10 hover:border-red-500/10 text-red-500/50 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
