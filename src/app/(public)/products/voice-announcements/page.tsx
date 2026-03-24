"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Minus, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  HelpCircle,
  Mic2,
  Volume2,
  Calendar,
  Layers,
  BarChart3,
  Split,
  Globe,
  AlertTriangle,
  Play
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { usePlayerStore, Track } from "@/store/usePlayerStore";

export default function VoiceAnnouncementsPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const { setTrack } = usePlayerStore();

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handlePlayDemo = () => {
    const demoTrack: Track = {
      id: `demo-voice-${Date.now()}`,
      title: "Voice Demo",
      artist: "Бизнес Музыка",
      fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      duration: 372,
      cover_url: "/images/voice_announcements.png",
    };

    setTrack(demoTrack);
  };

  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-20 animate-fade-in relative z-0">
      {/* Dynamic Backgrounds */}
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] bg-neon/15 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center px-6 md:px-12 py-12 md:py-20 overflow-hidden rounded-[2.5rem] md:rounded-[3.5rem] mx-4 md:mx-6 border border-white/5 bg-black/40 backdrop-blur-xl">
        <Image
          src="/images/voice_announcements.png"
          alt="Voice Announcements"
          fill
          className="object-cover brightness-[0.3]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        
        <div className="relative z-10 max-w-3xl space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon/30 bg-neon/10 backdrop-blur-md">
            <Mic2 className="w-4 h-4 text-neon fill-neon" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-neon">Дополнительный сервис</span>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-7xl md:text-8xl font-black uppercase tracking-tighter leading-[0.95] md:leading-[0.9] text-white">
              Голосовые <br />
              <span className="text-neon outline-text">объявления</span>
            </h1>
            <p className="text-xl md:text-2xl text-neutral-300 font-medium leading-relaxed max-w-2xl">
              Автоматически объявляйте об акциях, скидках и важных новостях — прямо в вашем помещении. 
              Без участия персонала, без технических сложностей.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <Link href="/register" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-neon text-black hover:scale-105 transition-all rounded-2xl px-12 h-16 text-lg font-black uppercase tracking-widest shadow-[0_0_30px_rgba(92,243,135,0.4)]">
                Создать объявление за 99 ₽
              </Button>
            </Link>
            <Button onClick={handlePlayDemo} variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/5 backdrop-blur-sm rounded-2xl px-12 h-16 text-lg font-black uppercase tracking-widest gap-2">
              <Play className="w-5 h-5 fill-current" /> Послушать примеры
            </Button>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none text-white">
              Ваши клиенты <br />
              <span className="text-neon underline decoration-neon/20 underline-offset-8">пропускают акции?</span>
            </h2>
            
            <div className="space-y-6">
              {[
                "73% посетителей не замечают рекламные плакаты",
                "Персонал забывает рассказывать об акциях",
                "Клиенты уходят, не узнав о специальных предложениях"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-4 text-neutral-400 font-medium">
                  <div className="w-6 h-6 rounded-full border border-red-500/30 flex items-center justify-center text-red-500 text-xs">✕</div>
                  {text}
                </div>
              ))}
            </div>
            
            <div className="p-8 glass-dark border border-neon/20 rounded-[2.5rem] bg-neon/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 bg-neon/10 blur-[80px] rounded-full" />
              <div className="relative z-10 space-y-4">
                <h3 className="text-2xl font-black uppercase text-white flex items-center gap-3">
                  <Zap className="w-6 h-6 text-neon fill-neon" /> Решение
                </h3>
                <p className="text-neutral-300 text-lg leading-relaxed">
                  Голосовое объявление невозможно проигнорировать. Оно звучит в нужный момент, 
                  работает 24/7 и увеличивает средний чек на <span className="text-neon font-black">15-25%</span>.
                </p>
              </div>
            </div>
          </div>
          
          <div className="relative h-[400px] md:h-[600px] rounded-[3rem] overflow-hidden border border-white/5">
            <Image 
              src="/images/hero.png" 
              alt="Solution" 
              fill 
              className="object-cover grayscale hover:grayscale-0 transition-all duration-1000" 
            />
            <div className="absolute inset-0 bg-neon/10 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="px-6 md:px-12 space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">
            Как это <span className="text-neon outline-text">работает</span>
          </h2>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">Процесс создания идеального объявления</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              title: "Выберите шаблон",
              description: "Используйте готовые шаблоны («Скидка 20%», «Закрытие через 30 минут») или создайте своё.",
              step: "01"
            },
            {
              title: "Выберите голос",
              description: "AI-голоса (мгновенная генерация) или профессиональные дикторы (индивидуальная запись).",
              step: "02"
            },
            {
              title: "Настройте расписание",
              description: "Укажите частоту. Система автоматически вставит его между музыкальными треками.",
              step: "03"
            },
            {
              title: "Готово!",
              description: "Объявление начнёт работать сразу после оплаты. Отслеживайте статистику в кабинете.",
              step: "04"
            }
          ].map((item, i) => (
            <div key={i} className="p-8 glass-dark border border-white/5 rounded-[2.5rem] relative group hover:border-neon/20 transition-all">
              <div className="text-6xl font-black text-white/5 absolute top-4 right-8 group-hover:text-neon/10 transition-colors">{item.step}</div>
              <div className="relative z-10 space-y-4">
                <h3 className="text-2xl font-black uppercase tracking-tight text-white leading-none">{item.title}</h3>
                <p className="text-neutral-500 font-medium text-sm leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="px-6 md:px-12 space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">
            Тарифные <span className="text-neon">планы</span>
          </h2>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">Выберите решение под ваши задачи</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* AI Studio */}
          <div className="p-8 md:p-12 glass-dark border border-white/10 rounded-[2.5rem] md:rounded-[3.5rem] relative overflow-hidden group hover:border-neon transition-all duration-500">
            <div className="absolute top-0 right-0 p-24 bg-neon/10 blur-[120px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 space-y-10">
              <div className="space-y-2">
                <Badge variant="outline" className="text-neon border-neon/30 bg-neon/10 uppercase font-black px-4 py-1.5 rounded-full text-[10px] tracking-widest mb-4">
                  Базовый
                </Badge>
                <h3 className="text-4xl font-black uppercase text-white tracking-widest">AI Студия</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-neon">990 ₽</span>
                  <span className="text-neutral-500 font-bold uppercase text-xs tracking-widest">/ месяц</span>
                </div>
                <p className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">Или 99 ₽ за объявление</p>
              </div>

              <div className="space-y-4">
                 {[
                   "Нейронные голоса Yandex",
                   "Мгновенная генерация",
                   "10+ готовых шаблонов",
                   "Интеграция с плеером",
                   "Базовое расписание",
                   "До 10 объявлений в месяц"
                 ].map((feat, i) => (
                   <div key={i} className="flex items-center gap-3 text-white font-medium text-sm">
                     <CheckCircle2 className="w-5 h-5 text-neon" />
                     {feat}
                   </div>
                 ))}
              </div>

              <Button className="w-full bg-neon text-black rounded-2xl h-14 font-black uppercase tracking-widest hover:scale-105 transition-all">
                Создать AI-объявление
              </Button>
            </div>
          </div>

          {/* Professional */}
          <div className="p-8 md:p-12 glass-dark border border-white/10 rounded-[2.5rem] md:rounded-[3.5rem] relative overflow-hidden group hover:border-blue-500/50 transition-all duration-500">
            <div className="absolute top-0 right-0 p-24 bg-blue-500/10 blur-[120px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 space-y-10">
              <div className="space-y-2">
                <Badge variant="outline" className="text-blue-500 border-blue-500/30 bg-blue-500/10 uppercase font-black px-4 py-1.5 rounded-full text-[10px] tracking-widest mb-4">
                  Премиум
                </Badge>
                <h3 className="text-4xl font-black uppercase text-white tracking-widest">ПРОФИ</h3>
                <div className="flex items-baseline gap-2">
                   <span className="text-white font-bold text-sm tracking-widest uppercase">От</span>
                   <span className="text-5xl font-black text-white">990 ₽</span>
                   <span className="text-neutral-500 font-bold uppercase text-xs tracking-widest">/ заказ</span>
                </div>
                <p className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest">Живые голоса дикторов</p>
              </div>

              <div className="space-y-4">
                 {[
                   "Профессиональные дикторы",
                   "Индивидуальная запись",
                   "Музыкальное оформление",
                   "Срок: 24-48 часа",
                   "Исключительные права",
                   "Приоритетная поддержка"
                 ].map((feat, i) => (
                   <div key={i} className="flex items-center gap-3 text-white font-medium text-sm">
                     <CheckCircle2 className="w-5 h-5 text-blue-500" />
                     {feat}
                   </div>
                 ))}
              </div>

              <Button variant="outline" className="w-full border-white/10 text-white rounded-2xl h-14 font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                Заказать запись
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 md:px-12">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-black uppercase text-white">Возможности <span className="text-neon underline decoration-neon/20 underline-offset-8">сервиса</span></h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: Calendar, title: "Умное расписание", desc: "Утром — приветствия, днём — акции, вечером — напоминания." },
              { icon: Volume2, title: "Авто громкость", desc: "Снижаем громкость музыки во время объявления автоматически." },
              { icon: BarChart3, title: "Статистика", desc: "Отслеживайте, сколько раз прозвучало каждое объявление." },
              { icon: Split, title: "A/B тестирование", desc: "Протестируйте два варианта текста и выберите лучший." },
              { icon: Globe, title: "Мультилокация", desc: "Управляйте объявлениями во всей сети из одного кабинета." },
              { icon: AlertTriangle, title: "Экстренные", desc: "Мгновенно транслируйте важные сообщения." }
            ].map((feature, i) => (
              <div key={i} className="flex gap-6 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-neon/10 transition-colors">
                  <feature.icon className="w-6 h-6 text-neutral-400 group-hover:text-neon transition-colors" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-black uppercase text-white tracking-tight">{feature.title}</h4>
                  <p className="text-neutral-500 text-sm font-medium leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-6 md:px-12 bg-neutral-900/10 py-24 rounded-[4rem] mx-4 md:mx-6">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-black uppercase text-white">Как используют <span className="text-neon">клиенты</span></h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
             {[
               { icon: "☕", title: "Кафе", examples: ["Акция дня: десерт!", "Завтрак до 12:00", "Спросите про меню"] },
               { icon: "🛍️", title: "Ритейл", examples: ["Скидка 30%", "Примерочные открыты", "2 часа до закрытия"] },
               { icon: "💪", title: "Фитнес", examples: ["Йога через 15 мин", "Продлите абонемент", "С днём рождения!"] },
               { icon: "🏥", title: "Медицина", examples: ["Пройдите в кабинет", "Запись через 30 мин", "Акция на пакет"] }
             ].map((useCase, i) => (
               <div key={i} className="p-8 glass-dark rounded-[2.5rem] border border-white/5 space-y-6">
                 <div className="text-4xl">{useCase.icon}</div>
                 <h4 className="text-2xl font-black uppercase text-white tracking-tight">{useCase.title}</h4>
                 <div className="space-y-3">
                    {useCase.examples.map((ex, j) => (
                      <div key={j} className="text-neutral-500 text-sm font-medium italic border-l-2 border-neon/30 pl-3">
                        «{ex}»
                      </div>
                    ))}
                 </div>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-6 md:px-12">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase text-white">Сравнение <span className="text-neon outline-text">тарифов</span></h2>
          </div>
          
          <div className="glass-dark border border-white/10 rounded-[2.5rem] overflow-hidden">
            {/* Desktop Table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 font-black uppercase tracking-widest text-[10px] text-neutral-400">
                    <th className="px-8 py-6">Функция</th>
                    <th className="px-8 py-6 text-neon">AI Студия</th>
                    <th className="px-8 py-6 text-blue-500">Профессиональный</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  {[
                    { label: "Цена", ai: "99 ₽/объявление", pro: "от 990 ₽/объявление" },
                    { label: "Голос", ai: "AI (нейросеть)", pro: "Живой диктор" },
                    { label: "Срок", ai: "Мгновенно", pro: "24-48 часов" },
                    { label: "Шаблоны", ai: "10+ готовых", pro: "Индивидуально" },
                    { label: "Музыка", ai: "—", pro: "Включена" },
                    { label: "Правки", ai: "5 правок", pro: "2 правок" },
                    { label: "Эксклюзивность", ai: "Да", pro: "Да" },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-5 text-neutral-400 font-bold uppercase tracking-tight">{row.label}</td>
                      <td className="px-8 py-5 text-white">{row.ai}</td>
                      <td className="px-8 py-5 text-white">{row.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Comparison Cards */}
            <div className="md:hidden divide-y divide-white/5">
              {[
                { label: "Цена", ai: "99 ₽", pro: "от 990 ₽" },
                { label: "Голос", ai: "AI (нейросеть)", pro: "Живой диктор" },
                { label: "Срок", ai: "Мгновенно", pro: "24-48ч" },
                { label: "Правки", ai: "5 правок", pro: "2 правки" },
                { label: "Эксклюзивно", ai: "Да", pro: "Да" },
              ].map((row, i) => (
                <div key={i} className="p-6 space-y-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{row.label}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-neon uppercase">AI Студия</div>
                      <div className="text-white font-bold">{row.ai}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-blue-500 uppercase">Профи</div>
                      <div className="text-white font-bold">{row.pro}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="px-6 md:px-12 max-w-4xl mx-auto w-full space-y-16">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon/30 bg-neon/10 backdrop-blur-md">
            <HelpCircle className="w-4 h-4 text-neon" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon">Вопросы</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">
            Частые <span className="text-neon outline-text">вопросы</span>
          </h2>
        </div>
 
        <div className="space-y-4">
          {[
            {
              q: "Можно ли использовать свои тексты?",
              a: "Да! Вы можете написать любой текст (в рамках закона о рекламе). Наш AI-редактор подскажет, как сделать его эффективнее."
            },
            {
              q: "Как часто могут звучать объявления?",
              a: "Вы сами настраиваете расписание. Рекомендуем не более 3-4 объявлений в час, чтобы не перегружать посетителей."
            },
            {
              q: "Можно ли объявлять на разных языках?",
              a: "AI-студия поддерживает русский, английский, татарский и ещё 30+ языков. Профессиональные дикторы — русский и английский."
            },
            {
              q: "Что если мне не понравится запись?",
              a: "На тарифе «AI Студия» вы можете перегенерировать объявление до 5 раз. На «Профессиональном» — включено 2 бесплатные правки."
            },
            {
              q: "Нужно ли дополнительное оборудование?",
              a: "Нет! Объявления звучат через тот же плеер, что и музыка. Ничего устанавливать не нужно."
            },
            {
              q: "Можно ли отключить объявления в любое время?",
              a: "Да, вы можете приостановить или удалить любое объявление в личном кабинете."
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
                className="w-full px-6 py-6 md:px-8 md:py-8 flex items-center justify-between gap-4 text-left"
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
      </section>

      {/* Legal Notice */}
      <section className="px-6 md:px-12 pb-12">
        <div className="max-w-4xl mx-auto p-8 rounded-[2rem] bg-amber-500/5 border border-amber-500/20">
          <div className="flex gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
            <div className="space-y-3">
              <h4 className="text-xl font-black uppercase text-white tracking-tight">Важно знать</h4>
              <p className="text-neutral-400 text-sm leading-relaxed font-medium">
                Согласно ФЗ «О рекламе» (ст. 9), объявления о скидках и акциях должны содержать: <br />
                • Срок проведения акции <br />
                • Источники дополнительной информации
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="px-6 py-12">
        <div className="max-w-4xl mx-auto glass-dark border border-white/10 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-neon/5 opacity-50" />
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-white">
              Готовы <span className="text-neon underline decoration-neon/20 underline-offset-8">начать?</span>
            </h2>
            <p className="text-xl text-neutral-400 font-medium max-w-2xl mx-auto leading-relaxed">
              Увеличьте продажи вашего бизнеса уже сегодня с помощью автоматических голосовых объявлений.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link href="/register" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-neon text-black hover:scale-105 transition-all rounded-2xl px-12 h-16 text-lg font-black uppercase tracking-widest shadow-[0_0_30px_rgba(92,243,135,0.4)]">
                  Попробовать бесплатно
                </Button>
              </Link>
              <Link href="/about#contact" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto border-white/20 text-white rounded-2xl px-12 h-16 text-lg font-black uppercase tracking-widest hover:bg-white/5 transition-all">
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
