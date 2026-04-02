import { getCurrentSongOfTheWeek, getSongOfTheWeekHistory } from "@/lib/actions/song-of-the-week";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ArrowRight, Download, Star, Music } from "lucide-react";
import { getFilePublicUrl, parseStorageObjectRef } from "@/lib/supabase-storage";

export const runtime = "nodejs";

interface SongOfTheWeekPageProps {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata() {
  return {
    title: "Песня недели | BizMusic",
    description: "Загрузите нашу бесплатную песню недели. Новая композиция каждую неделю для вашего бизнеса.",
  };
}

function resolveCoverUrl(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate.startsWith("http://") || candidate.startsWith("https://") || candidate.startsWith("/")) {
      return candidate;
    }

    const ref = parseStorageObjectRef(candidate, "covers");
    return getFilePublicUrl(ref.fileName, ref.folder);
  }

  // Branded fallback cover when track has no artwork.
  return "/images/mood-1.png";
}

export default async function SongOfTheWeekPage({
  searchParams,
}: SongOfTheWeekPageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = 12;
  const offset = (page - 1) * limit;

  const currentResult = await getCurrentSongOfTheWeek();
  const historyResult = await getSongOfTheWeekHistory(limit, offset);

  const current = currentResult.ok ? currentResult.data : null;
  const history = historyResult.ok ? historyResult.data : null;
  const currentCoverUrl = resolveCoverUrl(
    current?.track?.coverUrl,
    current?.track?.album?.coverUrl,
  );

  return (
    <div className="relative flex flex-col gap-16 md:gap-24 pb-20 overflow-hidden">
      <div className="absolute top-[-15rem] left-[-10rem] w-[34rem] h-[34rem] rounded-full blur-[140px] bg-neon/10 pointer-events-none" />
      <div className="absolute top-[24rem] right-[-12rem] w-[32rem] h-[32rem] rounded-full blur-[150px] bg-blue-500/10 pointer-events-none" />
      <div className="absolute bottom-[-14rem] left-[20%] w-[30rem] h-[30rem] rounded-full blur-[140px] bg-cyan-500/10 pointer-events-none" />

      {/* Hero / Current Song */}
      <section className="relative z-10 px-6 md:px-12 pt-12 space-y-10">
        {/* Label */}
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-neon fill-neon" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon">Бесплатно • Каждую Неделю</span>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-[clamp(2.5rem,10vw,6rem)] font-black uppercase tracking-tighter leading-none text-white">
            Песня <span className="text-neon outline-text">Недели</span>
          </h1>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs md:text-sm">
            Новая бесплатная композиция каждую неделю
          </p>
        </div>

        {/* Current track card */}
        {current && current.track ? (
          <div className="group relative glass-dark border border-white/8 hover:border-neon/20 rounded-[2rem] md:rounded-[3rem] overflow-hidden transition-all duration-500">
            <div className="absolute -top-32 -right-32 w-[32rem] h-[32rem] rounded-full blur-[120px] bg-neon/5 opacity-0 group-hover:opacity-100 transition-all duration-1000 pointer-events-none" />

            <div className="relative z-10 grid md:grid-cols-5 gap-0">
              {/* Cover Art */}
              <div className="md:col-span-2 relative aspect-square md:aspect-auto min-h-[280px]">
                {currentCoverUrl ? (
                  <img
                    src={currentCoverUrl}
                    alt={current.track.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-neon/10 to-neutral-900 flex items-center justify-center">
                    <Music className="w-20 h-20 text-neon/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0f1117] hidden md:block" />
              </div>

              {/* Info */}
              <div className="md:col-span-3 p-8 md:p-12 flex flex-col justify-between gap-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neon">
                    Трек этой недели • {formatDate(new Date(current.postedAt), "ru-RU")}
                  </p>
                  <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none text-white">
                    {current.track.title}
                  </h2>
                  <p className="text-lg md:text-xl text-neutral-400 font-bold uppercase tracking-widest">
                    {current.track.artist}
                  </p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Жанр", value: current.track.genre },
                    {
                      label: "Длина",
                      value: `${Math.floor(current.track.duration / 60)}:${(current.track.duration % 60).toString().padStart(2, "0")}`,
                    },
                    ...(current.track.bpm ? [{ label: "BPM", value: String(current.track.bpm) }] : []),
                    ...(current.track.moodTags?.length
                      ? [{ label: "Настроение", value: current.track.moodTags.slice(0, 2).join(", ") }]
                      : []),
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white/[0.04] border border-white/8 rounded-2xl p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-1">{stat.label}</p>
                      <p className="text-sm font-black text-white truncate">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex flex-wrap items-center gap-3">
                  <a href={current.track.fileUrl} download>
                    <div className="inline-flex items-center gap-3 bg-neon text-black font-black uppercase tracking-widest rounded-full px-8 py-4 hover:scale-[1.03] active:scale-[0.98] transition-transform shadow-[0_0_30px_rgba(92,243,135,0.35)]">
                      <Download className="w-5 h-5" />
                      Скачать бесплатно
                    </div>
                  </a>

                  <Link href={`/song-of-the-week/${formatDate(new Date(current.postedAt), "yyyy-MM-dd")}`}>
                    <div className="inline-flex items-center gap-2 border border-white/10 text-white font-black uppercase tracking-widest rounded-full px-6 py-4 text-xs hover:border-white/20 transition-colors">
                      Подробнее
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-dark border border-white/8 rounded-[2rem] p-12 text-center space-y-3">
            <Music className="w-10 h-10 text-neutral-700 mx-auto" />
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">
              Новая песня скоро будет опубликована
            </p>
          </div>
        )}
      </section>

      {/* Archive */}
      {history && history.songs.length > 0 && (
        <section className="relative z-10 px-6 md:px-12 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                Архив <span className="text-neon">недель</span>
              </h2>
              <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Прошлые выпуски</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {history.songs.map((item: any) => {
              const itemCoverUrl = resolveCoverUrl(
                item.track?.coverUrl,
                item.track?.album?.coverUrl,
              );
              return (
              <Link
                key={item.id}
                href={`/song-of-the-week/${formatDate(new Date(item.postedAt), "yyyy-MM-dd")}`}
              >
                <div className="group glass-dark border border-white/8 hover:border-neon/20 rounded-[2rem] overflow-hidden transition-all duration-300 hover:-translate-y-1">
                  {/* Cover */}
                  <div className="relative aspect-square overflow-hidden">
                    {itemCoverUrl ? (
                      <img
                        src={itemCoverUrl}
                        alt={item.track.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-neon/10 to-neutral-900 flex items-center justify-center">
                        <Music className="w-10 h-10 text-neon/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-transparent to-transparent" />
                  </div>

                  {/* Info */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-black uppercase tracking-tight text-white truncate text-sm">
                      {item.track.title}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neon truncate">
                      {item.track.artist}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
                        {formatDate(new Date(item.postedAt), "ru-RU")}
                      </p>
                      <ArrowRight className="w-3 h-3 text-neutral-700 group-hover:text-neon group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {(page > 1 || history.hasMore) && (
            <div className="flex items-center gap-4 pt-4">
              {page > 1 && (
                <Link href={`/song-of-the-week?page=${page - 1}`}>
                  <div className="inline-flex items-center gap-2 border border-white/10 text-white font-black uppercase tracking-widest rounded-full px-6 py-3 text-xs hover:border-white/20 transition-colors">
                    ← Назад
                  </div>
                </Link>
              )}
              {history.hasMore && (
                <Link href={`/song-of-the-week?page=${page + 1}`}>
                  <div className="inline-flex items-center gap-2 border border-white/10 text-white font-black uppercase tracking-widest rounded-full px-6 py-3 text-xs hover:border-white/20 transition-colors">
                    Ещё →
                  </div>
                </Link>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
