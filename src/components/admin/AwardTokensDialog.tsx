"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Gift } from "lucide-react";
import {
  awardFreeTokensAction,
  getBusinessesForSelectAction,
} from "@/lib/actions/admin-tokens";

export function AwardTokensDialog() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [businessId, setBusinessId] = useState("");
  const [credits, setCredits] = useState(100);
  const [expiryDays, setExpiryDays] = useState(365);
  const overlayRef = useRef<HTMLDivElement>(null);

  const { data: businessesResult, isLoading: isFetchingBusinesses } = useQuery({
    queryKey: ["admin-businesses-select"],
    queryFn: () => getBusinessesForSelectAction(),
    enabled: isOpen,
    staleTime: 60_000,
  });

  // Set default business once list loads
  useEffect(() => {
    if (businessesResult?.data?.length && !businessId) {
      setBusinessId(businessesResult.data[0].id);
    }
  }, [businessesResult, businessId]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId) return;
    setIsSubmitting(true);
    try {
      const result = await awardFreeTokensAction({ businessId, credits, expiryDays });
      if (!result.success) {
        toast.error(result.error ?? "Ошибка при выдаче токенов");
      } else {
        toast.success(`Выдано ${credits} ИИ-токенов. Действуют ${expiryDays} дней.`);
        setIsOpen(false);
        router.refresh();
      }
    } catch {
      toast.error("Произошла ошибка. Попробуйте снова.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) setIsOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 h-14 px-8 rounded-2xl border border-neon/40 text-neon text-xs font-black uppercase tracking-widest hover:bg-neon/10 hover:border-neon transition-colors"
      >
        <Gift className="w-4 h-4" />
        Выдать ИИ-токены
      </button>

      {isOpen && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        >
          <div className="w-full max-w-md glass-dark border border-white/10 rounded-[2rem] p-8 space-y-6 shadow-2xl">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-neon" />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white">
                  Выдать ИИ-токены
                </h2>
              </div>
              <p className="text-xs text-neutral-500 font-medium">
                ИИ-токены (TTS + Ассистент) будут добавлены на баланс бизнеса немедленно.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="award-business"
                  className="text-[10px] font-black uppercase tracking-widest text-neutral-500"
                >
                  Бизнес
                </label>
                {isFetchingBusinesses ? (
                  <div className="h-12 rounded-xl border border-white/10 bg-white/5 animate-pulse" />
                ) : (
                  <select
                    id="award-business"
                    value={businessId}
                    onChange={(e) => setBusinessId(e.target.value)}
                    required
                    className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-neon/50 appearance-none"
                  >
                    {businessesResult?.data?.length === 0 && (
                      <option value="">Нет бизнесов</option>
                    )}
                    {businessesResult?.data?.map((b) => (
                      <option key={b.id} value={b.id} className="bg-neutral-900">
                        {b.legalName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="award-credits"
                    className="text-[10px] font-black uppercase tracking-widest text-neutral-500"
                  >
                    Кол-во токенов
                  </label>
                  <input
                    id="award-credits"
                    type="number"
                    value={credits}
                    onChange={(e) => setCredits(Math.max(1, Math.min(10000, parseInt(e.target.value) || 1)))}
                    min={1}
                    max={10000}
                    required
                    className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-neon/50"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="award-expiry"
                    className="text-[10px] font-black uppercase tracking-widest text-neutral-500"
                  >
                    Дней действия
                  </label>
                  <input
                    id="award-expiry"
                    type="number"
                    value={expiryDays}
                    onChange={(e) => setExpiryDays(Math.max(1, Math.min(1095, parseInt(e.target.value) || 1)))}
                    min={1}
                    max={1095}
                    required
                    className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-neon/50"
                  />
                </div>
              </div>

              <p className="text-xs text-neutral-600 font-medium">
                Истекают:{" "}
                <span className="text-neutral-400">
                  {new Intl.DateTimeFormat("ru-RU").format(
                    new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
                  )}
                </span>
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 h-12 rounded-xl border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/5 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !businessId}
                  className="flex-1 h-12 rounded-xl bg-neon text-black text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_20px_rgba(92,243,135,0.3)]"
                >
                  {isSubmitting ? "Выдаём..." : "Выдать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}