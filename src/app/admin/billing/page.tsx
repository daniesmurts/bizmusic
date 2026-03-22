"use client";

import { CreditCard, History, Wallet, ArrowUpRight } from "lucide-react";

export default function AdminBillingPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-neutral-500">
            <CreditCard className="w-4 h-4 text-neon" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Финансы • Управление подписками
            </span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none">
            Биллинг и <br />
            <span className="text-neon underline decoration-neon/20 underline-offset-8">
              Оплата
            </span>
          </h1>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-neon/10 border border-neon/20 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-neon" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">
              Текущий тариф
            </p>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white italic">
              Бизнес Плюс
            </h3>
          </div>
          <p className="text-sm text-neutral-400 font-medium">
            Активен до 12.04.2026. Автопродление включено.
          </p>
        </div>

        <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <History className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">
              Последний платеж
            </p>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white italic">
              1 500 ₽
            </h3>
          </div>
          <p className="text-sm text-neutral-400 font-medium">
            Списано 12.03.2026 через Tbank.
          </p>
        </div>

        <div className="glass-dark border border-white/5 rounded-[2rem] p-8 flex flex-col justify-center items-center text-center group cursor-pointer hover:border-neon/30 transition-all">
           <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
             <ArrowUpRight className="w-6 h-6 text-neutral-400 group-hover:text-neon" />
           </div>
           <p className="text-xs font-black uppercase tracking-widest text-neutral-400 group-hover:text-white">
             Управление подпиской
           </p>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="glass-dark border border-white/5 rounded-[3rem] p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-24 h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mb-8">
          <CreditCard className="w-10 h-10 text-neutral-500" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-4">
          История транзакций скоро появится
        </h2>
        <p className="text-neutral-500 max-w-md font-bold uppercase tracking-widest text-xs leading-relaxed">
          Мы работаем над детальной выпиской по всем вашим платежам и лицензионным отчислениям.
        </p>
      </div>
    </div>
  );
}
