"use client";

import Link from "next/link";
import { ArrowLeft, Globe2, Clock3 } from "lucide-react";

export default function TimezoneAndSchedulePage() {
  return (
    <div className="space-y-8 pb-20 animate-fade-in relative">
      <div className="fixed top-[-10%] left-[-10%] w-[700px] h-[700px] bg-neon/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="px-2 sm:px-4 max-w-4xl mx-auto">
        <Link href="/knowledge" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-8 text-[10px] font-black uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Вернуться в базу знаний
        </Link>

        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-white mb-3">
          Тайм-зона и <span className="text-neon">расписание</span>
        </h1>
        <p className="text-neutral-400 mb-8">Как избежать ошибок времени при настройке эфира и анонсов.</p>

        <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <Globe2 className="w-5 h-5 text-neon" />
            <h2 className="text-lg font-black uppercase tracking-tight text-white">Базовый принцип</h2>
          </div>
          <p className="text-sm text-neutral-300">
            Сохраняйте время в UTC на сервере, а в интерфейсе отображайте для локальной тайм-зоны пользователя (обычно Europe/Moscow).
          </p>
        </section>

        <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 mt-6 space-y-3">
          <div className="flex items-center gap-3">
            <Clock3 className="w-5 h-5 text-neon" />
            <h2 className="text-lg font-black uppercase tracking-tight text-white">Практика</h2>
          </div>
          <ul className="space-y-2 text-sm text-neutral-300 list-disc pl-5">
            <li>Проверяйте расписание на стыке суток и недель.</li>
            <li>Учитывайте локальное рабочее время каждой локации.</li>
            <li>После изменения тайм-зоны делайте тестовый прогон проигрывания.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
