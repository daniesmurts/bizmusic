"use client";

import Link from "next/link";
import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";

export default function SubscriptionManagementPage() {
  return (
    <div className="space-y-8 pb-20 animate-fade-in relative">
      <div className="fixed top-[-10%] right-[-10%] w-[700px] h-[700px] bg-neon/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="px-2 sm:px-4 max-w-4xl mx-auto">
        <Link href="/knowledge" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-8 text-[10px] font-black uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Вернуться в базу знаний
        </Link>

        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-white mb-3">
          Управление <span className="text-neon">подпиской</span>
        </h1>
        <p className="text-neutral-400 mb-8">Как проверять статус, лимиты и изменения тарифного плана.</p>

        <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-neon" />
            <h2 className="text-lg font-black uppercase tracking-tight text-white">Что доступно в кабинете</h2>
          </div>
          <ul className="space-y-2 text-sm text-neutral-300 list-disc pl-5">
            <li>Текущий план и дата следующего списания.</li>
            <li>Лимиты на TTS и AI Assist в текущем месяце.</li>
            <li>Переход на другой тариф и история платежей.</li>
          </ul>
        </section>

        <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 mt-6">
          <div className="flex items-start gap-3 text-sm text-neutral-300">
            <ShieldCheck className="w-5 h-5 text-neon mt-0.5 shrink-0" />
            <p>При смене тарифа ранее купленные токены сохраняются, а месячные бесплатные квоты пересчитываются по новому плану.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
