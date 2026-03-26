"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TrackUploader } from "@/components/admin/TrackUploader";
import type { AdminPlatformAnnouncement } from "@/types/admin";
import {
  createPlatformAnnouncementTtsAction,
  createPlatformAnnouncementUploadAction,
  deletePlatformAnnouncementAction,
  getAdminPlatformAnnouncementsAction,
  updatePlatformAnnouncementAction,
} from "@/lib/actions/platform-announcements";
import { toast } from "sonner";
import { usePlayerStore } from "@/store/usePlayerStore";
import { Mic, Play, Plus, Save, Trash2, Upload, Volume2 } from "lucide-react";

const PROVIDERS = [
  { id: "sberbank", name: "SaluteSpeech" },
  { id: "google", name: "Google Cloud" },
] as const;

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

type AccessModel = "FREE" | "PAID";

interface EditableAnnouncementState {
  title: string;
  description: string;
  transcript: string;
  accessModel: AccessModel;
  priceRub: string;
  isFeatured: boolean;
  isPublished: boolean;
}

function kopeksToRub(value: number) {
  return Math.round(value / 100).toString();
}

function rubToKopeks(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }
  return Math.round(parsed * 100);
}

export function PlatformAnnouncementManager() {
  const queryClient = useQueryClient();
  const setTrack = usePlayerStore((state) => state.setTrack);
  const [mode, setMode] = useState<"upload" | "tts">("upload");
  const [uploadedFile, setUploadedFile] = useState<{
    fileName: string;
    url: string;
    duration: number;
    coverUrl?: string;
  } | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [transcript, setTranscript] = useState("");
  const [accessModel, setAccessModel] = useState<AccessModel>("FREE");
  const [priceRub, setPriceRub] = useState("0");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [provider, setProvider] = useState<"google" | "sberbank">("sberbank");
  const [voiceName, setVoiceName] = useState(VOICES.sberbank[0].id);
  const [speakingRate, setSpeakingRate] = useState("1");
  const [pitch, setPitch] = useState("0");
  const [editableMap, setEditableMap] = useState<Record<string, EditableAnnouncementState>>({});

  useEffect(() => {
    setVoiceName(VOICES[provider][0].id);
  }, [provider]);

  const { data } = useQuery<AdminPlatformAnnouncement[]>({
    queryKey: ["admin-platform-announcements"],
    queryFn: async () => {
      const result = await getAdminPlatformAnnouncementsAction();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as AdminPlatformAnnouncement[];
    },
  });

  useEffect(() => {
    if (!data) {
      return;
    }

    setEditableMap((previous) => {
      const next: Record<string, EditableAnnouncementState> = {};
      data.forEach((item) => {
        next[item.id] = previous[item.id] ?? {
          title: item.track.title,
          description: item.description || "",
          transcript: item.transcript || "",
          accessModel: item.accessModel,
          priceRub: kopeksToRub(item.priceKopeks),
          isFeatured: item.isFeatured,
          isPublished: item.isPublished,
        };
      });
      return next;
    });
  }, [data]);

  const resetCreateForm = () => {
    setUploadedFile(null);
    setTitle("");
    setDescription("");
    setTranscript("");
    setAccessModel("FREE");
    setPriceRub("0");
    setIsFeatured(false);
    setIsPublished(true);
    setProvider("sberbank");
    setVoiceName(VOICES.sberbank[0].id);
    setSpeakingRate("1");
    setPitch("0");
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-platform-announcements"] });
  };

  const createUploadMutation = useMutation({
    mutationFn: () => {
      if (!uploadedFile) {
        throw new Error("Сначала загрузите аудиофайл");
      }

      return createPlatformAnnouncementUploadAction({
        title,
        fileUrl: uploadedFile.url,
        duration: uploadedFile.duration,
        description,
        transcript,
        accessModel,
        priceKopeks: rubToKopeks(priceRub),
        isFeatured,
        isPublished,
        coverUrl: uploadedFile.coverUrl,
      });
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Платформенное объявление создано");
      invalidate();
      resetCreateForm();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createTtsMutation = useMutation({
    mutationFn: () => createPlatformAnnouncementTtsAction({
      title,
      text: transcript,
      description,
      accessModel,
      priceKopeks: rubToKopeks(priceRub),
      isFeatured,
      isPublished,
      provider,
      voiceName,
      speakingRate: Number(speakingRate),
      pitch: Number(pitch),
    }),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Платформенное объявление сгенерировано");
      invalidate();
      resetCreateForm();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; value: EditableAnnouncementState }) => updatePlatformAnnouncementAction({
      id: payload.id,
      title: payload.value.title,
      description: payload.value.description,
      transcript: payload.value.transcript,
      accessModel: payload.value.accessModel,
      priceKopeks: rubToKopeks(payload.value.priceRub),
      isFeatured: payload.value.isFeatured,
      isPublished: payload.value.isPublished,
    }),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Объявление обновлено");
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePlatformAnnouncementAction,
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Объявление удалено");
      invalidate();
    },
  });

  const items = data ?? [];
  const stats = useMemo(() => ({
    total: items.length,
    featured: items.filter((item) => item.isFeatured).length,
    paid: items.filter((item) => item.accessModel === "PAID").length,
    free: items.filter((item) => item.accessModel === "FREE").length,
  }), [items]);

  const handlePreview = (item: AdminPlatformAnnouncement) => {
    setTrack({
      id: item.track.id,
      title: item.track.title,
      artist: item.track.artist,
      fileUrl: item.track.fileUrl,
      streamUrl: item.track.streamUrl,
      duration: item.track.duration,
      cover_url: item.track.coverUrl || "/images/voice_announcements.png",
    });
    toast.info(`Воспроизведение: ${item.track.title}`);
  };

  const canSubmitCreate = Boolean(title.trim()) && (mode === "upload" ? Boolean(uploadedFile) : Boolean(transcript.trim()));

  const handleAnnouncementUploadComplete = useCallback((fileName: string, url: string, duration: number, coverUrl?: string) => {
    setUploadedFile({ fileName, url, duration, coverUrl });
    setTitle((previous) => previous || fileName.replace(/\.[^.]+$/, ""));
  }, []);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-dark border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Всего объявлений</p>
          <p className="text-4xl font-black text-white">{stats.total}</p>
        </div>
        <div className="glass-dark border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Featured</p>
          <p className="text-4xl font-black text-neon">{stats.featured}</p>
        </div>
        <div className="glass-dark border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Бесплатные</p>
          <p className="text-4xl font-black text-white">{stats.free}</p>
        </div>
        <div className="glass-dark border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Платные</p>
          <p className="text-4xl font-black text-amber-400">{stats.paid}</p>
        </div>
      </div>

      <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white">Новый платформенный анонс</h3>
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">Upload или TTS с витринными настройками</p>
          </div>
          <div className="flex bg-white/[0.02] border border-white/10 rounded-2xl p-1">
            <button
              onClick={() => setMode("upload")}
              className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                mode === "upload" ? "bg-neon text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
            <button
              onClick={() => setMode("tts")}
              className={`px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                mode === "tts" ? "bg-neon text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              <Mic className="w-4 h-4" />
              TTS
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <div className="space-y-6">
            {mode === "upload" ? (
              <TrackUploader uploadType="announcement" onUploadComplete={handleAnnouncementUploadComplete} />
            ) : (
              <div className="space-y-4 rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Провайдер</p>
                  <select
                    value={provider}
                    onChange={(event) => setProvider(event.target.value as "google" | "sberbank")}
                    className="w-full h-12 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none"
                  >
                    {PROVIDERS.map((item) => (
                      <option key={item.id} value={item.id} className="bg-neutral-900">{item.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Голос</p>
                  <select
                    value={voiceName}
                    onChange={(event) => setVoiceName(event.target.value)}
                    className="w-full h-12 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none"
                  >
                    {VOICES[provider].map((item) => (
                      <option key={item.id} value={item.id} className="bg-neutral-900">{item.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Скорость</p>
                    <Input value={speakingRate} onChange={(event) => setSpeakingRate(event.target.value)} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Pitch</p>
                    <Input value={pitch} onChange={(event) => setPitch(event.target.value)} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Название</p>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например: Скидка на кофе" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Описание</p>
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Краткое описание для витрины" className="min-h-24" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Текст / транскрипт</p>
              <Textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="Текст объявления или транскрипт загруженного файла" className="min-h-32" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Модель доступа</p>
                <select
                  value={accessModel}
                  onChange={(event) => setAccessModel(event.target.value as AccessModel)}
                  className="w-full h-12 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none"
                >
                  <option value="FREE" className="bg-neutral-900">Бесплатно</option>
                  <option value="PAID" className="bg-neutral-900">Платно</option>
                </select>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Цена, ₽</p>
                <Input value={priceRub} onChange={(event) => setPriceRub(event.target.value)} disabled={accessModel === "FREE"} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-4">
              <label className="flex items-center justify-between gap-3 text-sm font-bold text-white">
                Featured
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm font-bold text-white">
                Опубликовано
                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              </label>
            </div>
            <Button
              disabled={!canSubmitCreate || createUploadMutation.isPending || createTtsMutation.isPending}
              onClick={() => mode === "upload" ? createUploadMutation.mutate() : createTtsMutation.mutate()}
              className="w-full bg-neon text-black hover:bg-neon/90 rounded-2xl h-14 font-black uppercase tracking-widest gap-2"
            >
              <Plus className="w-4 h-4" />
              Создать объявление
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-black uppercase tracking-tight text-white">Каталог платформы</h3>
          <div className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">{items.length} записей</div>
        </div>

        <div className="space-y-4">
          {items.map((item) => {
            const editable = editableMap[item.id];
            if (!editable) {
              return null;
            }

            return (
              <div key={item.id} className="glass-dark border border-white/10 rounded-[2rem] p-5 sm:p-6 space-y-5">
                <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Volume2 className="w-7 h-7 text-neon/70" />
                    </div>
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-white/10 text-white bg-white/5">
                          {item.sourceType}
                        </Badge>
                        <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest border-white/10 ${item.accessModel === "PAID" ? "text-amber-300 bg-amber-500/10" : "text-neon bg-neon/10"}`}>
                          {item.accessModel === "PAID" ? `${kopeksToRub(item.priceKopeks)} ₽` : "Бесплатно"}
                        </Badge>
                        {item.isFeatured && (
                          <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-neon/30 text-neon bg-neon/10">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500 font-bold uppercase tracking-widest">
                        Приобретений: {item.acquisitionCount}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => handlePreview(item)} className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 text-white hover:bg-neon hover:text-black">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (confirm("Удалить платформенное объявление?")) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      className="w-12 h-12 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  <div className="xl:col-span-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Название</p>
                    <Input
                      value={editable.title}
                      onChange={(event) => setEditableMap((current) => ({
                        ...current,
                        [item.id]: { ...current[item.id], title: event.target.value },
                      }))}
                    />
                  </div>
                  <div className="xl:col-span-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Описание</p>
                    <Textarea
                      value={editable.description}
                      onChange={(event) => setEditableMap((current) => ({
                        ...current,
                        [item.id]: { ...current[item.id], description: event.target.value },
                      }))}
                      className="min-h-24"
                    />
                  </div>
                  <div className="xl:col-span-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Транскрипт</p>
                    <Textarea
                      value={editable.transcript}
                      onChange={(event) => setEditableMap((current) => ({
                        ...current,
                        [item.id]: { ...current[item.id], transcript: event.target.value },
                      }))}
                      className="min-h-24"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-end">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Доступ</p>
                    <select
                      value={editable.accessModel}
                      onChange={(event) => setEditableMap((current) => ({
                        ...current,
                        [item.id]: { ...current[item.id], accessModel: event.target.value as AccessModel },
                      }))}
                      className="w-full h-12 rounded-xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none"
                    >
                      <option value="FREE" className="bg-neutral-900">Бесплатно</option>
                      <option value="PAID" className="bg-neutral-900">Платно</option>
                    </select>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Цена, ₽</p>
                    <Input
                      value={editable.priceRub}
                      disabled={editable.accessModel === "FREE"}
                      onChange={(event) => setEditableMap((current) => ({
                        ...current,
                        [item.id]: { ...current[item.id], priceRub: event.target.value },
                      }))}
                    />
                  </div>
                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 h-12 text-sm font-bold text-white">
                    Featured
                    <Switch
                      checked={editable.isFeatured}
                      onCheckedChange={(checked) => setEditableMap((current) => ({
                        ...current,
                        [item.id]: { ...current[item.id], isFeatured: checked },
                      }))}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 h-12 text-sm font-bold text-white">
                    Опубликовано
                    <Switch
                      checked={editable.isPublished}
                      onCheckedChange={(checked) => setEditableMap((current) => ({
                        ...current,
                        [item.id]: { ...current[item.id], isPublished: checked },
                      }))}
                    />
                  </label>
                  <Button
                    disabled={updateMutation.isPending}
                    onClick={() => updateMutation.mutate({ id: item.id, value: editable })}
                    className="h-12 rounded-2xl bg-neon text-black hover:bg-neon/90 font-black uppercase tracking-widest gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Сохранить
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}