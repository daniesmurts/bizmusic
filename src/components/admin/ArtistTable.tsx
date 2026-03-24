"use client";

import { AdminArtist } from "@/types/admin";
import { 
  User, 
  Music, 
  Library, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  ExternalLink,
  Star
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ArtistTableProps {
  artists: AdminArtist[];
  onEdit: (artist: AdminArtist) => void;
  onDelete: (id: string) => void;
  onViewProfile?: (slug: string) => void;
}

export const ArtistTable = ({
  artists,
  onEdit,
  onDelete,
  onViewProfile,
}: ArtistTableProps) => {
  return (
    <div className="glass-dark border border-white/10 rounded-[2rem] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.01]">
              <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Артист
              </th>
              <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Статус
              </th>
              <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-center">
                Треков
              </th>
              <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-center">
                Альбомов
              </th>
              <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Дата создания
              </th>
              <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-neutral-500 text-right">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {artists.map((artist) => (
              <tr
                key={artist.id}
                className="group hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex-shrink-0 relative">
                      {artist.imageUrl ? (
                        <img
                          src={artist.imageUrl}
                          alt={artist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-6 h-6 text-neutral-600" />
                        </div>
                      )}
                      {artist.isFeatured && (
                        <div className="absolute top-1 right-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-black uppercase tracking-tight group-hover:text-neon transition-colors">
                        {artist.name}
                      </p>
                      <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                        /{artist.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6">
                  {artist.isFeatured ? (
                    <Badge className="bg-amber-400/10 border-amber-400/20 text-amber-400 rounded-full text-[9px] font-black uppercase tracking-widest px-3">
                      Рекомендуемый
                    </Badge>
                  ) : (
                    <Badge className="bg-white/5 border-white/10 text-neutral-500 rounded-full text-[9px] font-black uppercase tracking-widest px-3">
                      Обычный
                    </Badge>
                  )}
                </td>
                <td className="px-6 py-6 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <Music className="w-3 h-3 text-neon" />
                    <span className="text-sm font-black text-white">
                      {artist._count?.tracks || 0}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-6 text-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <Library className="w-3 h-3 text-purple-400" />
                    <span className="text-sm font-black text-white">
                      {artist._count?.albums || 0}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <p className="text-sm font-bold text-neutral-400">
                    {artist.createdAt 
                      ? new Date(artist.createdAt).toLocaleDateString('ru-RU')
                      : '—'}
                  </p>
                </td>
                <td className="px-6 py-6 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-10 h-10 p-0 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 bg-[#0A0A0A] border-white/10 rounded-2xl p-2"
                    >
                      <DropdownMenuItem
                        onClick={() => onEdit(artist)}
                        className="flex items-center gap-3 p-3 rounded-xl text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-white focus:bg-white/5 focus:text-white cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4 text-neon" />
                        Изменить
                      </DropdownMenuItem>
                      {onViewProfile && (
                        <DropdownMenuItem
                          onClick={() => onViewProfile(artist.slug)}
                          className="flex items-center gap-3 p-3 rounded-xl text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-white focus:bg-white/5 focus:text-white cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4 text-blue-400" />
                          Профиль
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          if (confirm("Вы уверены, что хотите удалить этот профиль?")) {
                            onDelete(artist.id);
                          }
                        }}
                        className="flex items-center gap-3 p-3 rounded-xl text-xs font-black uppercase tracking-widest text-red-400 hover:text-red-300 focus:bg-red-500/10 focus:text-red-300 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}

            {artists.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                      <User className="w-8 h-8 text-neutral-600" />
                    </div>
                    <div>
                      <p className="text-white font-black uppercase tracking-tight">
                        Список пуст
                      </p>
                      <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">
                        Добавьте первого артиста в вашу библиотеку
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
