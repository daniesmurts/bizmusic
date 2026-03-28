"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mic, Loader2, Info, Sparkles } from "lucide-react";
import { generateVoiceAnnouncementAction } from "@/lib/actions/voice-announcements";
import { generateAiAssistAction } from "@/lib/actions/ai-assists";
import { toast } from "sonner";

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
  const [provider, setProvider] = useState<"google" | "sberbank">("sberbank");
  const [voiceName, setVoiceName] = useState(VOICES.sberbank[0].id);
  const [speakingRate, setSpeakingRate] = useState(1.0);
  const [pitch, setPitch] = useState(0.0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Update voice if provider changes
  useEffect(() => {
    setVoiceName(VOICES[provider][0].id);
    if (provider === "sberbank") {
      setSpeakingRate(1.0);
      setPitch(0.0);
    }
  }, [provider]);

  const charCount = text.length;
  const isOptimal = charCount >= 150 && charCount <= 250;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !text) {
      toast.error("Пожалуйста, заполните заголовок и текст анонса.");
      return;
    }

    if (!canGenerate) {
      toast.error("Лимит генераций исчерпан. Приобретите пакет токенов.");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateVoiceAnnouncementAction({
        text,
        title,
        voiceName,
        speakingRate,
        pitch,
        provider,
      });

      if (result.success) {
        toast.success("Анонс успешно создан и добавлен в библиотеку.");
        setText("");
        setTitle("");
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
          <div className="space-y-3">
            <Label htmlFor="title" className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Название (для библиотеки)</Label>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Провайдер</Label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProvider(p.id)}
                    className={`group relative px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      provider === p.id
                        ? 'bg-neon text-black border-neon shadow-lg shadow-neon/20'
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:border-white/20'
                    }`}
                  >
                    {p.name}
                    {p.showTooltip && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black border border-white/10 rounded-lg text-[8px] leading-tight text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl">
                        {p.description}
                      </div>
                    )}
                  </button>
                ))}
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
            {!canGenerate && (
              <p className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-4">
                Лимит генераций исчерпан. Приобретите пакет токенов, чтобы продолжить.
              </p>
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
                type="submit"
                disabled={isGenerating || !text || !title || !canGenerate}
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
