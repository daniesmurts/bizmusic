"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
  Mic,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  adminAttachYandexModelUriAction,
  adminGetAllBrandVoiceModelsAction,
  adminGetBrandVoiceStatsAction,
  adminUpdateBrandVoiceModelStatusAction,
} from "@/lib/actions/brand-voice-admin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BrandVoiceModel = NonNullable<
  Awaited<ReturnType<typeof adminGetAllBrandVoiceModelsAction>>["data"]
>[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Черновик",
  CONSENT_PENDING: "Ожидает согласия",
  SAMPLES_PENDING: "Ожидает образцы",
  TRAINING: "Обучается",
  READY: "Готов",
  FAILED: "Ошибка",
  REVOKED: "Отозван",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "border-neutral-500/30 text-neutral-400",
  CONSENT_PENDING: "border-amber-500/30 text-amber-300",
  SAMPLES_PENDING: "border-sky-500/30 text-sky-300",
  TRAINING: "border-purple-500/30 text-purple-300",
  READY: "border-neon/30 text-neon",
  FAILED: "border-red-500/30 text-red-400",
  REVOKED: "border-red-500/20 text-red-500/60",
};

const ALL_STATUSES = [
  "PENDING",
  "CONSENT_PENDING",
  "SAMPLES_PENDING",
  "TRAINING",
  "READY",
  "FAILED",
  "REVOKED",
];

function formatBytes(bytes: number | null | undefined) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function formatSeconds(sec: number | null | undefined) {
  if (!sec) return "0 с";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s} с`;
  return `${m} мин ${s} с`;
}

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// ModelRow
// ---------------------------------------------------------------------------

function ModelRow({ model }: { model: BrandVoiceModel }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [modelUri, setModelUri] = useState(model.providerModelId ?? "");
  const [overrideStatus, setOverrideStatus] = useState(model.status);

  const totalSampleSeconds =
    model.actor.samples?.reduce((acc, s) => acc + (s.durationSeconds ?? 0), 0) ?? 0;

  const attachMutation = useMutation({
    mutationFn: async () => {
      const result = await adminAttachYandexModelUriAction(model.id, modelUri);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success("Yandex model URI привязан — модель активна");
      queryClient.invalidateQueries({ queryKey: ["admin-brand-voice-models"] });
      queryClient.invalidateQueries({ queryKey: ["admin-brand-voice-stats"] });
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Ошибка привязки модели");
    },
  });

  const overrideMutation = useMutation({
    mutationFn: async () => {
      const result = await adminUpdateBrandVoiceModelStatusAction(model.id, overrideStatus);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success("Статус обновлён");
      queryClient.invalidateQueries({ queryKey: ["admin-brand-voice-models"] });
      queryClient.invalidateQueries({ queryKey: ["admin-brand-voice-stats"] });
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Ошибка обновления статуса");
    },
  });

  const consentStatus =
    model.actor.consentRevokedAt
      ? "Отозвано"
      : model.actor.consentAcceptedAt
        ? "Есть согласие"
        : "Нет согласия";

  const consentColor =
    model.actor.consentRevokedAt
      ? "border-red-500/30 text-red-400"
      : model.actor.consentAcceptedAt
        ? "border-neon/30 text-neon"
        : "border-amber-500/30 text-amber-300";

  return (
    <div className="border border-white/5 rounded-2xl overflow-hidden">
      {/* Row header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-5 flex flex-col md:flex-row md:items-center gap-4 hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {model.business?.legalName ?? "—"}
            </p>
            <p className="text-xs text-neutral-500">ИНН {model.business?.inn ?? "—"}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-4 shrink-0">
          <div className="hidden md:block">
            <p className="text-xs text-neutral-500 mb-0.5">Диктор</p>
            <p className="text-sm text-white">{model.actor.fullName}</p>
          </div>

          <Badge variant="outline" className={consentColor}>
            {consentStatus}
          </Badge>

          <Badge
            variant="outline"
            className={STATUS_COLORS[model.status] ?? "border-white/10 text-white"}
          >
            {STATUS_LABELS[model.status] ?? model.status}
          </Badge>

          <div className="text-right hidden sm:block">
            <p className="text-xs text-neutral-500">Образцы</p>
            <p className="text-sm text-white">
              {model.actor.samples?.length ?? 0} файл — {formatSeconds(totalSampleSeconds)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-neutral-500">Создан</p>
            <p className="text-sm text-white">{formatDate(model.createdAt)}</p>
          </div>
        </div>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-white/5 p-5 space-y-6 bg-white/2">
          {/* Actor info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">
                Имя диктора
              </p>
              <p className="text-white">{model.actor.fullName}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">
                Email
              </p>
              <p className="text-white">{model.actor.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">
                Роль
              </p>
              <p className="text-white">{model.actor.role}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">
                Согласие принято
              </p>
              <p className="text-white">{formatDate(model.actor.consentAcceptedAt)}</p>
            </div>
          </div>

          {/* Samples */}
          {(model.actor.samples?.length ?? 0) > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Загруженные образцы ({model.actor.samples?.length})
              </p>
              <div className="space-y-1">
                {model.actor.samples?.map((sample) => (
                  <div
                    key={sample.id}
                    className="flex items-center justify-between gap-4 rounded-xl px-4 py-2 bg-white/5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{sample.fileName}</p>
                      <p className="text-xs text-neutral-500">
                        {formatBytes(sample.fileSizeBytes)} · {formatSeconds(sample.durationSeconds)}
                      </p>
                    </div>
                    <a
                      href={sample.fileUrl}
                      download={sample.fileName}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 flex items-center gap-1.5 text-xs text-neon hover:text-neon/80 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Скачать
                    </a>
                  </div>
                ))}
              </div>
              <p className="text-xs text-neutral-500 leading-5">
                Скачайте файлы, загрузите их в{" "}
                <a
                  href="https://cloud.yandex.ru/services/speechkit"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 underline"
                >
                  консоль Yandex SpeechKit
                </a>{" "}
                → создайте модель Brand Voice Lite → дождитесь статуса «Active» → скопируйте model URI ниже.
              </p>
            </div>
          ) : (
            <div className="text-sm text-neutral-500">
              Образцы ещё не загружены
            </div>
          )}

          {/* Attach Yandex URI */}
          <div className="space-y-3 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
            <p className="text-sm font-semibold text-sky-300">Привязать Yandex model URI</p>
            {model.providerModelId && (
              <div className="text-xs font-mono text-sky-200/70 break-all">
                Текущий URI: {model.providerModelId}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor={`model-uri-${model.id}`}>Model URI SpeechKit</Label>
              <Input
                id={`model-uri-${model.id}`}
                value={modelUri}
                onChange={(e) => setModelUri(e.target.value)}
                placeholder="tts://<folder_ID>/bvss-v1/latest@<voice_ID>/?<model_ID>"
                className="font-mono text-sm"
              />
            </div>
            <Button
              onClick={() => attachMutation.mutate()}
              disabled={attachMutation.isPending || !modelUri.trim()}
              className="rounded-xl bg-sky-300 text-slate-950 hover:bg-sky-300/90"
            >
              {attachMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Активировать модель
            </Button>
          </div>

          {/* Manual status override */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor={`status-override-${model.id}`}>Сменить статус вручную</Label>
              <select
                id={`status-override-${model.id}`}
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value)}
                className="h-10 rounded-xl bg-neutral-900 border border-white/10 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-neon"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              onClick={() => overrideMutation.mutate()}
              disabled={overrideMutation.isPending || overrideStatus === model.status}
              className="rounded-xl border-white/10"
            >
              {overrideMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Обновить статус"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminBrandVoicePage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const statsQuery = useQuery({
    queryKey: ["admin-brand-voice-stats"],
    queryFn: async () => {
      const result = await adminGetBrandVoiceStatsAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const modelsQuery = useQuery({
    queryKey: ["admin-brand-voice-models"],
    queryFn: async () => {
      const result = await adminGetAllBrandVoiceModelsAction();
      if (!result.success) throw new Error(result.error);
      return result.data ?? [];
    },
    refetchInterval: (query) => {
      const models = query.state.data ?? [];
      const hasActive = models.some((m) =>
        ["TRAINING", "CONSENT_PENDING", "SAMPLES_PENDING"].includes(m.status)
      );
      return hasActive ? 10_000 : false;
    },
  });

  const filtered =
    statusFilter === "ALL"
      ? (modelsQuery.data ?? [])
      : (modelsQuery.data ?? []).filter((m) => m.status === statusFilter);

  const pendingCount =
    (statsQuery.data?.byStatus?.["CONSENT_PENDING"] ?? 0) +
    (statsQuery.data?.byStatus?.["SAMPLES_PENDING"] ?? 0) +
    (statsQuery.data?.byStatus?.["TRAINING"] ?? 0);

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-neutral-500">
          <Mic className="w-4 h-4 text-neon" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Голосовые модели
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">
          Brand <span className="text-neon">Voice</span>
        </h1>
        <p className="text-neutral-500 max-w-xl font-medium">
          Управление голосовыми моделями клиентов. Скачивайте образцы, обучайте модели в Yandex
          SpeechKit, затем вставляйте model URI здесь для активации.
        </p>
      </div>

      {/* Workflow note */}
      <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5 space-y-2">
        <p className="text-sm font-semibold text-sky-300">Как работает процесс (Yandex Brand Voice Lite)</p>
        <ol className="text-xs text-sky-100/80 leading-6 list-decimal list-inside space-y-1">
          <li>Клиент загружает аудио-образцы (10+ минут) в личном кабинете и оплачивает тариф.</li>
          <li>
            Вы скачиваете образцы из карточки ниже → загружаете в{" "}
            <a
              href="https://cloud.yandex.ru/services/speechkit"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              консоль Yandex SpeechKit
            </a>{" "}
            → создаёте модель Brand Voice Lite → ожидаете статус «Active» (1–2 рабочих дня).
          </li>
          <li>Копируете model URI вида <span className="font-mono">tts://folder/bvss-v1/…</span> из консоли Yandex.</li>
          <li>Вставляете URI в карточку клиента ниже → нажимаете «Активировать модель».</li>
          <li>Клиент видит статус «Готов» в своём кабинете и может генерировать озвучивания.</li>
        </ol>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Всего моделей",
            value: statsQuery.data?.total ?? 0,
            color: "text-white",
          },
          {
            label: "Активны (READY)",
            value: statsQuery.data?.byStatus?.["READY"] ?? 0,
            color: "text-neon",
          },
          {
            label: "Ожидают действий",
            value: pendingCount,
            color: "text-amber-300",
          },
          {
            label: "Синтезов выполнено",
            value: statsQuery.data?.totalSynthesisEvents ?? 0,
            color: "text-purple-300",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-dark border border-white/5 rounded-2xl p-5 space-y-1"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
              {stat.label}
            </p>
            <p className={`text-3xl font-black ${stat.color}`}>
              {statsQuery.isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                stat.value
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Filter + refresh */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {["ALL", ...ALL_STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${
                statusFilter === s
                  ? "bg-neon text-black"
                  : "border border-white/10 text-neutral-400 hover:text-white"
              }`}
            >
              {s === "ALL" ? "Все" : (STATUS_LABELS[s] ?? s)}
              {s !== "ALL" && statsQuery.data?.byStatus?.[s]
                ? ` (${statsQuery.data.byStatus[s]})`
                : ""}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={() => {
            modelsQuery.refetch();
            statsQuery.refetch();
          }}
          disabled={modelsQuery.isFetching}
          className="rounded-2xl border-white/10 gap-2"
        >
          <RefreshCcw className={`w-4 h-4 ${modelsQuery.isFetching ? "animate-spin" : ""}`} />
          Обновить
        </Button>
      </div>

      {/* Models list */}
      {modelsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-neutral-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Загрузка моделей…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-neutral-500">
          <Mic className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">
            {statusFilter === "ALL"
              ? "Ни одной голосовой модели пока нет"
              : `Нет моделей со статусом «${STATUS_LABELS[statusFilter] ?? statusFilter}»`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((model) => (
            <ModelRow key={model.id} model={model} />
          ))}
        </div>
      )}
    </div>
  );
}
