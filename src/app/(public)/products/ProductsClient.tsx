"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Music,
  Video,
  Radio,
  Mic2,
  Headphones,
  TrendingUp,
  Zap,
  ArrowRight,
  Play,
  Heart,
  ExternalLink,
} from "lucide-react";
import { usePlayerStore, Track } from "@/store/usePlayerStore";
import { cn } from "@/lib/utils";

const products = [
  {
    name: "Голосовые объявления",
    slug: "voice-announcements",
    description: "Автоматическая аудиореклама и информирование",
    longDescription:
      "Увеличивайте продажи и информируйте клиентов без участия персонала. Идеально для анонса акций, специальных предложений и навигации в помещении.",
    icon: Mic2,
    image: "/images/voice_announcements.png",
    features: [
      "AI-генерация голоса за 30 сек",
      "Профессиональные дикторы",
      "Умное планирование ротации",
      "Автоматическая громкость",
      "Готовые шаблоны акций",
      "5 правок для AI тарифа",
    ],
    color: "neon",
    link: "/products/voice-announcements",
  },
  {
    name: "Музыка для бизнеса",
    slug: "business-music",
    description: "Профессиональное музыкальное оформление для физических пространств",
    longDescription:
      "Идеально для кафе, ресторанов, ритейла, офисов, салонов красоты, фитнес-центров и отелей. 100% легальная музыка, защищающая от претензий РАО и ВОИС.",
    icon: Music,
    image: "/images/business_music.png",
    features: [
      "Публичное исполнение (ст. 1243 ГК РФ)",
      "Безлимитные точки вещания",
      "Курируемые плейлисты по жанрам",
      "Планирование ротации",
      "Оффлайн режим",
      "Лицензионный сертификат",
    ],
    color: "neon",
    link: "/products/business-music",
  },
  {
    name: "Контент для блогеров",
    slug: "content-creators",
    description: "Музыка для видео, подкастов и социальных сетей",
    longDescription:
      "Создавайте контент без претензий от платформ. Все треки лицензированы для использования в YouTube, VK, Telegram, Rutube и других платформах.",
    icon: Video,
    image: "/images/mood-2.png",
    features: [
      "Скачивание MP3/WAV файлов",
      "Синхронизация с видео",
      "Content ID Whitelist",
      "YouTube, VK, Telegram, Rutube",
      "Яндекс.Дзен, OK.ru",
      "Атрибуция не требуется",
    ],
    color: "purple",
    link: "/products/content-creators",
  },
  {
    name: "Радио для ритейла",
    slug: "retail-radio",
    description: "Готовые радиостанции для вашего бизнеса",
    longDescription:
      "Профессионально запрограммированные музыкальные потоки для различных форматов ритейла. Утренний джаз для кофейни, энергичная поп-музыка для спортзала, спокойный лаунж для спа.",
    icon: Radio,
    image: "/images/hero.png",
    features: [
      "24/7 музыкальный поток",
      "Программирование по времени суток",
      "Адаптация под аудиторию",
      "Минимальная ротация",
      "Тематические станции",
      "Управление громкостью",
    ],
    color: "blue",
    link: "/about#contact",
  },
  {
    name: "Подкасты и аудио",
    slug: "podcasts",
    description: "Музыка для подкастов и аудиоконтента",
    longDescription:
      "Уникальные треки для интро, аутро и фоновой музыки в подкастах. Все права очищены для монетизации на всех платформах.",
    icon: Headphones,
    image: "/images/mood-1.png",
    features: [
      "Интро и аутро",
      "Фоновая музыка",
      "Переходы и джинглы",
      "Монетизация разрешена",
      "Все платформы",
      "Без претензий",
    ],
    color: "orange",
    link: "/pricing",
  },
  {
    name: "White Label",
    slug: "white-label",
    description: "Лицензирование для агентств и студий",
    longDescription:
      "Используйте нашу музыку в проектах ваших клиентов. Полная свобода действий с возможностью кастомизации и белым лейблом.",
    icon: Zap,
    image: "/images/mood-2.png",
    features: [
      "Лицензия для клиентов",
      "Белый лейбл",
      "Кастомные запросы",
      "Приоритетная поддержка",
      "Персональный менеджер",
      "Расширенная аналитика",
    ],
    color: "pink",
    link: "/pricing",
  },
  {
    name: "Аналитика и отчёты",
    slug: "analytics",
    description: "Детальная статистика использования музыки",
    longDescription:
      "Получайте подробные отчёты о воспроизведении треков. Идеально для аудита и подтверждения легальности использования музыки.",
    icon: TrendingUp,
    image: "/images/hero.png",
    features: [
      "Play logs для аудита",
      "Статистика по локациям",
      "Время воспроизведения",
      "Популярные треки",
      "Экспорт данных",
      "УПД для бухгалтерии",
    ],
    color: "green",
    link: "/dashboard",
  },
];

export default function ProductsClient() {
  const { setTrack } = usePlayerStore();

  const handlePlayDemo = (title: string, artist: string) => {
    const demoTrack: Track = {
      id: "demo-" + Math.random(),
      title,
      artist,
      fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      duration: 372,
      cover_url: "/images/mood-1.png",
    };
    setTrack(demoTrack);
  };

  return (
    <div className="space-y-24 pb-20">
      {/* Header */}
      <section className="text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon/30 bg-neon/10 backdrop-blur-md">
          <Zap className="w-4 h-4 text-neon" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-neon">
            Продукты и решения
          </span>
        </div>

        <h1 className="text-4xl sm:text-7xl md:text-8xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.95] md:leading-[0.85] text-white">
          Наши <span className="text-neon">продукты</span>
        </h1>

        <p className="text-xl text-neutral-400 font-medium max-w-2xl mx-auto leading-relaxed">
          Комплексные решения для бизнеса, блогеров и создателей контента. 
          100% легальная музыка с полной юридической защитой.
        </p>
      </section>

      {/* Products Grid */}
      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-6">
        {products.map((product, i) => {
          const Icon = product.icon;
          const isWide = i === 0 || i === 3;

          return (
            <div
              key={product.slug}
              className={cn(
                "group relative rounded-[3rem] overflow-hidden border border-white/5 bg-white/[0.02] hover:border-white/10 transition-all duration-500",
                isWide ? "md:col-span-2 lg:col-span-2" : ""
              )}
            >
              {/* Image */}
              <div className={cn("relative overflow-hidden", isWide ? "h-64" : "h-48")}>
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover brightness-75 group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                {/* Icon Badge */}
                <div className="absolute top-6 left-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </div>

                {/* Play Button */}
                <button
                  onClick={() => handlePlayDemo(product.name, "Демо")}
                  className="absolute top-6 right-6 w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center hover:bg-neon hover:border-neon hover:text-black transition-all group/btn"
                >
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 md:p-8 space-y-6">
                <div className="space-y-3">
                  <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white">
                    {product.name}
                  </h3>
                  <p className="text-neutral-400 text-sm font-bold uppercase tracking-widest">
                    {product.description}
                  </p>
                </div>

                <p className="text-neutral-500 text-sm font-medium leading-relaxed">
                  {product.longDescription}
                </p>

                {/* Features */}
                <div className="space-y-3">
                  {product.features.slice(0, 4).map((feature, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-neon" />
                      <span className="text-sm font-bold text-neutral-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="pt-6 flex items-center gap-4">
                  <Link href={product.link} className="flex-1">
                    <Button
                      className={cn(
                        "w-full h-12 rounded-2xl font-black uppercase tracking-widest text-sm transition-all",
                        product.color === "neon" &&
                          "bg-neon text-black hover:scale-105 shadow-[0_0_20px_rgba(92,243,135,0.3)]"
                      )}
                      variant={product.color === "neon" ? "default" : "outline"}
                    >
                      Подробнее
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <Heart className="w-5 h-5 text-neutral-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* CTA Section */}
      <section className="px-6">
        <div className="max-w-4xl mx-auto glass-dark border border-white/10 rounded-[2.5rem] md:rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-neon/5 blur-[120px] rounded-full -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 p-32 bg-blue-500/5 blur-[120px] rounded-full -ml-32 -mb-32 pointer-events-none" />

          <div className="relative z-10 space-y-8">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tighter text-white leading-tight">
              Нужна <span className="text-neon">помощь</span> с выбором?
            </h2>
            <p className="text-xl text-neutral-400 font-medium max-w-2xl mx-auto leading-relaxed">
              Свяжитесь с нами, и мы поможем подобрать оптимальное решение для вашего бизнеса.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/about#contact" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-neon text-black hover:scale-105 transition-transform rounded-2xl px-10 h-14 font-black uppercase tracking-widest shadow-[0_0_30px_rgba(92,243,135,0.4)]">
                  Связаться с нами
                </Button>
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-white/20 text-white hover:bg-white/5 backdrop-blur-sm rounded-2xl px-10 h-14 font-black uppercase tracking-widest"
                >
                  Смотреть тарифы
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
