"use client";

import { useState } from "react";
import {
  Check,
  X,
  Music,
  Download,
  Globe,
  ShieldCheck,
  Headphones,
  Video,
  Mic2,
  TrendingUp,
  Zap,
  Crown,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

type BillingCycle = "monthly" | "yearly";

interface PricingTier {
  name: string;
  slug: string;
  description: string;
  icon: any;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyDiscount: number;
  features: string[];
  notIncluded: string[];
  highlight?: boolean;
  popular?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: "Бизнес",
    slug: "business",
    description: "Для бизнеса: кафе, ритейл, офисы, салоны красоты",
    icon: Music,
    monthlyPrice: 990,
    yearlyPrice: 8400,
    yearlyDiscount: 29,
    features: [
      "Стриминг через PWA плеер",
      "Публичное исполнение (ст. 1243 ГК РФ)",
      "Безлимитные точки вещания",
      "Курируемые плейлисты",
      "Планирование ротации",
      "Ограничение громкости",
      "Оффлайн кэш",
      "Лицензионный сертификат",
      "Защита от РАО/ВОИС",
      "Play logs для аудита",
      "УПД для бухгалтерии",
    ],
    notIncluded: [
      "Скачивание треков",
      "Синхронизация с видео",
      "Приоритетная поддержка",
      "Кастомные запросы",
    ],
  },
  {
    name: "Контент",
    slug: "content",
    description: "Для блогеров, SMM, видео-мейкеров, маркетологов",
    icon: Video,
    monthlyPrice: 1490,
    yearlyPrice: 12000,
    yearlyDiscount: 33,
    features: [
      "Скачивание MP3/WAV файлов",
      "Стриминг через плеер",
      "Синхронизация с видео/аудио",
      "YouTube, VK, Telegram, Rutube",
      "Яндекс.Дзен, OK.ru",
      "Content ID Whitelist",
      "Атрибуция (не обязательно)",
      "Лицензионный сертификат",
      "Защита от претензий",
    ],
    notIncluded: [
      "Публичное исполнение в оффлайн",
      "Коммерческое использование",
      "Кастомные запросы",
    ],
    popular: true,
  },
  {
    name: "Бизнес +",
    slug: "business-plus",
    description: "Для сетей, агентств, крупных компаний",
    icon: Crown,
    monthlyPrice: 4990,
    yearlyPrice: 48000,
    yearlyDiscount: 20,
    features: [
      "Стриминг + Скачивание всех треков",
      "Публичное исполнение + Синхронизация",
      "Ограниченное коммерческое использование",
      "Безлимитные локации",
      "Безлимитный цифровой контент",
      "Приоритетная поддержка 24/7",
      "Кастомные запросы на треки",
      "Расширенная аналитика",
      "Отчёты по контенту",
      "White-label опция",
      "Лицензирование для клиентов",
      "Персональный менеджер",
    ],
    highlight: true,
  },
];

const faqs = [
  {
    question: "Что входит в публичное исполнение?",
    answer:
      "Публичное исполнение — это воспроизведение музыки в местах, открытых для свободного посещения: кафе, рестораны, магазины, офисы, салоны красоты и т.д. Наша лицензия защищает вас от претензий РАО и ВОИС.",
  },
  {
    question: "Могу ли я использовать музыку в YouTube?",
    answer:
      "Да, тарифы «Контент» и «Бизнес +» включают право на синхронизацию с видео и воспроизведение в социальных сетях: YouTube, VK Video, Telegram, Яндекс.Дзен, Rutube, OK.ru.",
  },
  {
    question: "Как работает защита от РАО/ВОИС?",
    answer:
      "После оплаты вы получаете Лицензионный сертификат с указанием вашего ИНН/КПП, перечнем треков и сроком действия. Этот документ подтверждает ваше право на использование музыки и защищает от претензий.",
  },
  {
    question: "Можно ли добавить точки вещания позже?",
    answer:
      "Да, на тарифе «Бизнес» вы можете добавить дополнительные точки вещания за дополнительную плату. На тарифе «Бизнес +» количество локаций не ограничено.",
  },
  {
    question: "Как отменить подписку?",
    answer:
      "Вы можете отменить подписку в любой момент в личном кабинете. Доступ к сервису сохранится до конца оплаченного периода.",
  },
  {
    question: "Предоставляете ли вы закрывающие документы?",
    answer:
      "Да, мы автоматически формируем УПД (Универсальный передаточный документ) и Акт выполненных работ после каждой оплаты. Документы доступны в личном кабинете.",
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-24 pb-20">
      {/* Header */}
      <section className="text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon/30 bg-neon/10 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-neon" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-neon">
            Прозрачные тарифы
          </span>
        </div>

        <h1 className="text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-white">
          Тарифы <span className="text-neon">для</span> <br />
          <span className="outline-text">бизнеса</span>
        </h1>

        <p className="text-xl text-neutral-400 font-medium max-w-2xl mx-auto leading-relaxed">
          Выберите подходящий тариф для вашего бизнеса. Все тарифы включают
          100% легальную музыку и защиту от РАО/ВОИС.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 pt-8">
          <span
            className={cn(
              "text-sm font-black uppercase tracking-widest transition-colors",
              billingCycle === "monthly" ? "text-white" : "text-neutral-500"
            )}
          >
            Ежемесячно
          </span>

          <button
            onClick={() =>
              setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
            }
            className="relative w-16 h-8 bg-white/10 rounded-full border border-white/20 transition-colors hover:border-neon/50"
          >
            <div
              className={cn(
                "absolute top-1 w-6 h-6 rounded-full bg-neon transition-transform duration-300",
                billingCycle === "yearly" ? "translate-x-8" : "translate-x-1"
              )}
            />
          </button>

          <span
            className={cn(
              "text-sm font-black uppercase tracking-widest transition-colors",
              billingCycle === "yearly" ? "text-white" : "text-neutral-500"
            )}
          >
            Ежегодно
          </span>

          <div className="ml-2 px-3 py-1 rounded-full bg-neon/10 border border-neon/20">
            <span className="text-[10px] font-black uppercase tracking-widest text-neon">
              −20%
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto px-6">
        {pricingTiers.map((tier) => {
          const price =
            billingCycle === "monthly" ? tier.monthlyPrice : tier.yearlyPrice;
          const Icon = tier.icon;

          return (
            <div
              key={tier.slug}
              className={cn(
                "relative group p-8 rounded-[3rem] border transition-all duration-500 flex flex-col",
                tier.highlight
                  ? "bg-neon/5 border-neon/30 shadow-[0_0_60px_rgba(92,243,135,0.15)] scale-105"
                  : "bg-white/[0.02] border-white/5 hover:border-white/10",
                tier.popular && !tier.highlight && "border-neon/20"
              )}
            >
              {/* Popular Badge */}
              {tier.popular && !tier.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1 rounded-full bg-neon text-black text-xs font-black uppercase tracking-widest">
                    Популярный
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="text-center space-y-4 mb-8">
                <div
                  className={cn(
                    "w-16 h-16 mx-auto rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110",
                    tier.highlight
                      ? "bg-neon/20 border-neon/30"
                      : "bg-white/5 border-white/10"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-8 h-8",
                      tier.highlight ? "text-neon" : "text-neutral-400"
                    )}
                  />
                </div>

                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
                    {tier.description}
                  </p>
                </div>

                <div className="pt-4">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-black text-white">
                      {formatPrice(price)}
                    </span>
                    {billingCycle === "yearly" && tier.yearlyDiscount > 0 && (
                      <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500 line-through">
                          {formatPrice(tier.monthlyPrice * 12)}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-neon">
                          −{tier.yearlyDiscount}%
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mt-2">
                    {billingCycle === "monthly" ? "в месяц" : "в год"}
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="flex-1 space-y-4 mb-8">
                {tier.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-neon flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-bold text-neutral-300 leading-relaxed">
                      {feature}
                    </span>
                  </div>
                ))}

                {tier.notIncluded && tier.notIncluded.length > 0 && (
                  <div className="pt-4 border-t border-white/5 space-y-3">
                    {tier.notIncluded.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3 opacity-50">
                        <X className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm font-bold text-neutral-500 leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CTA Button */}
              <Link href="/register">
                <Button
                  className={cn(
                    "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-sm transition-all",
                    tier.highlight
                      ? "bg-neon text-black hover:scale-105 shadow-[0_0_30px_rgba(92,243,135,0.4)]"
                      : "bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  Начать бесплатно
                </Button>
              </Link>
            </div>
          );
        })}
      </section>

      {/* Comparison Table */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-black uppercase tracking-tighter text-white mb-4">
            Сравнение <span className="text-neon">тарифов</span>
          </h2>
          <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
            Подробное сравнение возможностей каждого тарифа
          </p>
        </div>

        <div className="glass-dark border border-white/5 rounded-[3rem] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-6 px-8 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Возможность
                </th>
                {pricingTiers.map((tier) => (
                  <th key={tier.slug} className="py-6 px-6 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <tier.icon
                        className={cn(
                          "w-6 h-6",
                          tier.highlight ? "text-neon" : "text-neutral-400"
                        )}
                      />
                      <span className="text-sm font-black uppercase tracking-tight text-white">
                        {tier.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                {
                  feature: "Стриминг музыки",
                  business: true,
                  content: true,
                  businessPlus: true,
                },
                {
                  feature: "Скачивание треков",
                  business: false,
                  content: true,
                  businessPlus: true,
                },
                {
                  feature: "Публичное исполнение",
                  business: true,
                  content: false,
                  businessPlus: true,
                },
                {
                  feature: "Синхронизация с видео",
                  business: false,
                  content: true,
                  businessPlus: true,
                },
                {
                  feature: "Точки вещания",
                  business: "∞",
                  content: "—",
                  businessPlus: "∞",
                },
                {
                  feature: "Content ID Whitelist",
                  business: false,
                  content: true,
                  businessPlus: true,
                },
                {
                  feature: "Приоритетная поддержка",
                  business: false,
                  content: false,
                  businessPlus: true,
                },
                {
                  feature: "Кастомные запросы",
                  business: false,
                  content: false,
                  businessPlus: true,
                },
                {
                  feature: "White-label",
                  business: false,
                  content: false,
                  businessPlus: true,
                },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 px-8 text-sm font-bold text-white">
                    {row.feature}
                  </td>
                  <td className="py-5 px-6 text-center">
                    {row.business === true ? (
                      <Check className="w-5 h-5 text-neon mx-auto" />
                    ) : row.business === false ? (
                      <X className="w-5 h-5 text-neutral-700 mx-auto" />
                    ) : (
                      <span className="text-white font-bold">{row.business}</span>
                    )}
                  </td>
                  <td className="py-5 px-6 text-center">
                    {row.content === true ? (
                      <Check className="w-5 h-5 text-neon mx-auto" />
                    ) : row.content === false ? (
                      <X className="w-5 h-5 text-neutral-700 mx-auto" />
                    ) : (
                      <span className="text-white font-bold">{row.content}</span>
                    )}
                  </td>
                  <td className="py-5 px-6 text-center">
                    {row.businessPlus === true ? (
                      <Check className="w-5 h-5 text-neon mx-auto" />
                    ) : row.businessPlus === false ? (
                      <X className="w-5 h-5 text-neutral-700 mx-auto" />
                    ) : (
                      <span className="text-white font-bold">
                        {row.businessPlus}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-black uppercase tracking-tighter text-white mb-4">
            Вопросы и <span className="text-neon">ответы</span>
          </h2>
          <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
            Ответы на популярные вопросы о тарифах
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group glass-dark border border-white/5 rounded-2xl overflow-hidden"
            >
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <h3 className="text-white font-black uppercase tracking-tight pr-8">
                  {faq.question}
                </h3>
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-open:bg-neon group-open:border-neon transition-colors">
                  <svg
                    className="w-4 h-4 text-neutral-400 group-open:text-black transition-transform group-open:rotate-45"
                    viewBox="0 0 10 10"
                    fill="currentColor"
                  >
                    <path d="M1 5H9M5 1V9" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
              </summary>
              <div className="px-6 pb-6">
                <p className="text-neutral-400 text-sm font-medium leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6">
        <div className="max-w-4xl mx-auto glass-dark border border-white/10 rounded-[3rem] p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-neon/5 blur-[120px] rounded-full -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 p-32 bg-blue-500/5 blur-[120px] rounded-full -ml-32 -mb-32 pointer-events-none" />

          <div className="relative z-10 space-y-8">
            <h2 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter text-white">
              Готовы <span className="text-neon">начать?</span>
            </h2>
            <p className="text-xl text-neutral-400 font-medium max-w-2xl mx-auto leading-relaxed">
              Зарегистрируйтесь сейчас и получите 14 дней бесплатного доступа к
              любому тарифу.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register">
                <Button className="bg-neon text-black hover:scale-105 transition-transform rounded-2xl px-10 h-14 font-black uppercase tracking-widest shadow-[0_0_30px_rgba(92,243,135,0.4)]">
                  Начать бесплатно
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/5 backdrop-blur-sm rounded-2xl px-10 h-14 font-black uppercase tracking-widest"
                >
                  Связаться с нами
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
