"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Layers, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getLocationsWithManagersAction } from "@/lib/actions/branches";
import { getPlaylistsAction } from "@/lib/actions/playlists";
import { generateBulkAnnouncementsAction, getAnnouncementBulkJobsAction } from "@/lib/actions/announcement-bulk";
import { getLocationPlaylistAssignmentsAction, upsertLocationPlaylistAssignmentAction } from "@/lib/actions/location-playlist-assignments";

const VOICES = {
  google: [
    { id: "ru-RU-Wavenet-A", name: "Алёна" },
    { id: "ru-RU-Wavenet-B", name: "Максим" },
    { id: "ru-RU-Wavenet-C", name: "Елена" },
    { id: "ru-RU-Wavenet-D", name: "Иван" },
    { id: "ru-RU-Neural2-A", name: "Татьяна" },
    { id: "ru-RU-Neural2-B", name: "Дмитрий" },
  ],
  sberbank: [
    { id: "Nec_24000", name: "Александра" },
    { id: "Bys_24000", name: "Борис" },
    { id: "May_24000", name: "Майя" },
    { id: "Tur_24000", name: "Тарас" },
    { id: "Ost_24000", name: "Остап" },
  ],
};

interface PlaylistItem {
  id: string;
  name: string;
}

interface LocationItem {
  id: string;
  name: string;
  address: string;
}

export default function BulkAnnouncementsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [provider, setProvider] = useState<"google" | "sberbank">("sberbank");
  const [voiceName, setVoiceName] = useState(VOICES.sberbank[0].id);
  const [playlistIds, setPlaylistIds] = useState<string[]>([]);
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [conflictMode, setConflictMode] = useState<"skip-existing" | "append">("skip-existing");
  const [rollbackOnFailure, setRollbackOnFailure] = useState(false);

  const { data: playlists = [] } = useQuery<PlaylistItem[]>({
    queryKey: ["bulk-playlists"],
    queryFn: async () => {
      const result = await getPlaylistsAction();
      if (!result.success) throw new Error(result.error);
      return (result.data ?? []) as PlaylistItem[];
    },
  });

  const { data: locations = [] } = useQuery<LocationItem[]>({
    queryKey: ["bulk-locations"],
    queryFn: async () => {
      const result = await getLocationsWithManagersAction();
      if (!result.success) throw new Error(result.error);
      return result.data as LocationItem[];
    },
  });

  const { data: assignmentData } = useQuery<{
    locations: Array<{ id: string; name: string; address: string; playlistId: string | null }>;
    playlists: Array<{ id: string; name: string }>;
  }>({
    queryKey: ["location-playlist-assignments"],
    queryFn: async () => {
      const result = await getLocationPlaylistAssignmentsAction();
      if (!result.success) throw new Error(result.error);
      return result.data as {
        locations: Array<{ id: string; name: string; address: string; playlistId: string | null }>;
        playlists: Array<{ id: string; name: string }>;
      };
    },
  });

  const assignmentMutation = useMutation({
    mutationFn: ({ locationId, playlistId }: { locationId: string; playlistId: string }) =>
      upsertLocationPlaylistAssignmentAction(locationId, playlistId),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || "Не удалось сохранить назначение");
        return;
      }
      toast.success("Назначение сохранено");
      queryClient.invalidateQueries({ queryKey: ["location-playlist-assignments"] });
    },
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ["announcement-bulk-jobs"],
    queryFn: async () => {
      const result = await getAnnouncementBulkJobsAction();
      if (!result.success) throw new Error(result.error);
      return result.data ?? [];
    },
  });

  const bulkMutation = useMutation({
    mutationFn: (dryRun: boolean) => generateBulkAnnouncementsAction({
      title,
      text,
      provider,
      voiceName,
      playlistIds,
      locationIds,
      conflictMode,
      rollbackOnFailure,
      dryRun,
    }),
    onSuccess: (result, dryRun) => {
      if (!result.success) {
        toast.error(result.error || "Не удалось выполнить bulk-операцию");
        return;
      }

      if (dryRun) {
        toast.success(`Dry-run: целей ${result.data?.totalTargets}, расчет токенов: ${result.data?.estimatedCredits}`);
        return;
      }

      toast.success("Массовая генерация запущена и применена");
      queryClient.invalidateQueries({ queryKey: ["announcement-bulk-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["announcements-library"] });
    },
  });

  const selectedTargets = useMemo(
    () => playlistIds.length + locationIds.length,
    [playlistIds.length, locationIds.length]
  );

  return (
    <div className="space-y-8 pb-24 animate-fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/announcements">
            <Button variant="outline" className="border-white/15 text-white hover:bg-white/10 rounded-xl gap-2">
              <ArrowLeft className="w-4 h-4" /> Назад
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Bulk <span className="text-neon">анонсы</span></h1>
            <p className="text-neutral-500 text-xs uppercase tracking-widest font-bold">Один анонс на несколько плейлистов и филиалов</p>
          </div>
        </div>
      </div>

      <div className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Название</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Сезонная акция" className="bg-white/5 border-white/10 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Провайдер</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setProvider("sberbank"); setVoiceName(VOICES.sberbank[0].id); }}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${provider === "sberbank" ? "bg-neon text-black border-neon" : "bg-white/5 border-white/10 text-neutral-400"}`}
              >
                SaluteSpeech
              </button>
              <button
                type="button"
                onClick={() => { setProvider("google"); setVoiceName(VOICES.google[0].id); }}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${provider === "google" ? "bg-neon text-black border-neon" : "bg-white/5 border-white/10 text-neutral-400"}`}
              >
                Google
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Текст</Label>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-[120px] bg-white/5 border-white/10 text-white" />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Голос</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {VOICES[provider].map((voice) => (
              <button
                type="button"
                key={voice.id}
                onClick={() => setVoiceName(voice.id)}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${voiceName === voice.id ? "bg-neon text-black border-neon" : "bg-white/5 border-white/10 text-neutral-400"}`}
              >
                {voice.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Плейлисты ({playlistIds.length})</Label>
            <div className="max-h-56 overflow-auto space-y-2 pr-1">
              {playlists.map((playlist) => (
                <label key={playlist.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={playlistIds.includes(playlist.id)}
                    onChange={(e) => {
                      setPlaylistIds((prev) =>
                        e.target.checked ? [...prev, playlist.id] : prev.filter((id) => id !== playlist.id)
                      );
                    }}
                  />
                  <span>{playlist.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Филиалы ({locationIds.length})</Label>
            <div className="max-h-56 overflow-auto space-y-2 pr-1">
              {locations.map((location) => (
                <label key={location.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={locationIds.includes(location.id)}
                    onChange={(e) => {
                      setLocationIds((prev) =>
                        e.target.checked ? [...prev, location.id] : prev.filter((id) => id !== location.id)
                      );
                    }}
                  />
                  <span>
                    <span className="block font-bold">{location.name}</span>
                    <span className="text-xs text-neutral-500">{location.address}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <Label className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Маппинг филиал → активный плейлист</Label>
          <div className="space-y-2 max-h-56 overflow-auto pr-1">
            {(assignmentData?.locations ?? []).map((location) => (
              <div key={location.id} className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-2 items-center p-2 rounded-xl bg-white/5 border border-white/10">
                <div>
                  <p className="text-sm font-bold text-white">{location.name}</p>
                  <p className="text-xs text-neutral-500">{location.address}</p>
                </div>
                <select
                  className="bg-black/40 border border-white/15 text-white rounded-xl px-3 py-2 text-xs"
                  value={location.playlistId ?? ""}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    assignmentMutation.mutate({
                      locationId: location.id,
                      playlistId: e.target.value,
                    });
                  }}
                >
                  <option value="">Выберите плейлист</option>
                  {(assignmentData?.playlists ?? []).map((playlist) => (
                    <option key={playlist.id} value={playlist.id}>{playlist.name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Конфликт в плейлисте</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConflictMode("skip-existing")}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${conflictMode === "skip-existing" ? "bg-neon text-black border-neon" : "bg-white/5 border-white/10 text-neutral-400"}`}
              >
                Skip existing
              </button>
              <button
                type="button"
                onClick={() => setConflictMode("append")}
                className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${conflictMode === "append" ? "bg-neon text-black border-neon" : "bg-white/5 border-white/10 text-neutral-400"}`}
              >
                Append
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Откат при ошибке</Label>
            <button
              type="button"
              onClick={() => setRollbackOnFailure((v) => !v)}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border ${rollbackOnFailure ? "bg-neon text-black border-neon" : "bg-white/5 border-white/10 text-neutral-400"}`}
            >
              {rollbackOnFailure ? "Включен" : "Выключен"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
          <div className="text-xs text-neutral-500 uppercase tracking-widest font-bold">
            Целей выбрано: <span className="text-neon">{selectedTargets}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={bulkMutation.isPending}
              onClick={() => bulkMutation.mutate(true)}
              className="border-white/15 text-white rounded-xl gap-2"
            >
              <Sparkles className="w-4 h-4" /> Dry-run
            </Button>
            <Button
              type="button"
              disabled={bulkMutation.isPending || !title.trim() || !text.trim() || selectedTargets === 0}
              onClick={() => bulkMutation.mutate(false)}
              className="bg-neon text-black rounded-xl font-black uppercase text-xs tracking-widest gap-2"
            >
              {bulkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              Запустить bulk
            </Button>
          </div>
        </div>
      </div>

      <div className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-white">Последние bulk-джобы</h2>
        <div className="space-y-2">
          {jobs.length === 0 && <p className="text-sm text-neutral-500">Пока нет записей.</p>}
          {jobs.map((job) => (
            <div key={job.id} className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-bold">{job.title}</p>
                <p className="text-xs text-neutral-500">{job.totalTargets} целей · {job.successTargets} успешно · {job.failedTargets} ошибок</p>
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-neon">{job.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
