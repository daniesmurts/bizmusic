"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { getPaymentStatus } from "@/lib/actions/payments";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [verified, setVerified] = useState<boolean | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setVerified(false);
      return;
    }
    getPaymentStatus(orderId).then((result) => {
      if (!result) { setVerified(false); return; }
      setVerified(result.status === "CONFIRMED" || result.status === "AUTHORIZED");
      setTrialEndsAt(result.trialEndsAt);
    }).catch(() => setVerified(false));
  }, [orderId]);

  if (verified === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-neon animate-spin" />
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 px-6">
        <h2 className="text-4xl font-black uppercase tracking-tighter">Платеж <span className="text-neutral-500">не подтвержден</span></h2>
        <p className="text-neutral-400 max-w-md">Мы пока не получили подтверждение оплаты. Подождите пару минут или вернитесь к подписке.</p>
        <Link href="/dashboard/subscription">
          <Button className="bg-white text-black rounded-2xl px-10 h-14 font-black uppercase tracking-widest">
            Назад к подписке
          </Button>
        </Link>
      </div>
    );
  }

  const trialEndDate = trialEndsAt ? new Date(trialEndsAt) : (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d; })();
  const formattedDate = trialEndDate.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 px-6">
      <div className="relative">
        <div className="absolute inset-0 bg-neon/20 blur-3xl rounded-full scale-150 animate-pulse" />
        <CheckCircle2 className="w-24 h-24 text-neon relative z-10" />
      </div>

      <div className="space-y-4 max-w-xl">
        <h2 className="text-5xl font-black uppercase tracking-tighter">Пробный период <span className="text-neon">активирован!</span></h2>
        <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs">Ваша карта успешно привязана (1 ₽ возвращен)</p>
      </div>

      <div className="glass-dark border border-white/10 p-8 rounded-[3rem] w-full max-w-md space-y-6">
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 bg-neon/10 rounded-xl flex items-center justify-center border border-neon/20">
            <Calendar className="text-neon w-6 h-6" />
          </div>
          <div>
            <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Первое списание</p>
            <p className="text-white font-black">{formattedDate}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
            <ShieldCheck className="text-blue-500 w-6 h-6" />
          </div>
          <div>
            <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Статус лицензии</p>
            <p className="text-white font-black">АКТИВНА (Юридическая защита)</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Link href="/dashboard">
          <Button className="bg-neon text-black hover:scale-105 transition-transform rounded-2xl px-10 h-14 font-black uppercase tracking-widest shadow-[0_0_30px_rgba(92,243,135,0.4)]">
            В панель управления
          </Button>
        </Link>
        <Link href="/dashboard/player">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 rounded-2xl px-10 h-14 font-black uppercase tracking-widest gap-2">
            Запустить плеер <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh] text-white font-black uppercase tracking-widest">Загрузка...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
