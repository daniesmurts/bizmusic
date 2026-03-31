"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  Play,
  Heart,
  ExternalLink,
  CreditCard,
  Star,
  HelpCircle,
  Plus,
  Minus,
  Waves,
  WifiOff,
  Mic,
  BarChart3,
  LayoutDashboard
} from "lucide-react";
import { usePlayerStore, Track } from "@/store/usePlayerStore";
import { useState } from "react";
import { FeaturedMusic } from "@/components/FeaturedMusic";
import { cn } from "@/lib/utils";

export default function HomeClient() {
  const { setTrack } = usePlayerStore();

  const handlePlayDemo = (title: string, artist: string) => {
    const demoTrack: Track = {
      id: "demo-" + Math.random(),
      title,
      artist,
      fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Demo URL
      duration: 372,
      cover_url: title.includes("Jazz") ? "/images/mood-1.png" : "/images/mood-2.png"
    };
    setTrack(demoTrack);
  };

  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center px-6 md:px-12 py-20 overflow-hidden rounded-[2rem] md:rounded-[3rem] mx-4 md:mx-6">
        <Image
          src="/images/hero.png"
          alt="Hero Background"
          fill
          className="object-cover brightness-[0.45]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1117] via-[#0f1117]/60 to-transparent" />

        <div className="relative z-10 max-w-2xl space-y-8 animate-in fade-in slide-in-from-left duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon/30 bg-neon/10 backdrop-blur-md">
            <Zap className="w-4 h-4 text-neon fill-neon" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-neon">Новое поколение звука</span>
          </div>

          <h1 className="text-[clamp(2rem,10vw,4.5rem)] sm:text-6xl lg:text-8xl font-black uppercase tracking-tighter leading-[1.1] md:leading-[0.85] text-white">
            Атмосфера <br />
            <span className="text-neon outline-text">вашего успеха</span>
          </h1>

          <p className="text-lg md:text-xl text-neutral-300 font-medium leading-relaxed max-w-xl">
            Легальное музыкальное оформление для бизнеса. <br />
            100% уверенность. Полная безопасность. В одно касание.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/register">
              <Button className="bg-neon text-black hover:scale-105 transition-transform rounded-full px-6 py-6 sm:px-10 sm:py-8 text-base sm:text-lg font-black uppercase tracking-widest shadow-[0_0_30px_rgba(92,243,135,0.4)]">
                Начать бесплатно
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 backdrop-blur-sm rounded-full px-6 py-6 sm:px-10 sm:py-8 text-base sm:text-lg font-black uppercase tracking-widest">
                Все тарифы
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="px-6 md:px-12 space-y-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">Наши <span className="text-neon">Решения</span></h2>
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs md:text-sm">Комплексные решения для вашего бизнеса</p>
          </div>
          <Link href="/products">
            <Button variant="ghost" className="text-neon font-black uppercase tracking-widest group">
              Смотреть все <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {[
            {
              title: "Музыка для бизнеса",
              description: "Для кафе, ритейл, офисов",
              img: "/images/business_music.png",
              link: "/products/business-music"
            },
            {
              title: "Контент для блогеров",
              description: "Для YouTube, VK, Telegram",
              img: "/images/mood-2.png",
              link: "/products/content-creators"
            },
            {
              title: "Голосовые анонсы",
              description: "Аудиоанонсы и информирование",
              img: "/images/voice_announcements.png",
              link: "/products/voice-announcements"
            },
            {
              title: "White Label",
              description: "Для агентств и студий",
              img: "/images/hero.png",
              link: "/pricing"
            }
          ].map((item, i) => (
            <Link key={i} href={item.link}>
              <div
                className="group relative h-[380px] md:h-[450px] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-white/8 hover:border-neon/20 transition-all duration-500 shadow-lg shadow-black/20"
              >
                <Image
                  src={item.img}
                  alt={item.title}
                  fill
                  className="object-cover brightness-75 group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1117] via-[#0f1117]/30 to-transparent" />

                <div className="absolute top-4 right-4 md:top-6 md:right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                  <Button size="icon" className="w-8 h-8 md:w-10 md:h-10 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full hover:bg-neon hover:text-black transition-colors">
                    <Heart className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                  <Button size="icon" className="w-8 h-8 md:w-10 md:h-10 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full hover:bg-white/20">
                    <ExternalLink className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </Button>
                </div>

                <div className="absolute inset-x-8 bottom-8">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-2xl xl:text-3xl font-black uppercase leading-none text-white">{item.title}</h3>
                      <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-3 text-neon font-black uppercase tracking-widest text-sm">
                      <span>Подробнее</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="px-6 md:px-12 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon/30 bg-neon/10 backdrop-blur-md">
            <Star className="w-4 h-4 text-neon fill-neon" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon">Технологии будущего</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none text-white">
            Больше, чем просто <span className="text-neon outline-text">стриминг</span>
          </h2>
          <p className="text-neutral-500 font-medium text-sm md:text-lg italic">
            Мы объединили музыкальный интеллект с юридической безопасностью, чтобы ваш бизнес звучал безупречно.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {[
            {
              index: "01",
              title: "Бизнес-Волна",
              description: "Умная музыка, которая чувствует ритм вашего бизнеса. Система мгновенно создает идеальную атмосферу, адаптируясь под время дня и настроение гостей.",
              icon: Waves,
              color: "text-neon",
              shadow: "shadow-neon/20",
              border: "group-hover:border-neon/50",
              bg: "bg-neon/10"
            },
            {
              index: "02",
              title: "Полный Оффлайн",
              description: "Ваша музыка не остановится никогда. Безупречное звучание даже при полном отсутствии интернета — мы гарантируем стабильность вашего эфира.",
              icon: WifiOff,
              color: "text-blue-400",
              shadow: "shadow-blue-400/20",
              border: "group-hover:border-blue-400/50",
              bg: "bg-blue-400/10"
            },
            {
              index: "03",
              title: "Юридический щит",
              description: "Забудьте о проверках, штрафах и отчислениях в РАО и ВОИС. Получите полную юридическую свободу и прямые лицензии для вашего спокойствия.",
              icon: ShieldCheck,
              color: "text-indigo-400",
              shadow: "shadow-indigo-400/20",
              border: "group-hover:border-indigo-400/50",
              bg: "bg-indigo-400/10"
            },
            {
              index: "04",
              title: "Голосовой ИИ",
              description: "Ваш персональный голос бренда. Мгновенно превращайте текст в профессиональные аудио-объявления, которые увеличивают средний чек.",
              icon: Mic,
              color: "text-violet-400",
              shadow: "shadow-violet-400/20",
              border: "group-hover:border-violet-400/50",
              bg: "bg-violet-400/10"
            },
            {
              index: "05",
              title: "Умная Аналитика",
              description: "Секреты успеха вашего заведения. Узнайте, какая музыка заставляет клиентов возвращаться к вам снова и снова, благодаря глубоким инсайтам.",
              icon: BarChart3,
              color: "text-orange-400",
              shadow: "shadow-orange-400/20",
              border: "group-hover:border-orange-400/50",
              bg: "bg-orange-400/10"
            },
            {
              index: "06",
              title: "Единая Панель",
              description: "Масштабируйте успех без границ. Легкое управление всей сетью заведений из любой точки мира — полный контроль в ваших руках в один клик.",
              icon: LayoutDashboard,
              color: "text-cyan-400",
              shadow: "shadow-cyan-400/20",
              border: "group-hover:border-cyan-400/50",
              bg: "bg-cyan-400/10"
            }
          ].map((feature, i) => (
            <div 
              key={i} 
              className={cn(
                "group relative glass-dark border border-white/10 rounded-[2.5rem] p-8 md:p-10 space-y-8 transition-all duration-500 overflow-hidden shadow-2xl hover:-translate-y-2",
                feature.border,
                feature.shadow
              )}
            >
              {/* Animated Glow Background */}
              <div className={cn("absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[100px] opacity-0 group-hover:opacity-20 transition-all duration-1000", feature.bg)} />
              
              <div className="flex items-center justify-between">
                <div className={cn(
                  "w-16 h-16 rounded-[1.5rem] flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-110 transition-all duration-500 relative overflow-hidden",
                  feature.bg
                )}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                  <feature.icon className={cn("w-8 h-8 relative z-10", feature.color)} />
                </div>
                <span className="text-4xl font-black text-white/5 group-hover:text-white/10 transition-colors duration-500 italic tracking-tighter">
                  {feature.index}
                </span>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white leading-tight">
                  {feature.title.split(' ')[0]} <br className="hidden md:block" />
                  <span className="text-neon group-hover:text-white transition-colors">{feature.title.split(' ').slice(1).join(' ')}</span>
                </h3>
                <p className="text-neutral-500 text-sm md:text-base leading-relaxed font-medium transition-colors group-hover:text-neutral-400">
                  {feature.description}
                </p>
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-600 group-hover:text-neon transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-800 group-hover:bg-neon group-hover:animate-pulse" />
                  Подробнее
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-800 group-hover:text-neon group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Music Section */}
      <section className="px-6 md:px-12 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-neutral-500">
              <Star className="w-4 h-4 text-neon fill-neon" />
              <span className="text-[10px] font-black uppercase tracking-widest">Бесплатный доступ • Featured</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
              <span className="text-neon underline decoration-neon/20 underline-offset-8">Послушайте</span> <br />
              прямо сейчас
            </h2>
          </div>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs max-w-xs md:text-right">
            Эти треки доступны для всех пользователей без авторизации
          </p>
        </div>

        <FeaturedMusic />
      </section>

      {/* Compliance & Features */}
      <section className="px-6 md:px-12">
        <div className="glass-surface border border-white/8 rounded-[2rem] md:rounded-[3.5rem] p-8 md:p-16 relative overflow-hidden shadow-xl shadow-black/10">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[60%] bg-neon/10 blur-[120px] rounded-full" />

          <div className="relative z-10 grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9]">
                Ваша <span className="text-neon underline decoration-neon/30 underline-offset-8">защита</span> <br className="hidden md:block" />
                наша работа
              </h2>
              <p className="text-neutral-400 text-lg leading-relaxed font-medium">
                Полная юридическая безопасность и безупречное качество звука. <br className="hidden md:block" />
                Мы берем на себя все заботы о правах, гарантируя вам спокойствие и легальную атмосферу.
              </p>
            </div>
            <div className="relative h-[300px] md:h-[500px] rounded-3xl overflow-hidden border border-white/10">
              <Image
                src="/images/mood-2.png"
                alt="Compliance"
                fill
                className="object-cover grayscale hover:grayscale-0 transition-all duration-1000"
              />
              <div className="absolute inset-0 bg-neon/10 mix-blend-overlay" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 md:px-12 max-w-5xl mx-auto w-full space-y-16">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon/30 bg-neon/10 backdrop-blur-md">
            <HelpCircle className="w-4 h-4 text-neon" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon">Поддержка</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
            Часто задаваемые <span className="text-neon outline-text">вопросы</span>
          </h2>
        </div>

        <div className="space-y-4">
          <FAQItem
            question="Как начать пользоваться сервисом?"
            answer="Зарегистрируйтесь, выберите подходящий тариф и привяжите карту. Вы получите 14 дней бесплатного периода для тестирования всех функций без ограничений."
          />
          <FAQItem
            question="Нужно ли платить в РАО и ВОИС?"
            answer="Нет. Бизмюзик предоставляет музыку по прямым лицензионным договорам с правообладателями. Мы берем на себя всю юридическую ответственность, и вам не нужно делать дополнительные отчисления в аккредитованные организации."
          />
          <FAQItem
            question="Есть ли мобильное приложение?"
            answer="Да, наш сервис — это PWA (Progressive Web App). Вы можете установить его на любой смартфон или планшет прямо из браузера, и оно будет работать как нативное приложение даже при нестабильном интернете."
          />
          <FAQItem
            question="Могу ли я использовать музыку оффлайн?"
            answer="Да, наше приложение автоматически кэширует треки. Если интернет временно пропадет, воспроизведение продолжится без прерываний из локального хранилища устройства."
          />
          <FAQItem
            question="Как я получу документы для проверки?"
            answer="Все необходимые документы (договор оферты, лицензионный сертификат с QR-кодом) доступны в вашем личном кабинете. Вы можете скачать или распечатать их в любой момент для предъявления инспекторам."
          />
          <FAQItem
            question="Можно ли менять тариф?"
            answer="Да, вы можете сменить тарифный план или период оплаты (месяц/год) в личном кабинете в любое время. Все перерасчеты произойдут автоматически."
          />
        </div>
      </section>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={cn(
        "group border rounded-[1.5rem] md:rounded-[2rem] overflow-hidden transition-all duration-500",
        isOpen ? "bg-white/[0.05] border-neon/30 ring-1 ring-neon/10" : "bg-white/[0.03] border-white/8 hover:border-white/12"
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-6 md:px-8 md:py-8 flex items-center justify-between gap-4 text-left"
      >
        <span className={cn(
          "text-lg md:text-xl font-black uppercase tracking-tight transition-colors duration-300",
          isOpen ? "text-neon" : "text-white group-hover:text-white/80"
        )}>
          {question}
        </span>
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-500 shrink-0",
          isOpen ? "bg-neon border-neon text-black rotate-180" : "bg-white/5 border-white/10 text-white"
        )}>
          {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </div>
      </button>

      <div className={cn(
        "grid transition-all duration-500 ease-in-out",
        isOpen ? "grid-rows-[1fr] opacity-100 pb-8" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden px-8">
          <p className="text-neutral-400 text-lg leading-relaxed font-medium max-w-3xl">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
