"use client";

import { Button } from "@/components/ui/button";
import { acceptVoiceActorConsentByTokenAction } from "@/lib/actions/consent";
import {
  createPublicVoiceSampleUploadUrlAction,
  addPublicVoiceSampleMetadataAction,
} from "@/lib/actions/consent-upload";
import { CheckCircle2, FileAudio, Loader2, Upload, XCircle } from "lucide-react";
import { useRef, useState, useTransition } from "react";

interface ConsentFormProps {
  token: string;
  actorName: string;
  companyName: string;
}

// ---------------------------------------------------------------------------
// Sample upload section — shown after consent is accepted
// ---------------------------------------------------------------------------

interface UploadedSample {
  name: string;
  size: number;
}

function SampleUploadSection({
  actorId,
  actorName,
  uploadSessionToken,
}: {
  actorId: string;
  actorName: string;
  uploadSessionToken: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<UploadedSample[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        const urlResult = await createPublicVoiceSampleUploadUrlAction({
          actorId,
          uploadSessionToken,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        });

        if (!urlResult.success || !urlResult.data) {
          setUploadError(urlResult.error ?? "Ошибка получения URL загрузки");
          break;
        }

        const { uploadUrl, objectPath, modelId } = urlResult.data;

        const uploadResp = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadResp.ok) {
          setUploadError("Ошибка загрузки файла. Попробуйте снова.");
          break;
        }

        const metaResult = await addPublicVoiceSampleMetadataAction({
          actorId,
          uploadSessionToken,
          modelId,
          objectPath,
          fileName: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type,
        });

        if (!metaResult.success) {
          setUploadError(metaResult.error ?? "Ошибка сохранения записи");
          break;
        }

        setUploaded((prev) => [...prev, { name: file.name, size: file.size }]);
      } catch {
        setUploadError("Неожиданная ошибка при загрузке. Попробуйте снова.");
        break;
      }
    }

    setUploading(false);
  }

  // actorName used for aria-label accessibility
  void actorName;

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-sm text-emerald-900 space-y-2">
        <p className="font-bold text-base">Шаг 2: Загрузите аудиозаписи</p>
        <p className="text-emerald-800">
          Для обучения голосовой модели необходимо не менее <strong>10 минут</strong> чистых
          аудиозаписей вашего голоса в формате MP3, WAV или FLAC.
        </p>
        <ul className="list-disc list-inside space-y-1 text-emerald-700 text-xs">
          <li>Тихое помещение, без фонового шума</li>
          <li>Разборчивая речь в естественном темпе</li>
          <li>Можно загружать несколько файлов</li>
        </ul>
      </div>

      {uploaded.length > 0 && (
        <div className="space-y-1">
          {uploaded.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-100 text-sm text-emerald-800"
            >
              <FileAudio className="w-4 h-4 shrink-0" />
              <span className="truncate flex-1">{s.name}</span>
              <span className="text-emerald-600 text-xs shrink-0">
                {(s.size / 1024 / 1024).toFixed(1)} MB
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
          ))}
        </div>
      )}

      {uploadError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {uploadError}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/wav,audio/wave,audio/x-wav,audio/ogg,audio/flac"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <Button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-base"
      >
        {uploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Загрузка...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5 mr-2" /> Загрузить аудиозаписи
          </>
        )}
      </Button>

      {uploaded.length > 0 && (
        <p className="text-xs text-slate-500 text-center">
          Загружено файлов: {uploaded.length}. Продолжайте добавлять записи или закройте эту
          страницу — записи уже сохранены.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main consent form
// ---------------------------------------------------------------------------

export default function ConsentForm({ token, actorName, companyName }: ConsentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<
    { accepted: boolean; actorId?: string; uploadSessionToken?: string } | { error: string } | null
  >(null);

  function handleDecision(accepted: boolean) {
    startTransition(async () => {
      const res = await acceptVoiceActorConsentByTokenAction(token, accepted);
      if (res.success) {
        setResult({
          accepted,
          actorId: accepted ? res.actorId : undefined,
          uploadSessionToken: accepted ? res.uploadSessionToken : undefined,
        });
      } else {
        setResult({ error: res.error ?? "Произошла ошибка. Попробуйте снова." });
      }
    });
  }

  if (result && "accepted" in result) {
    return (
      <div className="space-y-6 py-4">
        <div className="text-center space-y-3">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
              result.accepted ? "bg-emerald-50" : "bg-red-50"
            }`}
          >
            {result.accepted ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            ) : (
              <XCircle className="w-10 h-10 text-red-500" />
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {result.accepted ? "Согласие подтверждено" : "Согласие отклонено"}
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            {result.accepted
              ? `Спасибо, ${actorName}! Следующий шаг — загрузите аудиозаписи вашего голоса.`
              : "Ваш отказ зафиксирован. Голосовая модель не будет создана."}
          </p>
        </div>

        {result.accepted && result.actorId && result.uploadSessionToken && (
          <SampleUploadSection
            actorId={result.actorId}
            actorName={actorName}
            uploadSessionToken={result.uploadSessionToken}
          />
        )}

        {result.accepted && (
          <p className="text-xs text-slate-400 text-center">
            Вы можете отозвать согласие в любой момент, написав на{" "}
            <a href="mailto:support@bizmuzik.ru" className="underline">
              support@bizmuzik.ru
            </a>
            .
          </p>
        )}
      </div>
    );
  }

  if (result && "error" in result) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-slate-700 font-medium">{result.error}</p>
        <Button variant="outline" onClick={() => setResult(null)} className="rounded-xl">
          Попробовать снова
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-900 leading-relaxed space-y-2">
        <p className="font-bold text-base">Что вы разрешаете:</p>
        <ul className="list-disc list-inside space-y-1 text-amber-800">
          <li>Запись и обработку вашего голоса для создания голосовой модели.</li>
          <li>
            Использование модели для генерации аудиообъявлений в точках продаж компании{" "}
            <strong>«{companyName}»</strong>.
          </li>
          <li>Хранение аудиозаписей на защищённых серверах на территории РФ.</li>
        </ul>
        <p className="font-bold text-base mt-3">Что вы НЕ разрешаете:</p>
        <ul className="list-disc list-inside space-y-1 text-amber-800">
          <li>Передачу вашего голоса третьим лицам.</li>
          <li>Использование голосовой модели вне рамок данной компании.</li>
        </ul>
        <p className="text-xs mt-3 text-amber-700">
          Вы можете отозвать согласие в любой момент, написав на&nbsp;
          <a href="mailto:support@bizmuzik.ru" className="underline">
            support@bizmuzik.ru
          </a>
          .
        </p>
      </div>

      <p className="text-slate-600 text-sm leading-relaxed">
        Нажимая «Подтверждаю согласие», <strong>{actorName}</strong>, вы подтверждаете, что
        ознакомились с условиями и даёте свободное, информированное согласие на обработку
        биометрических персональных данных в соответствии со ст. 11 Федерального закона № 152-ФЗ
        «О персональных данных».
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => handleDecision(true)}
          disabled={isPending}
          className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-base"
        >
          {isPending ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <CheckCircle2 className="w-5 h-5 mr-2" />
          )}
          Подтверждаю согласие
        </Button>
        <Button
          variant="outline"
          onClick={() => handleDecision(false)}
          disabled={isPending}
          className="flex-1 h-12 border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-base font-medium"
        >
          <XCircle className="w-5 h-5 mr-2" />
          Отказать
        </Button>
      </div>
    </div>
  );
}
