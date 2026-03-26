"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { getFeaturedPlatformAnnouncementsAction, claimFreePlatformAnnouncementAction } from "@/lib/actions/platform-announcements";
import { purchasePlatformAnnouncementAction } from "@/lib/actions/payments";
import { usePlayerStore } from "@/store/usePlayerStore";
import { ArrowRight, Mic2, Play, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

function formatRubFromKopeks(amount: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

export function PlatformAnnouncementCatalogSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const setTrack = usePlayerStore((state) => state.setTrack);

  const { data, isLoading } = useQuery({
    queryKey: ["featured-platform-announcements"],
    queryFn: async () => {
      const result = await getFeaturedPlatformAnnouncementsAction();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data ?? [];
    },
  });

  const claimMutation = useMutation({
    mutationFn: claimFreePlatformAnnouncementAction,
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Объявление добавлено в вашу библиотеку");
      queryClient.invalidateQueries({ queryKey: ["featured-platform-announcements"] });
      queryClient.invalidateQueries({ queryKey: ["announcements-library"] });
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: purchasePlatformAnnouncementAction,
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
      }
    },
  });

  const items = data ?? [];
  if (!isLoading && items.length === 0) {
    return null;
  }

  return (
    <section className="px-6 md:px-12 space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon/30 bg-neon/10 backdrop-blur-md">
            <Mic2 className="w-4 h-4 text-neon" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-neon">Featured Library</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">
            Готовые <span className="text-neon">объявления</span>
          </h2>
          <p className="text-neutral-400 text-base md:text-lg font-medium leading-relaxed">
            Бесплатные и платные платформенные анонсы, которые можно сразу добавить в библиотеку бизнеса и использовать в плейлистах.
          </p>
        </div>
        {!user && (
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 max-w-sm">
            <p className="text-sm font-bold text-white uppercase tracking-widest">Чтобы добавить в библиотеку</p>
            <p className="text-xs text-neutral-500 font-medium mt-2">Войдите или создайте аккаунт. Прослушивание превью доступно без авторизации.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {isLoading ? (
          [1, 2].map((index) => (
            <div key={index} className="h-72 rounded-[2.5rem] glass-dark animate-pulse" />
          ))
        ) : items.map((item) => (
          <div key={item.id} className="rounded-[2.5rem] border border-white/10 bg-white/[0.03] p-6 md:p-8 space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-neon/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-neon/30 text-neon bg-neon/10">
                  Featured
                </Badge>
                <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-widest border-white/10 ${item.accessModel === "PAID" ? "text-amber-300 bg-amber-500/10" : "text-white bg-white/5"}`}>
                  {item.accessModel === "PAID" ? formatRubFromKopeks(item.priceKopeks) : "Бесплатно"}
                </Badge>
                {item.owned && (
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-blue-400/30 text-blue-300 bg-blue-500/10">
                    Уже в библиотеке
                  </Badge>
                )}
              </div>

              <div>
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">{item.track.title}</h3>
                {item.description && (
                  <p className="text-neutral-400 mt-3 leading-relaxed font-medium">{item.description}</p>
                )}
              </div>

              {item.transcript && (
                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Текст объявления</p>
                  <p className="text-sm text-neutral-300 leading-relaxed">{item.transcript}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  <span>{item.sourceType === "TTS" ? item.provider : "UPLOAD"}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span>{item.track.duration} сек</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const streamUrl = "streamUrl" in item.track ? item.track.streamUrl : undefined;
                      setTrack({
                        id: item.track.id,
                        title: item.track.title,
                        artist: item.track.artist,
                        fileUrl: item.track.fileUrl,
                        streamUrl,
                        duration: item.track.duration,
                        cover_url: item.track.coverUrl || "/images/voice_announcements.png",
                      });
                      toast.info(`Воспроизведение: ${item.track.title}`);
                    }}
                    className="rounded-2xl border-white/10 text-white hover:bg-white/5 gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Слушать
                  </Button>

                  {!user ? (
                    <Link href="/login" className="inline-flex">
                      <Button className="rounded-2xl bg-neon text-black hover:bg-neon/90 gap-2">
                        Войти для доступа
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  ) : item.owned ? (
                    <Link href="/dashboard/announcements" className="inline-flex">
                      <Button className="rounded-2xl bg-neon text-black hover:bg-neon/90">Открыть библиотеку</Button>
                    </Link>
                  ) : item.accessModel === "FREE" ? (
                    <Button
                      disabled={claimMutation.isPending}
                      onClick={() => claimMutation.mutate(item.id)}
                      className="rounded-2xl bg-neon text-black hover:bg-neon/90"
                    >
                      Получить бесплатно
                    </Button>
                  ) : (
                    <Button
                      disabled={purchaseMutation.isPending}
                      onClick={() => purchaseMutation.mutate(item.id)}
                      className="rounded-2xl bg-neon text-black hover:bg-neon/90 gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Купить
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}