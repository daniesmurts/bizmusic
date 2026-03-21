"use client";

import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  Check, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  Receipt,
  RotateCcw,
  Sparkles,
  Music,
  TrendingUp,
  Crown
} from "lucide-react";
import { startFreeTrial } from "@/lib/actions/payments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [businessData, setBusinessData] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function fetchBusiness() {
      try {
        const response = await fetch('/api/user/business');
        if (response.ok) {
          const data = await response.json();
          setBusinessData(data);
        }
      } catch (error) {
        console.error("Failed to fetch business:", error);
      } finally {
        setPageLoading(false);
      }
    }

    if (user) {
      fetchBusiness();
    }
  }, [user]);

  const handleStartTrial = async (planSlug: string) => {
    if (!user?.id || !businessData?.id) {
        toast.error("Сначала завершите регистрацию бизнеса");
        return;
    }
    
    setLoading(planSlug);
    try {
      const result = await startFreeTrial(businessData.id, planSlug);
      if (result.paymentUrl) {
        router.push(result.paymentUrl);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to start trial";
      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  const PLANS_UI = [
    {
      name: "Бизнес",
      slug: "business",
      price: "990 ₽",
      description: "Все для вашего пространства",
      icon: Music,
      color: "blue"
    },
    {
      name: "Контент",
      slug: "content",
      price: "1 490 ₽",
      description: "Для видео и соцсетей",
      icon: TrendingUp,
      color: "neon",
      popular: true
    },
    {
      name: "Бизнес +",
      slug: "business-plus",
      price: "4 990 ₽",
      description: "Сети и агентства",
      icon: Crown,
      color: "purple"
    }
  ];

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <div className="flex items-end justify-between px-2">
        <div className="space-y-1">
          <h2 className="text-4xl font-black uppercase tracking-tighter">Ваша <span className="text-neon">Подписка</span></h2>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Управление тарифами и 14-дневный пробный период</p>
        </div>
        <Button variant="ghost" className="text-neutral-400 hover:text-white font-black uppercase text-xs tracking-widest gap-2">
          <Receipt className="w-4 h-4" /> История платежей
        </Button>
      </div>

      {/* Trial Banner / Current Status */}
      <div className="glass-dark border border-white/10 rounded-[3rem] p-12 relative overflow-hidden backdrop-blur-2xl">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-neon">Статус аккаунта</span>
              <h3 className="text-6xl font-black uppercase tracking-tighter text-white">БЕСПЛАТНО</h3>
            </div>
            <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs max-w-sm">
              Ваш аккаунт находится в бесплатном режиме. Выберите тариф, чтобы активировать 14-дневный пробный период (требуется привязка карты).
            </p>
          </div>

          <div className="flex flex-col items-end gap-4">
             <div className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-300">
                <Sparkles className="w-4 h-4 text-neon" />
                Все функции доступны 14 дней бесплатно
             </div>
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS_UI.map((tier) => (
          <div key={tier.slug} className={cn(
            "glass-dark border p-8 rounded-[2.5rem] flex flex-col transition-all duration-500 h-full",
            tier.popular ? "border-neon/30 bg-neon/5 shadow-[0_0_40px_rgba(92,243,135,0.1)]" : "border-white/5 hover:border-white/10"
          )}>
            <div className="mb-8 space-y-4 text-center">
              <div className={cn(
                "w-12 h-12 mx-auto rounded-xl flex items-center justify-center border",
                tier.popular ? "bg-neon/20 border-neon/30" : "bg-white/5 border-white/10"
              )}>
                <tier.icon className={cn("w-6 h-6", tier.popular ? "text-neon" : "text-neutral-400")} />
              </div>
              <div>
                <h4 className="text-2xl font-black uppercase tracking-tight">{tier.name}</h4>
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">{tier.description}</p>
              </div>
              <div className="pt-2">
                 <div className="text-4xl font-black">{tier.price} <span className="text-xs text-neutral-500 font-bold lowercase">/ мес</span></div>
                 <p className="text-neon text-[10px] font-black uppercase tracking-widest mt-1">14 дней бесплатно</p>
              </div>
            </div>

            <Button 
                onClick={() => handleStartTrial(tier.slug)}
                disabled={loading !== null}
                className={cn(
                  "mt-auto h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-transform hover:scale-[1.02]",
                  tier.popular ? "bg-neon text-black" : "bg-white/10 text-white hover:bg-white/20"
                )}
            >
              {loading === tier.slug ? "Обработка..." : "Активировать Trial"}
            </Button>
          </div>
        ))}
      </div>

      {/* Grid Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-dark border border-white/10 p-10 rounded-[2.5rem] space-y-6">
           <div className="w-14 h-14 bg-neon/10 rounded-2xl flex items-center justify-center border border-neon/20">
              <CreditCard className="text-neon w-7 h-7" />
           </div>
           <div className="space-y-4">
              <h4 className="text-3xl font-black uppercase tracking-tight leading-none">Безопасная <br />верификация</h4>
              <p className="text-neutral-400 font-medium leading-relaxed italic">Мы спишем и сразу вернем 1 ₽ для проверки карты. Плата за подписку начнется только через 14 дней.</p>
           </div>
        </div>
        <div className="glass-dark border border-white/10 p-10 rounded-[2.5rem] space-y-6">
           <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
              <RotateCcw className="text-blue-500 w-7 h-7" />
           </div>
           <div className="space-y-4">
              <h4 className="text-3xl font-black uppercase tracking-tight leading-none">Гибкая <br />отмена</h4>
              <p className="text-neutral-400 font-medium leading-relaxed">Вы можете отменить подписку в любой момент пробного периода без каких-либо списаний.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
