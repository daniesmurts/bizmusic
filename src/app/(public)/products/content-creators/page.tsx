"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  CheckCircle2, 
  XCircle,
  ShieldCheck, 
  Video, 
  Music, 
  Download, 
  ArrowRight, 
  Play, 
  Zap,
  Globe,
  Settings,
  Headphones,
  FileText,
  AlertTriangle,
  ChevronRight,
  Plus,
  Minus,
  HelpCircle,
  Monitor,
  Mic2,
  Lock,
  History,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePlayerStore, Track } from "@/store/usePlayerStore";

export default function ContentCreatorsPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const { setTrack } = usePlayerStore();

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handlePlayDemo = () => {
    const demoTrack: Track = {
      id: `demo-content-${Date.now()}`,
      title: "Creator Demo",
      artist: "Бизнес Музыка",
      fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      duration: 372,
      cover_url: "/images/mood-2.png",
    };

    setTrack(demoTrack);
  };

  return (
    <div className="flex flex-col gap-16 md:gap-24 min-h-screen bg-black text-white selection:bg-neon/30 selection:text-neon overflow-x-hidden pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden py-20 px-6">
        <Image
          src="/images/mood-2.png"
          alt="Content Creators Hero"
          fill
          className="object-cover brightness-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center space-y-8">
          <Badge className="bg-neon text-black hover:bg-neon/90 px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest animate-fade-in shadow-[0_0_15px_rgba(92,243,135,0.3)]">
            Для YouTube, VK, TikTok и подкастов
          </Badge>
          
          <h1 className="text-[clamp(2rem,10vw,4.5rem)] sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-[1.1] md:leading-[0.85] text-white">
            Контент для <span className="text-neon outline-text">блогеров</span>
          </h1>
          
          <p className="text-base md:text-2xl text-neutral-300 font-medium max-w-4xl mx-auto leading-relaxed break-words">
            Музыка для видео, подкастов и социальных сетей. Создавайте без претензий от платформ.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-14 sm:h-16 px-6 sm:px-10 bg-neon text-black hover:scale-105 transition-all text-base sm:text-lg font-black uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(92,243,135,0.4)]">
                Попробовать бесплатно
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={handlePlayDemo}
              className="w-full sm:w-auto h-14 sm:h-16 px-6 sm:px-10 border-white/20 text-white hover:bg-white/5 transition-all text-base sm:text-lg font-black uppercase tracking-widest rounded-2xl backdrop-blur-md"
            >
              <Play className="w-5 h-5 mr-2 sm:mr-3 fill-current" />
              Демо-треки
            </Button>
          </div>
        </div>
      </section>

      {/* Why it matters Section */}
      <section className="px-6 py-24 md:py-32">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Почему это важно?</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-white leading-[0.9]">
              Защитите свой <br /><span className="text-neon">контент и доход</span>
            </h2>
            <div className="space-y-6">
              <div className="p-6 md:p-8 rounded-[2rem] bg-red-500/5 border border-red-500/10 space-y-4">
                <h3 className="text-lg md:text-xl font-black uppercase text-red-500">Проблема</h3>
                <ul className="space-y-3">
                  {[
                    "Copyright Strikes: YouTube блокирует видео",
                    "TikTok удаляет контент с музыкой",
                    "VK ограничивает монетизацию",
                    "Content ID Claims: ошибки систем"
                  ].map((p, i) => (
                    <li key={i} className="flex gap-3 text-neutral-400 font-medium text-sm md:text-base">
                      <XCircle className="w-5 h-5 text-red-500/50 shrink-0 mt-0.5" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 md:p-8 rounded-[2rem] bg-neon/5 border border-neon/10 space-y-4">
                <h3 className="text-lg md:text-xl font-black uppercase text-neon">Решение БизнесМузыка</h3>
                <p className="text-neutral-300 leading-relaxed font-medium text-sm md:text-base">
                  Мы предоставляем прямую лицензию на синхронизацию (ст. 1243 ГК РФ) и гарантируем <span className="text-neon font-bold">Content ID Whitelist</span>. Все треки проверены и зарегистрированы в базах как разрешённые.
                </p>
              </div>
            </div>
          </div>
          
          {/* Rights & Licensing Grid */}
          <div className="grid grid-cols-1 gap-4 md:gap-6">
             {[
               { icon: Download, title: "Скачивание MP3/WAV", desc: "320 kbps и 44.1 kHz/16-bit без DRM-защиты для любого редактора." },
               { icon: Video, title: "Синхронизация с видео", desc: "Полное право на использование в YouTube, Reels, Stories и подкастах." },
               { icon: ShieldCheck, title: "Content ID Whitelist", desc: "Заранее регистрируем ваши видео, чтобы избежать любых блокировок." },
               { icon: Globe, title: "Все платформы", desc: "YouTube, VK, Telegram, Rutube, Дзен, Twitch и другие." }
             ].map((item, i) => (
               <div key={i} className="glass-dark border border-white/5 p-6 md:p-8 rounded-[2rem] flex gap-4 md:gap-6 group hover:border-white/10 transition-all">
                 <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-neon group-hover:text-black transition-all">
                   <item.icon className="w-5 h-5 md:w-6 md:h-6" />
                 </div>
                 <div className="space-y-1 md:space-y-2">
                   <h4 className="text-base md:text-lg font-black uppercase tracking-tight text-white group-hover:text-neon transition-colors leading-tight">{item.title}</h4>
                   <p className="text-neutral-500 text-xs md:text-sm font-medium leading-relaxed">{item.desc}</p>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="px-6 py-24 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">Для кого <span className="text-neon">этот тариф</span></h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "YouTube-блогеры", items: ["Влоги и обзоры", "Образовательный контент", "Развлекательные видео"], badge: "Монетизация ✅" },
              { title: "SMM-специалисты", items: ["Stories и Reels", "Рекламные креативы", "Корпоративные аккаунты"], badge: "Коммерция ✅" },
              { title: "Подкастеры", items: ["Интро и аутро", "Фоновая музыка", "Джинглы"], badge: "Без претензий ✅" },
              { title: "Видеомейкеры", items: ["Свадебные видео", "Корпоративные ролики", "Презентации"], badge: "Профи качество ✅" }
            ].map((box, i) => (
              <div key={i} className="glass-dark border border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-between group hover:border-white/10 transition-all min-h-[300px]">
                <div className="space-y-6">
                  <h3 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">{box.title}</h3>
                  <ul className="space-y-3">
                    {box.items.map((item, j) => (
                      <li key={j} className="flex gap-2 items-center text-neutral-400 text-sm font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-neon/40" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8 pt-6 border-t border-white/5">
                  <span className="text-neon font-black uppercase tracking-widest text-[10px]">{box.badge}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dos and Don'ts Section */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="glass-dark border border-neon/20 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-neon/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 text-neon" />
              </div>
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white leading-tight">Можно</h3>
            </div>
            <ul className="space-y-4">
              {[
                "Использовать в видео на YouTube, VK, Telegram, Rutube",
                "Монетизировать контент (на тарифах Про и Студия)",
                "Использовать в коммерческих проектах клиентов (Студия)",
                "Редактировать трек (обрезать, накладывать эффекты)",
                "Использовать в подкастах и аудиокнигах"
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-neutral-300 font-medium text-sm md:text-base">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon mt-2.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="glass-dark border border-red-500/20 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <Minus className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
              </div>
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white leading-tight">Нельзя</h3>
            </div>
            <ul className="space-y-4">
              {[
                "Перепродавать музыку как отдельный файл",
                "Размещать треки в стоках (AudioJungle, Pond5 и т.д.)",
                "Использовать для создания конкурентных сервисов",
                "Передавать доступ третьим лицам (кроме клиентов Студии)"
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-neutral-300 font-medium text-sm md:text-base">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Protection Guarantee */}
      <section className="px-6 py-24 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto glass-dark border border-white/10 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-20 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-40 bg-neon/5 blur-[120px] rounded-full -mr-40 -mt-40 pointer-events-none" />
          
          <div className="grid lg:grid-cols-2 gap-16 relative z-10">
            <div className="space-y-8">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] bg-neon flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(92,243,135,0.4)]">
                <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-black border-none" />
              </div>
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none">Гарантия <br /><span className="text-neon outline-text">защиты</span></h2>
              <p className="text-lg md:text-xl text-neutral-400 font-medium leading-relaxed">
                Если пришла претензия (Copyright Claim), мы решим вопрос в течение 24-48 часов или вернём 100% средств.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="mailto:daniel@boadtech.com" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto h-14 bg-white text-black hover:bg-neutral-200 transition-all font-black uppercase tracking-widest rounded-xl px-10">
                    Написать нам
                  </Button>
                </Link>
                <Link href="/about#contact" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto h-14 border-white/20 text-white hover:bg-white/5 transition-all font-black uppercase tracking-widest rounded-xl px-10">
                    Консультация
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="bg-black/40 border border-white/5 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] space-y-8">
              <h3 className="text-2xl font-black uppercase text-white border-b border-white/5 pb-6">Наша гарантия</h3>
              <div className="space-y-6">
                {[
                  "100% возврат средств, если не сможем снять претензию",
                  "Юридическая поддержка при спорах с платформами",
                  "Приоритетная обработка для тарифов Про и Студия"
                ].map((text, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-neon/10 flex items-center justify-center shrink-0 group-hover:bg-neon transition-all">
                      <CheckCircle2 className="w-5 h-5 text-neon group-hover:text-black transition-all" />
                    </div>
                    <p className="text-neutral-300 font-bold uppercase tracking-tight text-sm flex items-center">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase text-white tracking-tighter">Популярные <span className="text-neon outline-text">категории</span></h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Для влогов", items: ["Lo-Fi Hip Hop", "Acoustic Guitar", "Chill Pop"], icon: Video },
              { title: "Для обзоров", items: ["Electronic Background", "Minimal Techno", "Indie Rock"], icon: Monitor },
              { title: "Для подкастов", items: ["Jazz Lounge", "Ambient", "Neo-Soul"], icon: Headphones },
              { title: "Для рекламы", items: ["Upbeat Pop", "Corporate", "Energetic House"], icon: Zap }
            ].map((cat, i) => (
              <div key={i} className="glass-dark border border-white/5 p-8 rounded-[2rem] hover:border-neon/30 transition-all group">
                <cat.icon className="w-10 h-10 text-neon mb-6" />
                <h4 className="text-xl font-black uppercase text-white mb-6 underline decoration-neon/20 underline-offset-8 decoration-2">{cat.title}</h4>
                <div className="flex flex-wrap gap-2">
                  {cat.items.map((tag, j) => (
                    <Badge key={j} variant="outline" className="border-white/10 text-neutral-400 capitalize">{tag}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="px-6 py-24 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase text-white tracking-tighter">Как это <span className="text-neon">работает</span></h2>
          </div>
          
          <div className="flex flex-wrap items-start justify-center gap-12 lg:gap-24 relative">
             <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -translate-y-1/2 hidden lg:block" />
            {[
              { step: "01", title: "Выберите трек", desc: "Фильтры по настроению, жанру и BPM." },
              { step: "02", title: "Скачайте файл", desc: "MP3 или WAV в высоком качестве." },
              { step: "03", title: "Смонтируйте", desc: "Используйте в любом редакторе." },
              { step: "04", title: "Опубликуйте", desc: "Никаких претензий от Content ID!" }
            ].map((item, i) => (
              <div key={i} className="relative z-10 text-center space-y-6 max-w-[200px]">
                <div className="w-16 h-16 rounded-full bg-black border-2 border-neon text-neon flex items-center justify-center text-xl font-black mx-auto shadow-[0_0_20px_rgba(92,243,135,0.2)]">
                  {item.step}
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-black uppercase tracking-tight text-white">{item.title}</h4>
                  <p className="text-neutral-500 text-sm font-medium leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">
              Частые <span className="text-neon outline-text">вопросы</span>
            </h2>
          </div>
 
          <div className="space-y-4">
            {[
              {
                q: "Можно ли использовать музыку для клиентских проектов?",
                a: "Да, на тарифах «Блогер Про» и «Студия» разрешено коммерческое использование. На тарифе «Студия» можно создавать контент для неограниченного числа клиентов."
              },
              {
                q: "Нужно ли указывать автора в описании?",
                a: "Нет, это не обязательно. Но мы будем благодарны, если вы добавите «Music by БизнесМузыка» — это помогает другим создателям найти легальную музыку."
              },
              {
                q: "Что делать, если YouTube всё равно заблокировал видео?",
                a: "Свяжитесь с нами в течение 24 часов. Мы проверим регистрацию трека в Content ID и снимем претензию. Если не получится — вернём деньги за месяц."
              },
              {
                q: "Можно ли использовать музыку в TikTok?",
                a: "Да, все треки можно использовать в TikTok. Однако TikTok имеет свою библиотеку музыки, поэтому рекомендуем загружать видео через десктопную версию."
              },
              {
                q: "Как долго действует лицензия?",
                a: "Лицензия действует бессрочно для уже опубликованного контента. Если вы использовали трек, пока была активна подписка, видео может оставаться на платформе навсегда."
              },
              {
                q: "Можно ли редактировать треки?",
                a: "Да! Вы можете обрезать, замедлять, ускорять, накладывать эффекты — делайте что угодно для вашего проекта."
              }
            ].map((item, i) => (
              <div 
                key={i}
                className={cn(
                  "group border rounded-[2rem] overflow-hidden transition-all duration-500",
                  activeFaq === i ? "bg-white/[0.03] border-neon/30 ring-1 ring-neon/10" : "bg-white/[0.02] border-white/5 hover:border-white/10"
                )}
              >
                <button 
                  onClick={() => toggleFaq(i)}
                  className="w-full px-8 py-8 flex items-center justify-between gap-4 text-left"
                >
                  <span className={cn(
                    "text-lg md:text-xl font-black uppercase tracking-tight transition-colors duration-300",
                    activeFaq === i ? "text-neon" : "text-white group-hover:text-white/80"
                  )}>
                    {item.q}
                  </span>
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-500 shrink-0",
                    activeFaq === i ? "bg-neon border-neon text-black rotate-180" : "bg-white/5 border-white/10 text-white"
                  )}>
                    {activeFaq === i ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                </button>
                
                <div className={cn(
                  "grid transition-all duration-500 ease-in-out",
                  activeFaq === i ? "grid-rows-[1fr] opacity-100 pb-8" : "grid-rows-[0fr] opacity-0"
                )}>
                  <div className="overflow-hidden px-8">
                    <p className="text-neutral-400 text-lg leading-relaxed font-medium max-w-3xl">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-12 md:py-24 pb-32">
        <div className="max-w-4xl mx-auto glass-dark border border-white/10 rounded-[2.5rem] md:rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-neon/5 opacity-50" />
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-white leading-tight">
              Создавай <br /><span className="text-neon outline-text">без границ</span>
            </h2>
            <p className="text-lg md:text-xl text-neutral-400 font-medium max-w-2xl mx-auto leading-relaxed">
              Присоединяйтесь к тысячам блогеров, которые выбрали свободу от музыкальных претензий.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link href="/register" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-16 px-12 bg-neon text-black hover:scale-105 transition-all rounded-2xl text-lg font-black uppercase tracking-widest shadow-[0_0_30px_rgba(92,243,135,0.4)]">
                  Начать бесплатно
                </Button>
              </Link>
              <Link href="/about#contact" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto h-16 px-12 border-white/20 text-white rounded-2xl text-lg font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                  Консультация
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
