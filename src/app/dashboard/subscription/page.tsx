"use client";

import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  ShieldCheck, 
  Receipt,
  RotateCcw,
  Sparkles,
  Music,
  TrendingUp,
  Crown,
  Trash2,
  Lock
} from "lucide-react";
import { startFreeTrial, cancelSubscription, reactivateSubscription, removePaymentMethod } from "@/lib/actions/payments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { isBusinessProfileComplete } from "@/lib/validation/business";

interface BusinessData {
  id: string;
  inn: string | null;
  legalName: string | null;
  address: string | null;
  subscriptionStatus: string;
  currentPlanSlug: string | null;
  trialEndsAt: string | null;
  subscriptionExpiresAt: string | null;
  cancelAtPeriodEnd: boolean;
  cardMask: string | null;
  cardExpiry: string | null;
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [isYearly, setIsYearly] = useState(false);

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

    if (!isBusinessProfileComplete({
      inn: businessData.inn,
      legalName: businessData.legalName,
      address: businessData.address,
    })) {
      toast.error("Перед покупкой заполните ИНН, название компании и адрес");
      router.push('/dashboard/setup');
      return;
    }
    
    setLoading(planSlug);
    try {
      const result = await startFreeTrial(businessData.id, planSlug, isYearly ? "yearly" : "monthly");
      if (result.success && result.paymentUrl) {
        router.push(result.paymentUrl);
      } else if (!result.success) {
        toast.error(result.error || "Не удалось создать платеж");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to start trial";
      toast.error(message);
    } finally {
      setLoading(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!businessData?.id) return;
    
    if (!confirm("Вы уверены, что хотите отменить подписку? Она останется активной до конца оплаченного периода, но не будет продлена автоматически.")) {
      return;
    }

    setLoading("cancelling");
    try {
      const result = await cancelSubscription(businessData.id);
      if (result.success) {
        toast.success("Автопродление отключено");
        setBusinessData(prev => prev ? { ...prev, cancelAtPeriodEnd: true } : null);
      } else {
        toast.error(result.error || "Не удалось отменить подписку");
      }
    } catch {
      toast.error("Произошла ошибка при отмене");
    } finally {
      setLoading(null);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!businessData?.id) return;

    setLoading("reactivating");
    try {
      const result = await reactivateSubscription(businessData.id);
      if (result.success) {
        toast.success("Автопродление возобновлено");
        setBusinessData(prev => prev ? { ...prev, cancelAtPeriodEnd: false } : null);
      } else {
        toast.error(result.error || "Не удалось возобновить подписку");
      }
    } catch {
      toast.error("Произошла ошибка при возобновлении");
    } finally {
      setLoading(null);
    }
  };

  const handleRemovePaymentMethod = async () => {
    if (!businessData?.id) return;

    if (!confirm("Вы уверены, что хотите удалить сохраненную карту? Это не отменит подписку, но следующее автоматическое продление не сможет быть выполнено.")) {
      return;
    }

    setLoading("removing_card");
    try {
      const result = await removePaymentMethod(businessData.id);
      if (result.success) {
        toast.success("Способ оплаты удален");
        setBusinessData(prev => prev ? { ...prev, cardMask: null, cardExpiry: null } : null);
      } else {
        toast.error(result.error || "Не удалось удалить способ оплаты");
      }
    } catch {
      toast.error("Произошла ошибка при удалении");
    } finally {
      setLoading(null);
    }
  };

  const PLANS_UI = [
    {
      name: "Бизнес",
      slug: "business",
      price: isYearly ? "8 400 ₽" : "990 ₽",
      priceValue: isYearly ? 8400 : 990,
      description: "Все для вашего пространства",
      ttsMonthlyLimit: 30,
      icon: Music,
      color: "blue"
    },
    {
      name: "Контент",
      slug: "content",
      price: isYearly ? "12 000 ₽" : "1 490 ₽",
      priceValue: isYearly ? 12000 : 1490,
      description: "Для видео и соцсетей",
      ttsMonthlyLimit: 10,
      icon: TrendingUp,
      color: "neon",
      popular: true
    },
    {
      name: "Бизнес +",
      slug: "business-plus",
      price: isYearly ? "48 000 ₽" : "4 990 ₽",
      priceValue: isYearly ? 48000 : 4990,
      description: "Сети и агентства",
      ttsMonthlyLimit: 100,
      icon: Crown,
      color: "purple"
    }
  ];

  return (
    <div className="space-y-12 pb-20 relative z-0 min-h-screen">
      {/* Background gradients for depth */}
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] bg-neon/15 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed top-[20%] right-[-5%] w-[600px] h-[600px] bg-purple-500/15 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[10%] w-[800px] h-[800px] bg-blue-500/15 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex items-end justify-between px-2">
        <div className="space-y-1">
          <h2 className="text-4xl font-black uppercase tracking-tighter">Ваша <span className="text-neon">Подписка</span></h2>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Управление тарифами и 14-дневный пробный период</p>
        </div>
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard/subscription/history')}
          className="text-neutral-400 hover:text-white font-black uppercase text-xs tracking-widest gap-2"
        >
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
              <h3 className="text-6xl font-black uppercase tracking-tighter text-white">
                {businessData?.subscriptionStatus === 'ACTIVE' ? 'Активирован' : 'БЕСПЛАТНО'}
              </h3>
            </div>
            <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs max-w-sm leading-relaxed">
              {businessData?.subscriptionStatus === 'ACTIVE' 
                ? (businessData.cancelAtPeriodEnd 
                    ? `Ваша подписка активна до ${new Date(businessData.subscriptionExpiresAt!).toLocaleDateString('ru-RU')}, после чего она будет аннулирована.`
                    : 'Ваше пространство под защитой. Вы имеете полный доступ к музыкальным каталогам и юридической гарантии.')
                : 'Ваш аккаунт находится в бесплатном режиме. Выберите тариф, чтобы активировать 14-дневный пробный период (требуется привязка карты).'}
            </p>
          </div>

          <div className="flex flex-col items-end gap-4">
             {businessData?.subscriptionStatus === 'ACTIVE' && !businessData.cancelAtPeriodEnd && (
                <Button 
                  variant="outline" 
                  onClick={handleCancelSubscription}
                  disabled={loading === "cancelling"}
                  className="border-red-500/50 text-red-500 hover:bg-red-500/10 font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl"
                >
                  {loading === "cancelling" ? "Отмена..." : "Отменить подписку"}
                </Button>
             )}
             {businessData?.subscriptionStatus === 'ACTIVE' && businessData?.cancelAtPeriodEnd && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-400">
                    <RotateCcw className="w-4 h-4" />
                    Автопродление отключено
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleReactivateSubscription}
                    disabled={loading === "reactivating"}
                    className="border-neon/50 text-neon hover:bg-neon/10 font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl"
                  >
                    {loading === "reactivating" ? "Восстановление..." : "Возобновить"}
                  </Button>
                </div>
             )}
             <div className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-neutral-300">
                <Sparkles className="w-4 h-4 text-neon" />
                Все функции доступны 14 дней бесплатно
             </div>
          </div>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex justify-center items-center gap-4 py-4 z-20 relative">
        <span className={cn("text-xs font-black uppercase tracking-widest transition-colors", !isYearly ? "text-white" : "text-neutral-500")}>Месяц</span>
        
        <button 
          onClick={() => setIsYearly(!isYearly)}
          className="relative inline-flex h-8 w-16 items-center rounded-full bg-white/10 transition-colors focus:outline-none hover:bg-white/20"
        >
          <span 
            className={cn(
              "inline-block h-6 w-6 transform rounded-full bg-neon transition-transform duration-300 ease-in-out shadow-[0_0_10px_rgba(92,243,135,0.5)]",
              isYearly ? "translate-x-9" : "translate-x-1"
            )}
          />
        </button>
        
        <span className={cn("text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2", isYearly ? "text-white" : "text-neutral-500")}>
          Год <span className="text-[9px] bg-neon/20 text-neon px-2 py-1 rounded-full">-20% скидка</span>
        </span>
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
                 <div className="text-4xl font-black">{tier.price} <span className="text-xs text-neutral-500 font-bold lowercase">/ {isYearly ? "год" : "мес"}</span></div>
                 <p className="text-neon text-[10px] font-black uppercase tracking-widest mt-1">14 дней бесплатно</p>
                  <p className="text-neutral-400 text-[10px] font-bold uppercase tracking-widest mt-2">TTS: {tier.ttsMonthlyLimit} генераций / мес</p>
              </div>
            </div>

            <Button 
                onClick={() => handleStartTrial(tier.slug)}
                disabled={loading !== null || (businessData?.subscriptionStatus === 'ACTIVE' && businessData?.currentPlanSlug === tier.slug)}
                className={cn(
                  "mt-auto h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-transform hover:scale-[1.02]",
                  tier.popular ? "bg-neon text-black" : "bg-white/10 text-white hover:bg-white/20"
                )}
            >
              {businessData?.subscriptionStatus === 'ACTIVE' && businessData?.currentPlanSlug === tier.slug 
                ? "Текущий тариф" 
                : businessData?.subscriptionStatus === 'ACTIVE'
                ? (tier.priceValue > (PLANS_UI.find(p => p.slug === businessData?.currentPlanSlug)?.priceValue || 0) ? "Улучшить тариф" : "Понизить тариф")
                : loading === tier.slug ? "Обработка..." : "Активировать Trial"}
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

      {/* Payment Methods Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
          <ShieldCheck className="w-5 h-5 text-neon" />
          <h3 className="text-xl font-black uppercase tracking-tight">Сохраненные способы оплаты</h3>
        </div>

        <div className="glass-dark border border-white/5 rounded-[2.5rem] p-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-24 bg-blue-500/5 blur-[80px] rounded-full -mr-16 -mt-16 pointer-events-none" />
          
          {businessData?.cardMask ? (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-10 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-lg flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-blue-500/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                  <CreditCard className="w-6 h-6 text-white relative z-10" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-black tracking-widest text-white">•••• {businessData.cardMask.slice(-4)}</p>
                    <span className="px-2 py-0.5 bg-neon/10 border border-neon/20 rounded-md text-[8px] font-black uppercase tracking-widest text-neon">Основная</span>
                  </div>
                  <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">Истекает: {businessData.cardExpiry?.slice(0, 2)} / {businessData.cardExpiry?.slice(2)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-neutral-400">
                  <Lock className="w-3 h-3 text-neon" />
                  Данные защищены 3D-Secure
                </div>
                <Button 
                  variant="ghost" 
                  onClick={handleRemovePaymentMethod}
                  disabled={loading === "removing_card"}
                  className="text-neutral-500 hover:text-red-500 hover:bg-red-500/10 font-black uppercase text-[10px] tracking-widest gap-2 h-10 px-4 rounded-xl transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Удалить
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <CreditCard className="w-6 h-6 text-neutral-600" />
              </div>
              <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Нет привязанных способов оплаты</p>
              <p className="text-neutral-600 text-xs max-w-sm mx-auto italic">Карта будет автоматически привязана при активации пробного периода или оплате тарифа.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
