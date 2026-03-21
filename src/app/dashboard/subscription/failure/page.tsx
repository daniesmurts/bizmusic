"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function FailureContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 px-6">
      <div className="relative">
        <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
        <AlertCircle className="w-24 h-24 text-red-500 relative z-10" />
      </div>

      <div className="space-y-4 max-w-xl">
        <h2 className="text-5xl font-black uppercase tracking-tighter">Ошибка <span className="text-red-500">оплаты</span></h2>
        <p className="text-neutral-400 font-bold uppercase tracking-widest text-[10px]">Не удалось привязать карту или произошел технический сбой</p>
      </div>

      <p className="text-neutral-500 max-w-md">
        Пожалуйста, убедитесь, что на карте достаточно средств для проверочного списания (1 ₽) и разрешены платежи в интернете.
      </p>

      <div className="flex flex-wrap gap-4">
        <Link href="/dashboard/subscription">
          <Button className="bg-white text-black hover:scale-105 transition-transform rounded-2xl px-10 h-14 font-black uppercase tracking-widest">
            Попробовать снова <RotateCcw className="ml-2 w-4 h-4" />
          </Button>
        </Link>
        <Link href="/contact">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 rounded-2xl px-10 h-14 font-black uppercase tracking-widest gap-2">
            Поддержка <MessageSquare className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function FailurePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh] text-white font-black uppercase tracking-widest">Загрузка...</div>}>
      <FailureContent />
    </Suspense>
  );
}
