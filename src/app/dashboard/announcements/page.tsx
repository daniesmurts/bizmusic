"use client";

import React, { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAnnouncementsAction,
  deleteAnnouncementAction,
  getAnnouncementEntitlementStatusAction,
} from "@/lib/actions/voice-announcements";
import { getAiAssistStatusAction } from "@/lib/actions/ai-assists";
import { getPlaylistsAction, addTrackToPlaylistAction } from "@/lib/actions/playlists";
import { purchaseTtsTokensAction } from "@/lib/actions/payments";
import { TTS_TOKEN_PACKS } from "@/lib/payments/plans";
import { VoiceAnnouncementForm } from "@/components/dashboard/VoiceAnnouncementForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Volume2, 
  Trash2, 
  Music, 
  Calendar, 
  Clock, 
  ChevronRight,
  MessageSquare,
  Play,
  ShieldCheck,
  ListPlus,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface PlaylistSummary {
  id: string;
  name: string;
  _count: {
    tracks: number;
  };
}

interface AnnouncementItem {
  id: string;
  text: string;
  provider: string;
  voiceName: string;
  createdAt: string | Date;
  track: {
    id: string;
    title: string;
    duration: number;
    fileUrl: string;
  };
}

interface EntitlementStatus {
  monthlyLimit: number;
  monthlyUsed: number;
  monthlyRemaining: number;
  paidTokens: number;
  nextMonthlyResetAt: string | Date | null;
  nearestPackExpiryAt: string | Date | null;
  canGenerate: boolean;
  denialReason?: string;
}

interface AiEntitlementStatus {
  monthlyLimit: number;
  monthlyUsed: number;
  monthlyRemaining: number;
  paidTokens: number;
  nextMonthlyResetAt: string | Date | null;
  nearestPackExpiryAt: string | Date | null;
  canAssist: boolean;
  denialReason?: string;
}

function formatRubFromKopeks(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

function formatRuDate(value: string | Date | null | undefined) {
  if (!value) return "-";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return format(parsed, "dd.MM.yyyy", { locale: ru });
}

export default function AnnouncementsPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [addingToPlaylist, setAddingToPlaylist] = useState<AnnouncementItem | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAdding || !formRef.current) return;

    const timeoutId = window.setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);

    return () => window.clearTimeout(timeoutId);
  }, [isAdding]);

  const { data: announcements, isLoading } = useQuery<AnnouncementItem[]>({
    queryKey: ["announcements"],
    queryFn: async () => {
      const result = await getAnnouncementsAction();
      if (!result.success) throw new Error(result.error);
      return (result.data ?? []) as AnnouncementItem[];
    },
  });

  const { data: playlistsData } = useQuery<PlaylistSummary[]>({
    queryKey: ["playlists"],
    queryFn: async () => {
      const result = await getPlaylistsAction();
      if (!result.success) throw new Error(result.error);
      return (result.data ?? []) as PlaylistSummary[];
    },
  });

  const { data: entitlement } = useQuery<EntitlementStatus>({
    queryKey: ["tts-entitlement"],
    queryFn: async () => {
      const result = await getAnnouncementEntitlementStatusAction();
      if (!result.success) throw new Error(result.error);
      return result.data as EntitlementStatus;
    },
  });

  const { data: aiEntitlement } = useQuery<AiEntitlementStatus>({
    queryKey: ["ai-entitlement"],
    queryFn: async () => {
      const result = await getAiAssistStatusAction();
      if (!result.success) throw new Error(result.error);
      return result.data as AiEntitlementStatus;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAnnouncementAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Объявление удалено");
        queryClient.invalidateQueries({ queryKey: ["announcements"] });
      } else {
        toast.error(result.error);
      }
    },
  });

  const addToPlaylistMutation = useMutation({
    mutationFn: ({ playlistId, trackId }: { playlistId: string; trackId: string }) => 
      addTrackToPlaylistAction(playlistId, trackId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Добавлено в плейлист");
        setAddingToPlaylist(null);
      } else {
        toast.error(result.error);
      }
    },
  });

  const purchaseTokensMutation = useMutation({
    mutationFn: (packId: "pack-5" | "pack-10" | "pack-25" | "pack-50") => purchaseTtsTokensAction(packId),
    onSuccess: (result) => {
      if (result.success && result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        toast.error(result.error || "Не удалось создать платеж");
      }
    },
    onError: () => {
      toast.error("Ошибка при покупке токенов");
    },
  });

  return (
    <div className="space-y-10 pb-20 animate-fade-in relative">
      {/* Decorative Gradients */}
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] bg-neon/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Playlist Selection Modal */}
      {addingToPlaylist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-neutral-900 border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white">Добавить в плейлист</h3>
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest mt-1">Выберите целевой плейлист</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setAddingToPlaylist(null)}
                className="rounded-full hover:bg-white/5"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </Button>
            </div>
            
            <div className="p-4 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              <div className="space-y-2">
                {playlistsData?.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => addToPlaylistMutation.mutate({ 
                      playlistId: playlist.id, 
                      trackId: addingToPlaylist.track.id 
                    })}
                    disabled={addToPlaylistMutation.isPending}
                    className="w-full p-4 flex items-center justify-between glass-dark border border-white/5 rounded-2xl hover:border-neon/50 group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 group-hover:bg-neon/10 transition-colors">
                        <Music className="w-5 h-5 text-neutral-500 group-hover:text-neon transition-colors" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-white uppercase tracking-tight">{playlist.name}</p>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{playlist._count.tracks} треков</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-neon transition-colors" />
                  </button>
                ))}
                {(!playlistsData || playlistsData.length === 0) && (
                  <div className="p-8 text-center">
                    <p className="text-neutral-500 text-sm font-medium">У вас пока нет плейлистов</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-1">
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white">
            Голосовые <span className="text-neon">объявления</span>
          </h2>
          <p className="text-neutral-400 font-medium text-xs sm:text-sm italic">
            Автоматизируйте оповещения в вашем заведении
          </p>
        </div>
        {!isAdding && (
          <Button 
            onClick={() => setIsAdding(true)}
            className="bg-neon text-black hover:scale-105 transition-transform rounded-2xl px-8 h-14 font-black uppercase text-xs tracking-widest gap-2 shadow-lg shadow-neon/20"
          >
            <Plus className="w-4 h-4" /> Создать объявление
          </Button>
        )}
      </div>

      <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">Лимиты TTS</h3>
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">1 токен = 1 генерация (до 500 символов)</p>
          </div>
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-neon/30 text-neon bg-neon/10 w-fit">
            {entitlement?.canGenerate ? "Генерация доступна" : "Требуется пакет токенов"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Месячный лимит</p>
            <p className="text-2xl font-black text-white mt-1">{entitlement?.monthlyUsed ?? 0} / {entitlement?.monthlyLimit ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Осталось в месяце</p>
            <p className="text-2xl font-black text-neon mt-1">{entitlement?.monthlyRemaining ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Пакетные токены</p>
            <p className="text-2xl font-black text-white mt-1">{entitlement?.paidTokens ?? 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Сброс месячного лимита</p>
            <p className="text-sm font-black text-white mt-1">{formatRuDate(entitlement?.nextMonthlyResetAt)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Ближайшее истечение пакета</p>
            <p className="text-sm font-black text-white mt-1">{formatRuDate(entitlement?.nearestPackExpiryAt)}</p>
          </div>
        </div>

        {!entitlement?.canGenerate && entitlement?.denialReason && (
          <p className="text-sm font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            {entitlement.denialReason}
          </p>
        )}

        <div className="space-y-3">
          <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Пакеты токенов</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TTS_TOKEN_PACKS.map((pack) => (
              <Button
                key={pack.id}
                type="button"
                variant="outline"
                disabled={purchaseTokensMutation.isPending}
                onClick={() => purchaseTokensMutation.mutate(pack.id)}
                className="h-auto py-4 border-white/15 text-white hover:bg-neon hover:text-black rounded-2xl flex flex-col items-start gap-1"
              >
                <span className="text-sm font-black uppercase tracking-widest">{pack.label}</span>
                <span className="text-xs font-bold text-neutral-400">{formatRubFromKopeks(pack.price)}</span>
              </Button>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">🤖 Помощь ИИ</h3>
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">1 ассистирование = 1 токен или бесплатный ежемесячный лимит</p>
          </div>
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-violet-500/30 text-violet-300 bg-violet-500/10 w-fit">
            {aiEntitlement?.canAssist ? "Ассистирование доступно" : "Требуется пакет токенов"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Месячный лимит</p>
            <p className="text-2xl font-black text-white mt-1">{aiEntitlement?.monthlyUsed ?? 0} / {aiEntitlement?.monthlyLimit ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Осталось в месяце</p>
            <p className="text-2xl font-black text-violet-300 mt-1">{aiEntitlement?.monthlyRemaining ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Пакетные токены</p>
            <p className="text-2xl font-black text-white mt-1">{aiEntitlement?.paidTokens ?? 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Сброс месячного лимита</p>
            <p className="text-sm font-black text-white mt-1">{formatRuDate(aiEntitlement?.nextMonthlyResetAt)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Ближайшее истечение пакета</p>
            <p className="text-sm font-black text-white mt-1">{formatRuDate(aiEntitlement?.nearestPackExpiryAt)}</p>
          </div>
        </div>

        {!aiEntitlement?.canAssist && aiEntitlement?.denialReason && (
          <p className="text-sm font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            {aiEntitlement.denialReason}
          </p>
        )}
      </section>

      {isAdding && (
        <div ref={formRef} className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex justify-end mb-4">
            <Button 
              variant="ghost" 
              onClick={() => setIsAdding(false)}
              className="text-neutral-500 hover:text-white uppercase text-[10px] font-black tracking-widest"
            >
              Отмена
            </Button>
          </div>
          <VoiceAnnouncementForm onSuccess={() => {
            setIsAdding(false);
            queryClient.invalidateQueries({ queryKey: ["announcements"] });
            queryClient.invalidateQueries({ queryKey: ["tts-entitlement"] });
            queryClient.invalidateQueries({ queryKey: ["ai-entitlement"] });
          }} canGenerate={entitlement?.canGenerate ?? true} />
        </div>
      )}

      {/* Announcements List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black uppercase tracking-tighter text-white">
            Ваша <span className="text-neon">библиотека</span>
          </h2>
          <div className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">
            {announcements?.length ?? 0} ОБЪЯВЛЕНИЙ
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 glass-dark rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : announcements && announcements.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {announcements.map((item) => (
              <div 
                key={item.id} 
                className="p-5 sm:p-7 glass-dark border border-white/5 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4 group hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-5 w-full">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 relative overflow-hidden group-hover:scale-105 transition-transform shrink-0">
                    <Volume2 className="text-neon/60 w-7 h-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white truncate">
                        {item.track.title}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-neon/10 text-neon text-[8px] font-black uppercase tracking-widest rounded-full border border-neon/20">
                          {item.track.duration} СЕК
                        </span>
                        <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest px-2 py-0 border-white/10 ${
                          item.provider === 'google' 
                            ? 'text-indigo-400 bg-indigo-500/5' 
                            : 'text-amber-400 bg-amber-500/5'
                        }`}>
                          {item.provider === 'google' ? 'Google' : 'Salute'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-neutral-500 text-xs font-medium italic truncate mb-2">
                      &quot;{item.text}&quot;
                    </p>
                    <div className="flex items-center gap-4 text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-neon/40" /> 
                        {format(new Date(item.createdAt), 'dd MMM yyyy', { locale: ru })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-neon/40" /> 
                        {item.voiceName.split('-').pop()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setAddingToPlaylist(item)}
                    className="w-12 h-12 bg-neon/5 border border-neon/10 text-neon rounded-2xl hover:bg-neon hover:text-black hover:border-neon transition-all"
                    title="Добавить в плейлист"
                  >
                    <ListPlus className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                        const audio = new Audio(item.track.fileUrl);
                        audio.play();
                    }}
                    className="w-12 h-12 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-neon hover:text-black hover:border-neon transition-all"
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      if (confirm("Вы уверены, что хотите удалить это объявление?")) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-dark border border-white/10 p-16 rounded-[2.5rem] text-center space-y-6">
             <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-white/5">
               <Volume2 className="text-neutral-600 w-10 h-10" />
             </div>
             <div className="space-y-2">
               <h3 className="text-xl font-black uppercase tracking-tight text-white">Список пуст</h3>
               <p className="text-neutral-500 font-medium text-sm">У вас пока нет созданных голосовых объявлений.</p>
             </div>
             <Button 
              onClick={() => setIsAdding(true)}
              className="bg-neon/10 border border-neon/20 text-neon hover:bg-neon hover:text-black rounded-xl px-8"
             >
               Создать первое
             </Button>
          </div>
        )}
      </section>

      {/* Tips / Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        <div className="glass-dark p-8 rounded-[2rem] border border-white/5 space-y-4">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
            <Clock className="text-indigo-400 w-5 h-5" />
          </div>
          <h4 className="text-lg font-black uppercase tracking-tight text-white">Как это работает?</h4>
          <p className="text-neutral-500 text-xs font-medium leading-relaxed uppercase tracking-tight">
            Созданное объявление попадает в вашу личную библиотеку. Вы можете добавить его в любой плейлист прямо отсюда или через редактор плейлиста.
          </p>
        </div>
        <div className="glass-dark p-8 rounded-[2rem] border border-white/5 space-y-4">
          <div className="w-10 h-10 bg-neon/10 rounded-xl flex items-center justify-center">
            <ShieldCheck className="text-neon w-5 h-5" />
          </div>
          <h4 className="text-lg font-black uppercase tracking-tight text-white">Преимущество</h4>
          <p className="text-neutral-500 text-xs font-medium leading-relaxed uppercase tracking-tight">
            Голосовые объявления помогают увеличить средний чек, информируя гостей об акциях и новинках прямо в момент покупки.
          </p>
        </div>
      </div>
    </div>
  );
}
