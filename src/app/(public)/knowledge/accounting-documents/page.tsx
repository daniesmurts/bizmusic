"use client";

import Link from "next/link";
import { ArrowLeft, FileText, ReceiptText } from "lucide-react";

export default function AccountingDocumentsPage() {
  return (
    <div className="space-y-8 pb-20 animate-fade-in relative">
      <div className="fixed bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="px-2 sm:px-4 max-w-4xl mx-auto">
        <Link href="/knowledge" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-8 text-[10px] font-black uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Вернуться в базу знаний
        </Link>

        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-white mb-3">
          Бухгалтерские <span className="text-neon">документы</span>
        </h1>
        <p className="text-neutral-400 mb-8">Какие закрывающие и платёжные документы доступны в системе.</p>

        <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-neon" />
            <h2 className="text-lg font-black uppercase tracking-tight text-white">Список документов</h2>
          </div>
          <ul className="space-y-2 text-sm text-neutral-300 list-disc pl-5">
            <li>Счета и чеки по оплатам подписки и токенов.</li>
            <li>Закрывающие документы по отчётным периодам.</li>
            <li>Лицензионные подтверждения по использованию контента.</li>
          </ul>
        </section>

        <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 mt-6">
          <div className="flex items-start gap-3 text-sm text-neutral-300">
            <ReceiptText className="w-5 h-5 text-neon mt-0.5 shrink-0" />
            <p>Для платежей используется фискализация. Если нужен комплект документов за период, его можно выгрузить в разделе финансов.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
