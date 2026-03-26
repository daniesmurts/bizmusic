"use client";

import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight } from "lucide-react";

interface SubscriptionPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubscriptionPromptModal({ isOpen, onClose }: SubscriptionPromptModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
    >
      <div className="w-full max-w-md glass-dark border border-white/10 rounded-[2rem] p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-neon" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-white">
              Лимит достигнут
            </h2>
          </div>
          <p className="text-sm text-neutral-400 font-medium leading-relaxed">
            Вы использовали свой один бесплатный просмотр для этого трека. Подпишитесь, чтобы получить неограниченный доступ ко всей музыкальной библиотеке.
          </p>
        </div>

        {/* Features List */}
        <div className="space-y-3 py-2">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-neon/20 border border-neon/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-neon" />
            </div>
            <span className="text-sm text-neutral-300">Неограниченное количество прослушиваний</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-neon/20 border border-neon/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-neon" />
            </div>
            <span className="text-sm text-neutral-300">Полный контроль над музыкой в вашем заведении</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-neon/20 border border-neon/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-neon" />
            </div>
            <span className="text-sm text-neutral-300">100% легальное лицензирование музыки</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Link href="/login?mode=signup" className="w-full block">
            <Button
              className="w-full h-12 bg-neon text-black font-black uppercase tracking-wider hover:bg-neon/90 rounded-xl flex items-center justify-center gap-2"
            >
              Создать аккаунт
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <Link href="/login" className="w-full block">
            <Button
              variant="outline"
              className="w-full h-12 border border-white/10 text-white font-black uppercase tracking-wider rounded-xl hover:bg-white/5"
            >
              Уже есть аккаунт? Войти
            </Button>
          </Link>

          <button
            onClick={onClose}
            className="w-full h-10 text-xs text-neutral-500 font-medium uppercase tracking-widest hover:text-neutral-400 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
