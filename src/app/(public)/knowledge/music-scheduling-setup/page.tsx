"use client";

import Link from "next/link";
import { ArrowLeft, CalendarClock, Clock3 } from "lucide-react";

export default function MusicSchedulingSetupPage() {
  return (
    <div className="space-y-8 pb-20 animate-fade-in relative">
      <div className="fixed bottom-[-10%] right-[-10%] w-[650px] h-[650px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="px-2 sm:px-4 max-w-4xl mx-auto">
        <Link href="/knowledge" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-8 text-[10px] font-black uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Вернуться в базу знаний
        </Link>

        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-white mb-3">
          Настройка <span className="text-neon">музыкального расписания</span>
        </h1>
        <p className="text-neutral-400 mb-8">Как настроить регулярную ротацию музыки и анонсов по времени и дням недели.</p>

        <div className="space-y-6">
          <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <CalendarClock className="w-5 h-5 text-neon" />
              <h2 className="text-lg font-black uppercase tracking-tight text-white">Базовая схема</h2>
            </div>
            <ul className="space-y-2 text-sm text-neutral-300 list-disc pl-5">
              <li>Создайте или выберите рабочий плейлист.</li>
              <li>Задайте период активности и тайм-слоты по дням недели.</li>
              <li>Для анонсов включите авто-расписание и частоту вставки.</li>
            </ul>
          </section>

          <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <Clock3 className="w-5 h-5 text-neon" />
              <h2 className="text-lg font-black uppercase tracking-tight text-white">Рекомендации</h2>
            </div>
            <ul className="space-y-2 text-sm text-neutral-300 list-disc pl-5">
              <li>Храните время в UTC, отображайте для пользователя в Europe/Moscow.</li>
              <li>Проверяйте пересечения интервалов, чтобы не было пауз в эфире.</li>
              <li>После изменений тестируйте расписание через dry-run сценарий.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
