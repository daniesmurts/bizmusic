"use client";

import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Check, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  Receipt
} from "lucide-react";

export default function SubscriptionPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-end justify-between px-2">
        <div className="space-y-1">
          <h2 className="text-4xl font-black uppercase tracking-tighter">Ваша <span className="text-neon">Подписка</span></h2>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Платежи и управление тарифами (54-ФЗ)</p>
        </div>
        <Button variant="ghost" className="text-neutral-400 hover:text-white font-black uppercase text-xs tracking-widest gap-2">
          <Receipt className="w-4 h-4" /> История чеков
        </Button>
      </div>

      {/* Current Plan Card */}
      <div className="glass-dark border border-white/10 rounded-[3rem] p-12 relative overflow-hidden backdrop-blur-2xl">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-neon">Активный план</span>
              <h3 className="text-6xl font-black uppercase tracking-tighter text-white">PRO RETAIL</h3>
            </div>
            <div className="flex flex-wrap gap-4">
               {[
                 "1 Локация",
                 "Без РАО/ВОИС",
                 "Лицензия 24/7",
                 "Full HD Audio"
               ].map((feat, i) => (
                 <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-neutral-300">
                    <Check className="w-3 h-3 text-neon" />
                    {feat}
                 </div>
               ))}
            </div>
          </div>

          <div className="text-center md:text-right space-y-4">
             <div className="space-y-1">
               <div className="text-5xl font-black text-white">1 500 ₽ <span className="text-xl text-neutral-500 font-bold">/ мес</span></div>
               <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Следующее списание: 20 апреля 2026</p>
             </div>
             <Button className="w-full md:w-auto bg-neon text-black hover:scale-105 transition-transform rounded-2xl px-12 py-8 font-black uppercase text-xs tracking-widest shadow-lg shadow-neon/20">
               Изменить план
             </Button>
          </div>
        </div>
      </div>

      {/* Grid Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-dark border border-white/10 p-10 rounded-[2.5rem] space-y-6">
           <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <Zap className="text-blue-500 w-7 h-7" />
           </div>
           <div className="space-y-4">
              <h4 className="text-3xl font-black uppercase tracking-tight leading-none">Автоплатеж <br />через YooKassa</h4>
              <p className="text-neutral-400 font-medium leading-relaxed">Карта привязана. Все чеки по 54-ФЗ отправляются на ваш email автоматически.</p>
              <Button variant="link" className="text-blue-500 p-0 font-black uppercase text-xs tracking-widest gap-2">
                Управление картой <ArrowRight className="w-4 h-4" />
              </Button>
           </div>
        </div>
        <div className="glass-dark border border-white/10 p-10 rounded-[2.5rem] space-y-6">
           <div className="w-14 h-14 bg-neon/10 rounded-2xl flex items-center justify-center border border-neon/20">
              <ShieldCheck className="text-neon w-7 h-7" />
           </div>
           <div className="space-y-4">
              <h4 className="text-3xl font-black uppercase tracking-tight leading-none">Юридическая <br />чистота</h4>
              <p className="text-neutral-400 font-medium leading-relaxed">Ваша подписка включает договор прямого лицензирования (Direct Licensing).</p>
              <Button variant="link" className="text-neon p-0 font-black uppercase text-xs tracking-widest gap-2">
                Смотреть договор <ArrowRight className="w-4 h-4" />
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
