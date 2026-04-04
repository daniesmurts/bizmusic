"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mic, Loader2, Info, Sparkles, AlertTriangle, Headphones, LayoutTemplate, CalendarDays } from "lucide-react";
import { generateVoiceAnnouncementAction, getAnnouncementTemplatesAction, getTtsProvidersStatusAction, previewVoiceAnnouncementAction } from "@/lib/actions/voice-announcements";
import { getBrandVoiceOverviewAction } from "@/lib/actions/brand-voice";
import { purchaseBrandVoiceOverageAction } from "@/lib/actions/payments";
import { getPublishedAnnouncementJinglesAction } from "@/lib/actions/announcement-jingles";
import { generateAiAssistAction } from "@/lib/actions/ai-assists";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AnnouncementTemplate } from "@/lib/announcement-templates";
import { buildAnnouncementPayload } from "@/lib/announcement-form";
import { SSML_SNIPPETS, validateSsmlBasic } from "@/lib/ssml";

const PROVIDERS = [
  { id: "google", name: "Google Cloud", description: "Премиальные голоса. Если возникают ошибки, используйте VPN.", showTooltip: true },
  { id: "sberbank", name: "SaluteSpeech", description: "Стабильно работает в РФ без VPN.", showTooltip: false },
] as const;

const VOICES = {
  google: [
    { id: "ru-RU-Wavenet-A", name: "Алёна (Wavenet)", gender: "FEMALE" },
    { id: "ru-RU-Wavenet-B", name: "Максим (Wavenet)", gender: "MALE" },
    { id: "ru-RU-Wavenet-C", name: "Елена (Wavenet)", gender: "FEMALE" },
    { id: "ru-RU-Wavenet-D", name: "Иван (Wavenet)", gender: "MALE" },
    { id: "ru-RU-Neural2-A", name: "Татьяна (Neural2)", gender: "FEMALE" },
    { id: "ru-RU-Neural2-B", name: "Дмитрий (Neural2)", gender: "MALE" },
  ],
  sberbank: [
    { id: "Nec_24000", name: "Александра", gender: "FEMALE" },
    { id: "Bys_24000", name: "Борис", gender: "MALE" },
    { id: "May_24000", name: "Майя", gender: "FEMALE" },
    { id: "Tur_24000", name: "Тарас", gender: "MALE" },
    { id: "Ost_24000", name: "Остап", gender: "MALE" },
  ]
};

export function VoiceAnnouncementForm({ onSuccess, canGenerate = true }: { onSuccess?: () => void; canGenerate?: boolean }) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [selectedPack, setSelectedPack] = useState<string>("all");
  const [provider, setProvider] = useState<"google" | "sberbank">("sberbank");
  const [voiceName, setVoiceName] = useState(VOICES.sberbank[0].id);
  const [speakingRate, setSpeakingRate] = useState(1.0);
  const [pitch, setPitch] = useState(0.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<{google: boolean, sberbank: boolean} | null>(null);
  const [selectedJingleId, setSelectedJingleId] = useState<string>("");
  const [generationMode, setGenerationMode] = useState<"standard" | "brand-voice">("standard");
  const [selectedBrandVoiceModelId, setSelectedBrandVoiceModelId] = useState<string>("");
  const [isOveragePurchasing, setIsOveragePurchasing] = useState(false);
  const [useSsml, setUseSsml] = useState(false);
  const [ssmlText, setSsmlText] = useState("");

  const { data: templatesData } = useQuery<AnnouncementTemplate[]>({
    queryKey: ["announcement-templates"],
    queryFn: async () => {
      const result = await getAnnouncementTemplatesAction();
      if (!result.success) throw new Error(result.error || "Не удалось загрузить шаблоны");
      return result.data as AnnouncementTemplate[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: jinglesData } = useQuery<Array<{
    id: string;
    name: string;
    position: string;
    duration: number;
    volumeDb: number;
  }>>({
    queryKey: ["announcement-jingles"],
    queryFn: async () => {
      const result = await getPublishedAnnouncementJinglesAction();
      if (!result.success) throw new Error(result.error || "Не удалось загрузить джинглы");
      return result.data as Array<{
        id: string;
        name: string;
        position: string;
        duration: number;
        volumeDb: number;
      }>;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: brandVoiceOverview } = useQuery<{
    business: {
      brandVoiceMonthlyUsed: number;
      brandVoiceOverageCharsPurchased: number;
    };
    models: Array<{
      id: string;
      status: string;
      actor: { fullName: string };
      monthlyCharsLimit: number;
      monthlyCharsUsed: number;
    }>;
  }>({
    queryKey: ["brand-voice-overview-lite"],
    queryFn: async () => {
      const result = await getBrandVoiceOverviewAction();
      if (!result.success || !result.data) {
        throw new Error(result.error || "Не удалось загрузить Brand Voice модели");
      }
      return {
        business: {
          brandVoiceMonthlyUsed: result.data.business.brandVoiceMonthlyUsed,
          brandVoiceOverageCharsPurchased: result.data.business.brandVoiceOverageCharsPurchased ?? 0,
        },
        models: result.data.models as Array<{
          id: string;
          status: string;
          actor: { fullName: string };
          monthlyCharsLimit: number;
          monthlyCharsUsed: number;
        }>,
      };
    },
    staleTime: 30 * 1000,
  });

  const templates = templatesData ?? [];
  const readyBrandVoiceModels = (brandVoiceOverview?.models ?? []).filter((m) => m.status === "READY");
  const packOptions = [
    { id: "all", label: "Все" },
    ...Array.from(new Map(templates.map((template) => [template.pack, template.packLabel])).entries()).map(
      ([pack, packLabel]) => ({ id: pack, label: packLabel })
    ),
  ];
  const visibleTemplates =
    selectedPack === "all" ? templates : templates.filter((template) => template.pack === selectedPack);

  useEffect(() => {
    if (!selectedBrandVoiceModelId && readyBrandVoiceModels.length > 0) {
      setSelectedBrandVoiceModelId(readyBrandVoiceModels[0].id);
    }
  }, [readyBrandVoiceModels, selectedBrandVoiceModelId]);

  useEffect(() => {
    async function checkStatus() {
      const result = await getTtsProvidersStatusAction();
      if (result.success && result.data) {
        setProviderStatus(result.data);
        
        // Auto-select first available provider
        if (!result.data.sberbank && result.data.google) {
          setProvider("google");
        } else if (!result.data.sberbank && !result.data.google) {
          // If none are configured, stay on default but buttons will be disabled
        }
      }
    }
    checkStatus();
  }, []);

  // Update voice if provider changes
  useEffect(() => {
    setVoiceName(VOICES[provider][0].id);
    if (provider === "sberbank") {
      setSpeakingRate(1.0);
      setPitch(0.0);
    }
  }, [provider]);

  useEffect(() => {
    if (useSsml && provider !== "google") {
      setProvider("google");
      toast.info("Для SSML автоматически выбран Google Cloud TTS");
    }
  }, [useSsml, provider]);

  useEffect(() => {
    if (generationMode === "brand-voice" && useSsml) {
      setUseSsml(false);
      setSsmlText("");
    }
  }, [generationMode, useSsml]);

  const charCount = text.length;
  const isOptimal = charCount >= 150 && charCount <= 250;
  const ssmlValidation = useSsml ? validateSsmlBasic(ssmlText) : { errors: [], warnings: [] };
  const hasSsmlErrors = useSsml && ssmlValidation.errors.length > 0;

  const applyTemplate = (template: AnnouncementTemplate) => {
    setTitle(template.title);
    setText(template.text);

    if (template.provider) {
      const isConfigured = providerStatus ? providerStatus[template.provider] : true;
      if (isConfigured) {
        setProvider(template.provider);
      }
    }

    if (previewAudioUrl) {
      URL.revokeObjectURL(previewAudioUrl);
      setPreviewAudioUrl(null);
    }

    toast.success(`Шаблон "${template.name}" применен`);
  };

  const handlePreview = async () => {
    if (generationMode === "brand-voice") {
      toast.info("Превью пока доступно только для стандартного TTS");
      return;
    }

    if (!text) {
      toast.error("Пожалуйста, напишите текст анонса.");
      return;
    }

    if (text.length > 500) {
      toast.error("Текст не должен превышать 500 символов.");
      return;
    }

    if (hasSsmlErrors) {
      toast.error("Исправьте ошибки SSML перед превью");
      return;
    }

    // Clean up previous preview
    if (previewAudioUrl) {
      URL.revokeObjectURL(previewAudioUrl);
      setPreviewAudioUrl(null);
    }

    setIsPreviewing(true);
    try {
      const payload = buildAnnouncementPayload({
        title,
        text,
        provider,
        voiceName,
        speakingRate,
        pitch,
        selectedJingleId,
        useSsml,
        ssmlText,
      });

      const result = await previewVoiceAnnouncementAction({
        text: payload.text,
        ssmlText: payload.ssmlText,
        voiceName: payload.voiceName,
        speakingRate: payload.speakingRate,
        pitch: payload.pitch,
        provider: payload.provider,
      });

      if (result.success && result.data) {
        const binaryStr = atob(result.data.audioBase64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: result.data.mimeType });
        const url = URL.createObjectURL(blob);
        setPreviewAudioUrl(url);

        const audio = new Audio(url);
        audio.play();
        toast.success("Превью готово! Токен не списан.");
      } else {
        toast.error(result.error || "Не удалось создать превью.");
      }
    } catch {
      toast.error("Ошибка генерации превью.");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !text) {
      toast.error("Пожалуйста, заполните заголовок и текст анонса.");
      return;
    }

    if (generationMode === "standard" && !canGenerate) {
      toast.error("Лимит генераций исчерпан. Приобретите пакет токенов.");
      return;
    }

    if (generationMode === "brand-voice" && !selectedBrandVoiceModelId) {
      toast.error("Выберите готовую Brand Voice модель.");
      return;
    }

    if (hasSsmlErrors) {
      toast.error("Исправьте ошибки SSML перед созданием анонса");
      return;
    }

    setIsGenerating(true);
    try {
      const payload = buildAnnouncementPayload({
        title,
        text,
        provider,
        voiceName,
        speakingRate,
        pitch,
        selectedJingleId,
        useSsml,
        ssmlText,
      });

      const result = await generateVoiceAnnouncementAction({
        ...payload,
        brandVoiceModelId: generationMode === "brand-voice" ? selectedBrandVoiceModelId : undefined,
      });

      if (result.success) {
        toast.success("Анонс успешно создан и добавлен в библиотеку.");
        setText("");
        setTitle("");
        setSelectedJingleId("");
        setUseSsml(false);
        setSsmlText("");
        onSuccess?.();
      } else {
        toast.error(result.error || "Не удалось создать анонс.");
      }
    } catch {
      toast.error("Произошла ошибка при создании анонса.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiAssist = async () => {
    if (!text) {
      toast.error("Пожалуйста, напишите черновик анонса.");
      return;
    }

    if (text.length > 500) {
      toast.error("Черновик анонса не должен превышать 500 символов.");
      return;
    }

    setIsAiGenerating(true);
    try {
      const result = await generateAiAssistAction({
        userDraft: text,
        locale: "ru-RU",
      });

      if (result.success && result.data) {
        setText(result.data.refinedText);
        toast.success("✨ Текст улучшен! Вы можете отредактировать и создать анонс.");
      } else {
        toast.error(result.error || "Не удалось улучшить текст.");
      }
    } catch {
      toast.error("Произошла ошибка при обращении к ИИ.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <Card className="w-full glass-dark border-white/5 rounded-[2rem] shadow-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-neon/10 rounded-xl flex items-center justify-center border border-neon/20">
            <Mic size={24} className="text-neon" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black uppercase tracking-tighter text-white">Новый <span className="text-neon">анонс</span></CardTitle>
            <CardDescription className="text-neutral-400 font-medium">
              Создайте профессиональное аудиосообщение для вашего заведения
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center">
                  <LayoutTemplate size={16} className="text-neon" />
                </div>
                <div>
                  <Label className="text-neutral-300 font-bold uppercase tracking-widest text-[10px]">
                    Шаблоны и сезонные пакеты
                  </Label>
                  <p className="text-[10px] text-neutral-500 font-medium">
                    Быстрый старт для акций, поздравлений и сервисных сообщений
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/30 border border-white/10 overflow-x-auto">
                {packOptions.map((pack) => (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => setSelectedPack(pack.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                      selectedPack === pack.id
                        ? "bg-neon text-black"
                        : "text-neutral-400 hover:text-white"
                    )}
                  >
                    {pack.label}
                  </button>
                ))}
              </div>
            </div>

            {visibleTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {visibleTemplates.slice(0, 8).map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="text-left p-3 rounded-xl bg-white/5 border border-white/10 hover:border-neon/40 hover:bg-neon/5 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <p className="text-xs font-black uppercase tracking-tight text-white truncate">{template.name}</p>
                      <span className="inline-flex items-center gap-1 text-[9px] text-neutral-500 font-black uppercase tracking-widest">
                        <CalendarDays size={11} className="text-neon/70" /> {template.packLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 line-clamp-2">{template.text}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-neutral-500">Шаблоны пока не найдены.</p>
            )}

            {generationMode === "brand-voice" && (
              <div className="space-y-2">
                {readyBrandVoiceModels.length === 0 ? (
                  <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-3 space-y-2">
                    <p>Нет готовых Brand Voice моделей.</p>
                    <Link
                      href="/dashboard/brand-voice"
                      className="block text-center py-1.5 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg font-black uppercase tracking-wider transition-all"
                    >
                      Настроить Brand Voice →
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {readyBrandVoiceModels.map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => setSelectedBrandVoiceModelId(model.id)}
                        className={cn(
                          "px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border text-left",
                          selectedBrandVoiceModelId === model.id
                            ? "bg-neon text-black border-neon"
                            : "bg-white/5 border-white/10 text-neutral-300 hover:border-white/20"
                        )}
                      >
                        <div className="truncate">{model.actor?.fullName || "Диктор"}</div>
                        <div className={cn("mt-1 text-[9px]", selectedBrandVoiceModelId === model.id ? "text-black/80" : "text-neutral-500")}>ID: {model.id.slice(0, 8)} • Лимит: {model.monthlyCharsLimit.toLocaleString("ru-RU")}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {generationMode === "brand-voice" && selectedBrandVoiceModelId && (() => {
              const activeModel = readyBrandVoiceModels.find((m) => m.id === selectedBrandVoiceModelId);
              if (!activeModel) return null;
              const businessUsed = brandVoiceOverview?.business.brandVoiceMonthlyUsed ?? activeModel.monthlyCharsUsed;
              const overagePurchased = brandVoiceOverview?.business.brandVoiceOverageCharsPurchased ?? 0;
              const effectiveLimit = activeModel.monthlyCharsLimit + overagePurchased;
              const remaining = Math.max(0, effectiveLimit - businessUsed);
              if (remaining > 0) return null;
              return (
                <div className="mt-2 text-xs text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-3 space-y-2">
                  <p className="font-bold">Лимит символов исчерпан.</p>
                  <p className="text-orange-400/80">Докупите +1 000 символов по вашему тарифу (от 5 ₽ / 1 000).</p>
                  <button
                    type="button"
                    disabled={isOveragePurchasing}
                    onClick={async () => {
                      setIsOveragePurchasing(true);
                      try {
                        const res = await purchaseBrandVoiceOverageAction(selectedBrandVoiceModelId, 10);
                        if (res.success && res.paymentUrl) {
                          window.location.href = res.paymentUrl;
                        } else {
                          toast.error(res.error || "Ошибка платежа");
                        }
                      } catch {
                        toast.error("Не удалось создать платёж на овердрафт");
                      } finally {
                        setIsOveragePurchasing(false);
                      }
                    }}
                    className="w-full py-2 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg font-black uppercase tracking-wider transition-all disabled:opacity-50"
                  >
                    {isOveragePurchasing ? "Ожидайте..." : "Докупить +10 000 символов →"}
                  </button>
                </div>
              );
            })()}
          </div>

          <div className="space-y-3">
            <Label className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">
              Режим генерации
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGenerationMode("standard")}
                className={cn(
                  "px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border text-left",
                  generationMode === "standard"
                    ? "bg-neon text-black border-neon"
                    : "bg-white/5 border-white/10 text-neutral-400 hover:border-white/20"
                )}
              >
                Стандартный TTS
              </button>
              <button
                type="button"
                onClick={() => setGenerationMode("brand-voice")}
                className={cn(
                  "px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border text-left",
                  generationMode === "brand-voice"
                    ? "bg-neon text-black border-neon"
                    : "bg-white/5 border-white/10 text-neutral-400 hover:border-white/20"
                )}
              >
                Brand Voice
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="title" className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">
              Название (для библиотеки)
            </Label>
            <Input
              id="title"
              placeholder="Напр: Акция на кофе 1+1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-neutral-600 rounded-xl h-12 focus:border-neon/50 focus:ring-0"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label htmlFor="text" className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Текст анонса</Label>
              <span className={`text-[10px] font-black uppercase tracking-widest ${charCount > 500 ? 'text-red-500' : isOptimal ? 'text-neon' : 'text-neutral-600'}`}>
                {charCount} / 500 {isOptimal && "• Оптимально"}
              </span>
            </div>
            <Textarea
              id="text"
              placeholder="Введите текст, который будет озвучен..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[140px] bg-white/5 border-white/10 text-white placeholder:text-neutral-600 rounded-xl focus:border-neon/50 focus:ring-0 resize-none"
            />
            <div className="flex items-start gap-2 mt-2 px-1">
              <Info size={14} className="text-neon mt-0.5 shrink-0" />
              <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-tight leading-tight">
                Рекомендуем 150-250 символов для лучшего восприятия клиентами в торговом зале или кафе.
              </p>
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Label className="text-neutral-400 font-bold uppercase tracking-widest text-[10px]">SSML режим (Google)</Label>
              <button
                type="button"
                onClick={() => setUseSsml((v) => !v)}
                className={cn(
                  "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                  useSsml ? "bg-neon text-black border-neon" : "bg-white/5 border-white/10 text-neutral-400"
                )}
              >
                {useSsml ? "SSML включен" : "SSML выключен"}
              </button>
            </div>

            {useSsml && (
              <>
                <div className="flex flex-wrap gap-2">
                  {SSML_SNIPPETS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSsmlText((prev) => `${prev}${prev ? "\n" : ""}${item.snippet}`)}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:border-neon/40 hover:bg-neon/5 transition-all"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <Textarea
                  value={ssmlText}
                  onChange={(e) => setSsmlText(e.target.value)}
                  placeholder="<speak>Добро пожаловать в <break time='300ms'/> наш магазин</speak>"
                  className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-neutral-600 rounded-xl focus:border-neon/50 focus:ring-0 resize-none font-mono text-[12px]"
                />
                {ssmlValidation.errors.length > 0 && (
                  <div className="space-y-1 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2">
                    {ssmlValidation.errors.map((error, i) => (
                      <p key={`${error}-${i}`} className="text-[10px] text-red-300 font-medium">• {error}</p>
                    ))}
                  </div>
                )}
                {ssmlValidation.warnings.length > 0 && (
                  <div className="space-y-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                    {ssmlValidation.warnings.map((warning, i) => (
                      <p key={`${warning}-${i}`} className="text-[10px] text-amber-300 font-medium">• {warning}</p>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-neutral-500">
                  Поддерживаются теги Google SSML, например: speak, break, emphasis, prosody.
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Провайдер</Label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDERS.map((p) => {
                  const isConfigured = providerStatus ? providerStatus[p.id] : true; // Assume true while loading
                  
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={!isConfigured}
                      onClick={() => setProvider(p.id)}
                      className={cn(
                        "group relative px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                        provider === p.id
                          ? "bg-neon text-black border-neon shadow-lg shadow-neon/20"
                          : isConfigured 
                            ? "bg-white/5 border-white/10 text-neutral-400 hover:border-white/20"
                            : "bg-white/[0.02] border-white/5 text-neutral-700 cursor-not-allowed opacity-50"
                      )}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {p.name}
                        {!isConfigured && <AlertTriangle size={10} className="text-amber-500" />}
                      </div>
                      
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black border border-white/10 rounded-lg text-[8px] leading-tight text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                        {!isConfigured ? "Провайдер не настроен. Добавьте API ключи в .env" : p.description}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[9px] text-neutral-500 font-medium italic">
                {PROVIDERS.find(p => p.id === provider)?.description}
              </p>
            </div>

            <div className="space-y-4">
              <Label className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Выберите голос</Label>
              <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                {VOICES[provider].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVoiceName(v.id)}
                    className={`px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      voiceName === v.id
                        ? 'bg-neon text-black border-neon shadow-lg shadow-neon/20'
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:border-white/20'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Джингл (опционально)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedJingleId("")}
                className={cn(
                  "px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border text-left",
                  selectedJingleId === ""
                    ? "bg-neon text-black border-neon"
                    : "bg-white/5 border-white/10 text-neutral-400 hover:border-white/20"
                )}
              >
                Без джингла
              </button>

              {(jinglesData ?? []).map((jingle) => (
                <button
                  key={jingle.id}
                  type="button"
                  onClick={() => setSelectedJingleId(jingle.id)}
                  className={cn(
                    "px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border text-left",
                    selectedJingleId === jingle.id
                      ? "bg-neon text-black border-neon"
                      : "bg-white/5 border-white/10 text-neutral-400 hover:border-white/20"
                  )}
                >
                  <div className="truncate">{jingle.name}</div>
                  <div className={cn("mt-1 text-[9px]", selectedJingleId === jingle.id ? "text-black/80" : "text-neutral-600")}>
                    {jingle.position === "outro" ? "Outro" : "Intro"} · {jingle.duration}с · {jingle.volumeDb} dB
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Скорость речи</Label>
                <span className="text-[10px] text-neon font-black font-mono">x{speakingRate.toFixed(1)}</span>
              </div>
              <Slider
                value={[speakingRate]}
                min={0.5}
                max={2.0}
                step={0.1}
                disabled={provider === "sberbank"}
                onValueChange={(vals) => setSpeakingRate(vals[0])}
                className="py-2"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Тон (Pitch)</Label>
                <span className="text-[10px] text-neon font-black font-mono">{pitch > 0 ? '+' : ''}{pitch.toFixed(1)}</span>
              </div>
              <Slider
                value={[pitch]}
                min={-20}
                max={20}
                step={1}
                disabled={provider === "sberbank"}
                onValueChange={(vals) => setPitch(vals[0])}
                className="py-2"
              />
              {provider === "sberbank" && (
                <p className="text-[9px] text-neutral-500 font-medium italic">
                  Для SaluteSpeech REST text:synthesize доступны выбор голоса и текст. Скорость и тон недоступны.
                </p>
              )}
            </div>
          </div>

          <div className="pt-6">
            {generationMode === "standard" && !canGenerate && (
              <p className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
                Лимит генераций исчерпан. Приобретите пакет токенов, чтобы продолжить.
              </p>
            )}

            {/* Preview audio player */}
            {previewAudioUrl && (
              <div className="mb-4 p-4 bg-white/5 border border-neon/20 rounded-2xl space-y-2">
                <p className="text-[10px] text-neon font-black uppercase tracking-widest">Превью (токен не списан)</p>
                <audio controls src={previewAudioUrl} className="w-full h-10 [&::-webkit-media-controls-panel]:bg-neutral-800 rounded-lg" />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                disabled={isAiGenerating || !text || text.length > 500}
                onClick={handleAiAssist}
                className="flex-1 bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 border border-violet-500/30 hover:border-violet-500/50 active:scale-[0.98] transition-all rounded-2xl h-14 font-black uppercase text-xs tracking-[0.2em] shadow-lg hover:shadow-violet-500/20"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ИИ улучшает...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    ✨ Улучшить с ИИ
                  </>
                )}
              </Button>
              <Button
                type="button"
                disabled={generationMode === "brand-voice" || isPreviewing || !text || text.length > 500 || hasSsmlErrors}
                onClick={handlePreview}
                className="bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 hover:border-cyan-500/50 active:scale-[0.98] transition-all rounded-2xl h-14 px-6 font-black uppercase text-xs tracking-[0.2em] shadow-lg hover:shadow-cyan-500/20"
              >
                {isPreviewing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Headphones className="h-5 w-5" />
                )}
              </Button>
              <Button
                type="submit"
                disabled={isGenerating || !text || !title || (generationMode === "standard" && !canGenerate) || (generationMode === "brand-voice" && !selectedBrandVoiceModelId) || hasSsmlErrors}
                className="flex-1 bg-neon text-black hover:scale-[1.02] active:scale-[0.98] transition-all rounded-2xl h-14 font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-neon/20"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Генерация...
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-5 w-5 fill-current" />
                    Создать анонс
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
