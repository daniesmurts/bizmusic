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
  const { user, role } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [businessData, setBusinessData] = useState<BusinessData | null>(null);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    if (role === null) {
      return;
    }

    if (role === "STAFF") {
      router.push('/dashboard/player');
      return;
    }

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
  }, [user, role, router]);

  if (role === null || role === "STAFF") {
    return null;
  }

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
    <div className="space-y-8 lg:space-y-12 pb-20 relative z-0 min-h-screen">
      {/* Background gradients for depth */}
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] bg-neon/15 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed top-[20%] right-[-5%] w-[600px] h-[600px] bg-purple-500/15 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[10%] w-[800px] h-[800px] bg-blue-500/15 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-2">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter">Ваша <span className="text-neon">Подписка</span></h2>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Управление тарифами и пробный период</p>
        </div>
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard/subscription/history')}
          className="text-neutral-400 hover:text-white font-black uppercase text-[10px] sm:text-xs tracking-widest gap-2 self-start sm:self-auto shrink-0"
        >
          <Receipt className="w-4 h-4" /> История платежей
        </Button>
      </div>

      {/* Trial Banner / Current Status */}
      <div className="glass-dark border border-white/10 rounded-[2rem] lg:rounded-[3.5rem] p-5 sm:p-8 md:p-10 lg:p-12 relative overflow-hidden backdrop-blur-2xl">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-neon/10 blur-[100px] rounded-full" />
        
        <div className="relative z-10 space-y-6">
          {/* Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-neon">Статус аккаунта</span>
              <h3 className={cn(
                "text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter",
                businessData?.subscriptionStatus === 'ACTIVE' ? 'text-neon' : 'text-white'
              )}>
                {businessData?.subscriptionStatus === 'ACTIVE' ? 'Активирован' : 'Бесплатно'}
              </h3>
            </div>
            {businessData?.subscriptionStatus === 'ACTIVE' && (
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest w-fit",
                businessData.cancelAtPeriodEnd
                  ? "bg-red-500/10 border border-red-500/20 text-red-400"
                  : "bg-neon/10 border border-neon/20 text-neon"
              )}>
                <ShieldCheck className="w-4 h-4" />
                {businessData.cancelAtPeriodEnd ? "Отмена запланирована" : "Подписка активна"}
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-neutral-400 font-medium text-xs sm:text-sm leading-relaxed max-w-lg">
            {businessData?.subscriptionStatus === 'ACTIVE'
              ? (businessData.cancelAtPeriodEnd
                  ? `Ваша подписка активна до ${new Date(businessData.subscriptionExpiresAt!).toLocaleDateString('ru-RU')}. После этого она не будет продлена.`
                  : businessData.trialEndsAt && new Date(businessData.trialEndsAt) > new Date()
                    ? `Пробный период активен. Первое списание — ${new Date(businessData.trialEndsAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}.`
                    : 'Полный доступ к музыкальным каталогам и юридической гарантии.')
              : 'Выберите тариф для активации 7-дневного пробного периода.'}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {businessData?.subscriptionStatus === 'ACTIVE' && !businessData.cancelAtPeriodEnd && (
              <Button 
                variant="ghost" 
                onClick={handleCancelSubscription}
                disabled={loading === "cancelling"}
                className="text-neutral-500 hover:text-red-400 hover:bg-red-500/10 font-black uppercase text-[10px] tracking-widest h-10 px-4 rounded-xl"
              >
                {loading === "cancelling" ? "Отмена..." : "Отменить подписку"}
              </Button>
            )}
            {businessData?.subscriptionStatus === 'ACTIVE' && businessData?.cancelAtPeriodEnd && (
              <Button
                onClick={handleReactivateSubscription}
                disabled={loading === "reactivating"}
                className="bg-neon text-black font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl hover:scale-[1.02] transition-transform"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-2" />
                {loading === "reactivating" ? "Восстановление..." : "Возобновить подписку"}
              </Button>
            )}
            {businessData?.subscriptionStatus !== 'ACTIVE' && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-300">
                <Sparkles className="w-3.5 h-3.5 text-neon" />
                7 дней бесплатно
              </div>
            )}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto w-full">
        {PLANS_UI.map((tier) => {
          const isCurrent = businessData?.subscriptionStatus === 'ACTIVE' && businessData?.currentPlanSlug === tier.slug;
          return (
            <div key={tier.slug} className={cn(
              "glass-dark border rounded-2xl sm:rounded-[2.5rem] flex transition-all duration-500",
              // Mobile: horizontal compact row. Desktop: vertical card
              "flex-row items-center gap-4 p-4 sm:flex-col sm:items-stretch sm:p-8 sm:h-full",
              tier.popular ? "border-neon/30 bg-neon/5 shadow-[0_0_40px_rgba(92,243,135,0.1)]" : "border-white/5 hover:border-white/10",
              isCurrent && "ring-2 ring-neon/20"
            )}>
              {/* Icon - mobile: small, desktop: centered */}
              <div className={cn(
                "shrink-0 rounded-xl flex items-center justify-center border",
                "w-12 h-12 sm:w-12 sm:h-12 sm:mx-auto sm:mb-4",
                tier.popular ? "bg-neon/20 border-neon/30" : "bg-white/5 border-white/10"
              )}>
                <tier.icon className={cn("w-6 h-6", tier.popular ? "text-neon" : "text-neutral-400")} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 sm:text-center sm:mb-6 sm:space-y-3">
                <div className="flex items-center gap-2 sm:flex-col sm:gap-0">
                  <h4 className="text-lg sm:text-2xl font-black uppercase tracking-tight truncate">{tier.name}</h4>
                  {tier.popular && <span className="text-[8px] font-black uppercase tracking-widest bg-neon/20 text-neon px-2 py-0.5 rounded-full border border-neon/30 sm:mt-1">Популярный</span>}
                </div>
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest hidden sm:block">{tier.description}</p>
                <div className="flex items-baseline gap-1 sm:justify-center sm:pt-2">
                  <span className="text-xl sm:text-3xl md:text-4xl font-black">{tier.price}</span>
                  <span className="text-[10px] text-neutral-500 font-bold">/ {isYearly ? "год" : "мес"}</span>
                </div>
                <p className="text-neon text-[9px] sm:text-[10px] font-black uppercase tracking-widest">7 дней бесплатно</p>
                <p className="text-neutral-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest hidden sm:block">TTS: {tier.ttsMonthlyLimit} генераций / мес</p>
              </div>

              {/* Button */}
              <Button 
                onClick={() => handleStartTrial(tier.slug)}
                disabled={loading !== null || isCurrent}
                className={cn(
                  "shrink-0 font-black uppercase tracking-widest text-[10px] transition-transform hover:scale-[1.02]",
                  "h-10 px-4 rounded-xl sm:h-14 sm:rounded-2xl sm:w-full sm:mt-auto",
                  isCurrent ? "bg-white/5 text-neutral-500" : tier.popular ? "bg-neon text-black" : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {isCurrent 
                  ? "Текущий" 
                  : businessData?.subscriptionStatus === 'ACTIVE'
                  ? (tier.priceValue > (PLANS_UI.find(p => p.slug === businessData?.currentPlanSlug)?.priceValue || 0) ? "Улучшить" : "Понизить")
                  : loading === tier.slug ? "..." : "Активировать"}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Grid Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
        <div className="glass-dark border border-white/10 p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] flex items-start gap-4 sm:flex-col sm:gap-0 sm:space-y-6">
           <div className="w-12 h-12 sm:w-14 sm:h-14 bg-neon/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-neon/20 shrink-0">
              <CreditCard className="text-neon w-6 h-6 sm:w-7 sm:h-7" />
           </div>
           <div className="space-y-2 sm:space-y-4">
              <h4 className="text-lg sm:text-3xl font-black uppercase tracking-tight leading-tight">Безопасная верификация</h4>
              <p className="text-neutral-400 font-medium text-xs sm:text-base leading-relaxed">Мы спишем и вернем 1 ₽ для проверки карты. Плата начнется через 7 дней.</p>
           </div>
        </div>
        <div className="glass-dark border border-white/10 p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] flex items-start gap-4 sm:flex-col sm:gap-0 sm:space-y-6">
           <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500/10 rounded-xl sm:rounded-2xl flex items-center justify-center border border-blue-500/20 shrink-0">
              <RotateCcw className="text-blue-500 w-6 h-6 sm:w-7 sm:h-7" />
           </div>
           <div className="space-y-2 sm:space-y-4">
              <h4 className="text-lg sm:text-3xl font-black uppercase tracking-tight leading-tight">Гибкая отмена</h4>
              <p className="text-neutral-400 font-medium text-xs sm:text-base leading-relaxed">Отмените подписку в любой момент пробного периода без списаний.</p>
           </div>
        </div>
      </div>

      {/* Payment Methods Section */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center gap-2 px-2">
          <ShieldCheck className="w-5 h-5 text-neon" />
          <h3 className="text-base sm:text-xl font-black uppercase tracking-tight">Способы оплаты</h3>
        </div>

        <div className="glass-dark border border-white/5 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-24 bg-blue-500/5 blur-[80px] rounded-full -mr-16 -mt-16 pointer-events-none" />
          
          {businessData?.cardMask ? (
            <div className="flex flex-col gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 sm:w-16 sm:h-10 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm sm:text-lg font-black tracking-widest text-white">•••• {businessData.cardMask.slice(-4)}</p>
                    <span className="px-2 py-0.5 bg-neon/10 border border-neon/20 rounded-md text-[8px] font-black uppercase tracking-widest text-neon">Основная</span>
                  </div>
                  <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest">Истекает: {businessData.cardExpiry?.slice(0, 2)} / {businessData.cardExpiry?.slice(2)}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleRemovePaymentMethod}
                  disabled={loading === "removing_card"}
                  className="text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl w-9 h-9 shrink-0"
                  title="Удалить карту"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-neutral-400 w-fit">
                <Lock className="w-3 h-3 text-neon" />
                3D-Secure защита
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
