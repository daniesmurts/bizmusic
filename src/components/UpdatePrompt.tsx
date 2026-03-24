"use client";

import { useServiceWorker } from "@/hooks/useServiceWorker";
import { Info, X } from "lucide-react";

export function UpdatePrompt() {
  const { showUpdate, applyUpdate, dismissUpdate } = useServiceWorker();

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[90vw] max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="relative rounded-2xl border border-white/10 bg-neutral-900/95 backdrop-blur-xl p-5 shadow-2xl">
        <button
          onClick={dismissUpdate}
          className="absolute top-3 right-3 text-neutral-500 hover:text-white transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Info className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">
              Доступна новая версия
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Обновите страницу, чтобы увидеть последние изменения.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            onClick={dismissUpdate}
            className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white border border-white/10 rounded-lg transition-colors"
          >
            Не сейчас
          </button>
          <button
            onClick={applyUpdate}
            className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors"
          >
            Обновить
          </button>
        </div>
      </div>
    </div>
  );
}
