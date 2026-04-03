import { getSongOfTheWeekByDate } from "@/lib/actions/song-of-the-week";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ArrowRight, Download, Music, Shield, ArrowLeft } from "lucide-react";
import { getFilePublicUrl, parseStorageObjectRef } from "@/lib/supabase-storage";
import { buildTrackDownloadUrl } from "@/lib/track-download-url";

export const runtime = "nodejs";

interface SongOfTheWeekDetailPageProps {
  params: Promise<{ date: string }>;
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

  // Branded fallback cover when no artwork is attached.
  return "/images/mood-1.png";
}

export async function generateMetadata({ params }: SongOfTheWeekDetailPageProps) {
  const { date } = await params;
  const result = await getSongOfTheWeekByDate(date);
  const song = result.ok ? result.data : null;

  if (!song || !song.track) {
    return { title: "Не найдено | BizMusic" };
  }

  return {
    title: `${song.track.title} — Песня Недели | BizMusic`,
    description: `Скачайте «${song.track.title}» от ${song.track.artist} совершенно бесплатно.`,
  };
}

export default async function SongOfTheWeekDetailPage({ params }: SongOfTheWeekDetailPageProps) {
  const { date } = await params;
  const result = await getSongOfTheWeekByDate(date);

  if (!result.ok || !result.data || !result.data.track) {
    return (
      <div className="relative flex flex-col gap-16 pb-20 px-6 md:px-12 pt-12 overflow-hidden">
        <div className="absolute top-[-10rem] left-[-8rem] w-[28rem] h-[28rem] rounded-full blur-[130px] bg-neon/10 pointer-events-none" />
        <div className="absolute bottom-[-12rem] right-[-10rem] w-[30rem] h-[30rem] rounded-full blur-[140px] bg-blue-500/10 pointer-events-none" />

        <Link href="/song-of-the-week" className="relative z-10 inline-flex items-center gap-2 text-neutral-500 hover:text-neon transition-colors font-black uppercase tracking-widest text-xs group w-fit">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Архив
        </Link>
        <div className="relative z-10 glass-dark border border-white/8 rounded-[2rem] p-12 text-center space-y-3 max-w-md">
          <Music className="w-10 h-10 text-neutral-700 mx-auto" />
          <p className="text-neutral-400 font-black uppercase tracking-widest text-xs">
            Песня на дату <span className="text-white">{date}</span> не найдена
          </p>
        </div>
      </div>
    );
  }

  const song = result.data;
  const track = song.track;
  const durationMinutes = Math.floor(track.duration / 60);
  const durationSeconds = (track.duration % 60).toString().padStart(2, "0");
  const coverUrl = resolveCoverUrl(track.coverUrl, track.album?.coverUrl);

  const stats = [
    { label: "Жанр", value: track.genre },
    { label: "Длина", value: `${durationMinutes}:${durationSeconds}` },
    ...(track.bpm ? [{ label: "BPM", value: String(track.bpm) }] : []),
    ...(track.vocalType ? [{ label: "Вокал", value: track.vocalType }] : []),
    ...(track.language ? [{ label: "Язык", value: track.language }] : []),
  ];

  return (
    <div className="relative flex flex-col gap-16 md:gap-24 pb-20 overflow-hidden">
      <div className="absolute top-[-14rem] left-[-10rem] w-[34rem] h-[34rem] rounded-full blur-[140px] bg-neon/10 pointer-events-none" />
      <div className="absolute top-[18rem] right-[-12rem] w-[32rem] h-[32rem] rounded-full blur-[150px] bg-blue-500/10 pointer-events-none" />
      <div className="absolute bottom-[-14rem] left-[25%] w-[30rem] h-[30rem] rounded-full blur-[140px] bg-cyan-500/10 pointer-events-none" />

      <section className="relative z-10 px-6 md:px-12 pt-12 space-y-12">
        <Link
          href="/song-of-the-week"
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-neon transition-colors font-black uppercase tracking-widest text-xs group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Все недели
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon/30 bg-neon/10">
            <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon">
              Трек недели • {formatDate(new Date(song.postedAt), "ru-RU")}
            </span>
          </span>
        </div>

        <div className="grid md:grid-cols-5 gap-0 glass-dark border border-white/8 rounded-[2rem] md:rounded-[3rem] overflow-hidden">
          <div className="md:col-span-2 relative aspect-square md:aspect-auto min-h-[300px]">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={track.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neon/10 to-neutral-900 flex items-center justify-center">
                <Music className="w-24 h-24 text-neon/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0f1117] hidden md:block" />
          </div>

          <div className="md:col-span-3 p-8 md:p-14 flex flex-col gap-8 justify-between">
            <div className="space-y-3">
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none text-white">
                {track.title}
              </h1>
              <p className="text-lg md:text-2xl text-neutral-400 font-bold uppercase tracking-widest">
                {track.artist}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/[0.04] border border-white/8 rounded-2xl p-4"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-sm font-black text-white truncate">{stat.value}</p>
                </div>
              ))}
            </div>

            {track.moodTags && track.moodTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {track.moodTags.map((mood) => (
                  <span
                    key={mood}
                    className="px-3 py-1 rounded-full border border-neon/30 bg-neon/10 text-neon text-[10px] font-black uppercase tracking-widest"
                  >
                    {mood}
                  </span>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <a href={buildTrackDownloadUrl(track.id, { source: "song-of-the-week-detail", songOfWeekId: song.id })} className="inline-flex group/download">
                <div className="inline-flex items-center gap-3 bg-neon text-black font-black uppercase tracking-widest rounded-full px-7 md:px-9 py-4 hover:scale-[1.03] active:scale-[0.98] transition-transform shadow-[0_0_34px_rgba(92,243,135,0.42)] text-sm">
                  <Download className="w-4 h-4" />
                  Скачать трек бесплатно
                  <ArrowRight className="w-4 h-4 group-hover/download:translate-x-1 transition-transform" />
                </div>
              </a>

              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full border border-emerald-300/40 bg-emerald-300/10 flex items-center justify-center shrink-0">
                  <Shield className="w-3.5 h-3.5 text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">
                    Свободна для коммерческого использования
                  </p>
                  {/* <p className="text-[11px] text-emerald-100/80 font-bold uppercase tracking-wider mt-1">
                    Без доплат в РАО/ВОИС
                  </p> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
