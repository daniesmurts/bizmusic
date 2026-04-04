"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  addVoiceSampleMetadataAction,
  createBrandVoiceModelDraftAction,
  createBrandVoiceSampleUploadUrlAction,
  createVoiceActorAction,
  getBrandVoiceOverviewAction,
  markVoiceActorConsentAction,
  resendConsentInviteAction,
  startBrandVoiceTrainingAction,
  syncBrandVoiceModelStatusAction,
} from "@/lib/actions/brand-voice";
import {
  purchaseBrandVoiceMonthlyAction,
  startBrandVoiceSetupPaymentAction,
} from "@/lib/actions/payments";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  Mail,
  Mic,
  PlayCircle,
  RefreshCcw,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

const TIERS = {
  starter: { label: "Старт", monthlyChars: 10_000, setupRub: 25_000, monthlyRub: 3_900 },
  business: { label: "Бизнес", monthlyChars: 50_000, setupRub: 35_000, monthlyRub: 7_900 },
  enterprise: { label: "Корпоратив", monthlyChars: 250_000, setupRub: 60_000, monthlyRub: 14_900 },
} as const;

type Tier = keyof typeof TIERS;

function formatStatus(status: string) {
  const map: Record<string, string> = {
    PENDING: "Черновик",
    CONSENT_PENDING: "Ожидает согласия",
    SAMPLES_PENDING: "Ожидает образцы",
    TRAINING: "Обучается",
    READY: "Готов",
    FAILED: "Ошибка",
    REVOKED: "Отозван",
  };
  return map[status] || status;
}

export default function BrandVoicePage() {
  const queryClient = useQueryClient();
  const [tier, setTier] = useState<Tier>("starter");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"employee" | "external" | "owner">("employee");
  const [uploading, setUploading] = useState(false);

  const overviewQuery = useQuery({
    queryKey: ["brand-voice-overview"],
    queryFn: async () => {
      const result = await getBrandVoiceOverviewAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    refetchInterval: (query) => {
      const models = query.state.data?.models ?? [];
      const shouldPoll = models.some((model: { status: string }) =>
        ["TRAINING", "CONSENT_PENDING", "SAMPLES_PENDING"].includes(model.status)
      );
      return shouldPoll ? 5000 : false;
    },
  });

  const activeModel = useMemo(() => {
    const models = overviewQuery.data?.models ?? [];
    return models[0] || null;
  }, [overviewQuery.data]);

  const isYandexMode = overviewQuery.data?.providerMode === "yandex";

  const createModelMutation = useMutation({
    mutationFn: async () => {
      const actorResult = await createVoiceActorAction({
        fullName,
        email,
        phone,
        role,
      });
      if (!actorResult.success || !actorResult.data) {
        throw new Error(actorResult.error || "Не удалось создать диктора");
      }

      const modelResult = await createBrandVoiceModelDraftAction({
        actorId: actorResult.data.id,
        subscriptionTier: tier,
        monthlyCharsLimit: TIERS[tier].monthlyChars,
      });
      if (!modelResult.success || !modelResult.data) {
        throw new Error(modelResult.error || "Не удалось создать модель");
      }

      return modelResult.data;
    },
    onSuccess: () => {
      toast.success("Черновик Brand Voice создан");
      setFullName("");
      setEmail("");
      setPhone("");
      queryClient.invalidateQueries({ queryKey: ["brand-voice-overview"] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Ошибка создания модели");
    },
  });

  const setupPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!activeModel) throw new Error("Сначала создайте модель");
      const result = await startBrandVoiceSetupPaymentAction(activeModel.id, (activeModel.subscriptionTier || tier) as Tier);
      if (!result.success || !result.paymentUrl) {
        throw new Error(result.error || "Не удалось создать платеж");
      }
      return result.paymentUrl;
    },
    onSuccess: (paymentUrl) => {
      window.location.href = paymentUrl;
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Ошибка оплаты");
    },
  });

  const monthlyPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!activeModel) throw new Error("Модель не найдена");
      const result = await purchaseBrandVoiceMonthlyAction(activeModel.id);
      if (!result.success || !result.paymentUrl) {
        throw new Error(result.error || "Не удалось создать ежемесячный платеж");
      }
      return result.paymentUrl;
    },
    onSuccess: (paymentUrl) => {
      window.location.href = paymentUrl;
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Ошибка оплаты");
    },
  });

  const consentMutation = useMutation({
    mutationFn: async (accepted: boolean) => {
      if (!activeModel?.actor?.id) throw new Error("Диктор не найден");
      const result = await markVoiceActorConsentAction(activeModel.actor.id, accepted);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success("Статус согласия обновлен");
      queryClient.invalidateQueries({ queryKey: ["brand-voice-overview"] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Ошибка обновления согласия");
    },
  });

  const trainingMutation = useMutation({
    mutationFn: async () => {
      if (!activeModel) throw new Error("Модель не найдена");
      const result = await startBrandVoiceTrainingAction(activeModel.id);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success("Обучение запущено");
      queryClient.invalidateQueries({ queryKey: ["brand-voice-overview"] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Ошибка запуска обучения");
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!activeModel) throw new Error("Модель не найдена");
      const result = await syncBrandVoiceModelStatusAction(activeModel.id);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-voice-overview"] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Ошибка синхронизации");
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: async () => {
      if (!activeModel?.actor?.id) throw new Error("Диктор не найден");
      const result = await resendConsentInviteAction(activeModel.actor.id);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success("Приглашение отправлено повторно");
      queryClient.invalidateQueries({ queryKey: ["brand-voice-overview"] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Ошибка отправки");
    },
  });

  async function handleUploadSamples(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0 || !activeModel?.actor?.id) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const signed = await createBrandVoiceSampleUploadUrlAction({
          modelId: activeModel.id,
          actorId: activeModel.actor.id,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        });

        if (!signed.success || !signed.data) {
          throw new Error(signed.error || "Не удалось подготовить загрузку");
        }

        const uploadResponse = await fetch(signed.data.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error("Не удалось загрузить файл в хранилище");
        }

        const saved = await addVoiceSampleMetadataAction({
          actorId: activeModel.actor.id,
          modelId: activeModel.id,
          fileUrl: signed.data.objectPath,
          fileName: signed.data.storedFileName,
          fileSizeBytes: file.size,
          mimeType: file.type,
        });

        if (!saved.success) {
          throw new Error(saved.error || "Не удалось сохранить метаданные образца");
        }
      }

      toast.success("Образцы загружены");
      queryClient.invalidateQueries({ queryKey: ["brand-voice-overview"] });
      event.target.value = "";
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Ошибка загрузки образцов");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/announcements" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white text-[10px] font-black uppercase tracking-widest mb-3 transition-colors">
            <ArrowLeft className="w-3 h-3" /> К анонсам
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white">
            Brand <span className="text-neon">Voice</span>
          </h1>
          <p className="text-neutral-400 text-sm mt-1">Онбординг, загрузка образцов и контроль статуса обучения</p>
        </div>
        <Button
          variant="outline"
          onClick={() => syncMutation.mutate()}
          disabled={!activeModel || syncMutation.isPending}
          className="rounded-2xl border-white/15 text-white hover:bg-white/10"
        >
          {syncMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
          Обновить статус
        </Button>
      </div>

      <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Mic className="w-5 h-5 text-neon" />
          <h2 className="text-lg font-black uppercase tracking-tight text-white">Шаг 1. Создание черновика</h2>
        </div>

        {!activeModel ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-3">
              <Label>ФИО диктора</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иван Иванов" />
            </div>
            <div className="space-y-3">
              <Label>Email диктора</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ivan@company.ru" />
            </div>
            <div className="space-y-3">
              <Label>Телефон</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (999) 123-45-67" />
            </div>
            <div className="space-y-3">
              <Label>Роль диктора</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "employee" | "external" | "owner")}
                className="w-full h-10 rounded-md border border-white/10 bg-neutral-900 px-3 text-sm"
              >
                <option value="employee">Сотрудник</option>
                <option value="external">Внешний диктор</option>
                <option value="owner">Владелец</option>
              </select>
            </div>
            <div className="space-y-3 lg:col-span-2">
              <Label>Тариф</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(Object.keys(TIERS) as Tier[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setTier(key)}
                    type="button"
                    className={`rounded-xl border px-4 py-3 text-left transition-all ${
                      tier === key ? "border-neon bg-neon/10" : "border-white/10 bg-white/5"
                    }`}
                  >
                    <p className="text-sm font-black uppercase">{TIERS[key].label}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{TIERS[key].monthlyChars.toLocaleString("ru-RU")} симв./мес</p>
                    <p className="text-[11px] text-neutral-500 mt-1">Setup: {TIERS[key].setupRub.toLocaleString("ru-RU")} ₽</p>
                    <p className="text-[11px] text-neutral-500">{TIERS[key].monthlyRub.toLocaleString("ru-RU")} ₽/мес</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2">
              <Button onClick={() => createModelMutation.mutate()} disabled={createModelMutation.isPending} className="bg-neon text-black hover:bg-neon/90 rounded-xl">
                {createModelMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Создать черновик
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="border-neon/30 text-neon">{formatStatus(activeModel.status)}</Badge>
              <span className="text-sm text-neutral-300">Диктор: {activeModel.actor.fullName}</span>
              <span className="text-xs text-neutral-500">Тариф: {activeModel.subscriptionTier || "-"}</span>
            </div>
            <p className="text-sm text-neutral-400">Модель уже создана. Ниже продолжите шаги онбординга.</p>
          </div>
        )}
      </section>

      {activeModel && (
        <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-neon" />
            <h2 className="text-lg font-black uppercase tracking-tight text-white">Шаг 2. Оплата и согласие</h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setupPaymentMutation.mutate()} disabled={setupPaymentMutation.isPending} className="rounded-xl bg-neon text-black hover:bg-neon/90">
              {setupPaymentMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
              Оплатить setup
            </Button>
            <Button onClick={() => monthlyPaymentMutation.mutate()} disabled={monthlyPaymentMutation.isPending} variant="outline" className="rounded-xl border-white/20">
              {monthlyPaymentMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Clock3 className="w-4 h-4 mr-2" />}
              Оплатить месяц лимита
            </Button>
          </div>

          {/* Статус приглашения на согласие */}
          {activeModel.status === "CONSENT_PENDING" && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-300">
                    Ожидаем согласия диктора
                  </p>
                  <p className="text-xs text-amber-500/80 mt-0.5">
                    Приглашение отправлено на{" "}
                    <span className="font-medium text-amber-300">{activeModel.actor.email}</span>.
                    {activeModel.actor.consentTokenExpiresAt && (
                      <>
                        {" "}Действительно до{" "}
                        {new Date(activeModel.actor.consentTokenExpiresAt).toLocaleDateString("ru-RU", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}.
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resendInviteMutation.mutate()}
                  disabled={resendInviteMutation.isPending}
                  className="rounded-lg border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs h-8"
                >
                  {resendInviteMutation.isPending ? (
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  ) : (
                    <Mail className="w-3 h-3 mr-1.5" />
                  )}
                  Отправить повторно
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => consentMutation.mutate(true)}
                  disabled={consentMutation.isPending}
                  className="rounded-lg border-white/20 text-neutral-400 text-xs h-8"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1.5" />
                  Подтвердить вручную
                </Button>
                <a
                  href="/consent/preview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Открыть форму согласия
                </a>
              </div>
            </div>
          )}

          {activeModel.actor.consentAcceptedAt && !activeModel.actor.consentRevokedAt && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Согласие получено{" "}
              {activeModel.actor.consentAcceptedAt
                ? new Date(activeModel.actor.consentAcceptedAt).toLocaleDateString("ru-RU")
                : ""}
            </div>
          )}
        </section>
      )}

      {activeModel && (
        <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Upload className="w-5 h-5 text-neon" />
            <h2 className="text-lg font-black uppercase tracking-tight text-white">Шаг 3. Образцы голоса</h2>
          </div>

          <p className="text-sm text-neutral-400">
            Загружено: {Number(activeModel.samplesUploadedSeconds || 0).toLocaleString("ru-RU")} сек. из рекомендуемых 600+ сек.
          </p>

          {isYandexMode && (
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-2">
              <p className="text-sm font-semibold text-sky-300">Yandex Brand Voice Lite</p>
              <p className="text-xs text-sky-100/80 leading-5">
                Ваши образцы переданы на обработку. После завершения обучения в Yandex SpeechKit
                наш администратор активирует вашу голосовую модель — обычно в течение 1–2 рабочих
                дней. Статус ниже обновится автоматически.
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="file"
              multiple
              accept="audio/*"
              onChange={handleUploadSamples}
              disabled={uploading}
              className="block w-full text-sm text-neutral-300 file:mr-4 file:rounded-lg file:border-0 file:bg-neon file:px-4 file:py-2 file:text-black"
            />
          </div>

          {isYandexMode ? (
            <p className="text-xs text-neutral-500 leading-5">
              Кнопка запуска обучения недоступна — Yandex Brand Voice Lite обучается в нашей консоли Yandex SpeechKit администратором.
            </p>
          ) : (
            <Button onClick={() => trainingMutation.mutate()} disabled={trainingMutation.isPending || uploading} className="rounded-xl bg-neon text-black hover:bg-neon/90">
              {trainingMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
              Запустить обучение
            </Button>
          )}
        </section>
      )}

      {overviewQuery.isLoading && (
        <div className="flex items-center gap-2 text-neutral-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Загрузка состояния Brand Voice...
        </div>
      )}
    </div>
  );
}
