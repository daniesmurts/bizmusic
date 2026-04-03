"use client";

import Link from "next/link";
import { ArrowLeft, PlayCircle, CheckCircle2 } from "lucide-react";

export default function PlayerQuickStartPage() {
  const steps = [
    "Откройте дашборд и выберите нужную локацию (если у бизнеса их несколько).",
    "Перейдите в раздел плеера и выберите плейлист для запуска.",
    "Нажмите кнопку воспроизведения и проверьте уровень громкости на устройстве.",
    "Убедитесь, что интернет стабилен или включён offline-кэш для резервного режима.",
  ];

  return (
    <div className="space-y-8 pb-20 animate-fade-in relative">
      <div className="fixed top-[-10%] left-[-10%] w-[700px] h-[700px] bg-neon/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="px-2 sm:px-4 max-w-4xl mx-auto">
        <Link href="/knowledge" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-8 text-[10px] font-black uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Вернуться в базу знаний
        </Link>

        <div className="space-y-3 mb-8">
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-white">
            Быстрый старт: <span className="text-neon">запуск плеера</span>
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base">
            Краткая инструкция для первого запуска музыкального потока в рабочей локации.
          </p>
        </div>

        <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center">
              <PlayCircle className="w-5 h-5 text-neon" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tight text-white">Порядок запуска</h2>
          </div>
          <ul className="space-y-3">
            {steps.map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-sm text-neutral-300">
                <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-black text-neon shrink-0">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 mt-6">
          <div className="flex items-start gap-3 text-sm text-neutral-300">
            <CheckCircle2 className="w-5 h-5 text-neon mt-0.5 shrink-0" />
            <p>
              Если плеер не стартует, проверьте, что локация активна, у вас есть доступ к плейлисту и в браузере разрешено воспроизведение аудио.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
