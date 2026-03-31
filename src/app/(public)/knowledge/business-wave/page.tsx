"use client";

import React from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  Activity, 
  Zap, 
  Settings, 
  Info, 
  ShieldCheck, 
  Clock, 
  TrendingUp,
  MessageSquare,
  HelpCircle,
  Sparkles,
  Waves,
  Music,
  Sliders
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BusinessWaveKnowledgePage() {
  return (
    <div className="space-y-10 pb-20 animate-fade-in relative">
      {/* Decorative Gradients */}
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] bg-neon/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-6 px-2 sm:px-4">
        <Link href="/knowledge" className="hover:text-neon transition-colors">База знаний</Link>
        <span className="opacity-30">/</span>
        <span className="text-white">Бизнес-Волна</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-12 h-12 bg-neon/10 rounded-2xl flex items-center justify-center border border-neon/20">
               <Waves className="w-6 h-6 text-neon" />
             </div>
             <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white">
               Бизнес <span className="text-neon">Волна</span>
             </h2>
          </div>
          <p className="text-neutral-400 font-medium text-xs sm:text-sm italic max-w-2xl">
            Руководство по использованию адаптивного музыкального потока, управляемого ИИ.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section: Overview */}
          <section className="glass-dark border border-white/10 rounded-[2.5rem] p-8 sm:p-10 space-y-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <Zap className="w-32 h-32" />
             </div>
             
             <div className="relative z-10 space-y-6">
               <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                 <Zap className="w-5 h-5 text-neon" /> Что такое Бизнес-Волна?
               </h3>
               <p className="text-neutral-400 leading-relaxed font-medium">
                 Обычные алгоритмы стриминговых сервисов обучаются на персональных вкусах слушателя. 
                 Бизнес-Волна — это специализированный ИИ-поток, разработанный для коммерческих пространств. 
                 Вместо того чтобы подстраиваться под личные предпочтения владельца, система анализирует параметры атмосферы вашего бизнеса и подбирает треки, 
                 поддерживающие правильный настрой ваших клиентов и сотрудников.
               </p>
             </div>
          </section>

          {/* Section: Controls */}
          <section className="glass-dark border border-white/10 rounded-[2.5rem] p-8 sm:p-10 space-y-6 relative overflow-hidden bg-gradient-to-br from-indigo-950/20 to-transparent">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <Sliders className="w-32 h-32 text-indigo-400" />
             </div>
             
             <div className="relative z-10 space-y-6">
               <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                 <Sliders className="w-5 h-5 text-indigo-400" /> Управляемый ИИ: Никаких «черных ящиков»
               </h3>
               <p className="text-neutral-400 leading-relaxed font-medium">
                 Мы даем вам реальные рычаги управления эфиром. Вместо того чтобы гадать, что включит алгоритм, 
                 вы задаете четкие параметры через панель управления в реальном времени.
               </p>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="space-y-3 p-5 bg-white/5 border border-white/5 rounded-3xl">
                    <Activity className="w-5 h-5 text-blue-400 mb-2" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-white">Уровень энергии</h4>
                    <p className="text-[11px] text-neutral-500 leading-relaxed font-medium">
                      Позволяет регулировать интенсивность музыки от «Спокойно» до «Драйв». 
                      Идеально для переключения атмосферы с умиротворенного завтрака на энергичный ланч.
                    </p>
                  </div>
                  <div className="space-y-3 p-5 bg-white/5 border border-white/5 rounded-3xl">
                    <Music className="w-5 h-5 text-purple-400 mb-2" />
                    <h4 className="text-sm font-black uppercase tracking-widest text-white">Вокальный баланс</h4>
                    <p className="text-[11px] text-neutral-500 leading-relaxed font-medium">
                      Выбирайте только инструментальные треки для глубокой концентрации, вокальные композиции для оживления атмосферы или сбалансированный микс.
                    </p>
                  </div>
               </div>
             </div>
          </section>

          {/* Section: Atmospheric Profiles */}
          <section className="glass-dark border border-white/10 rounded-[2.5rem] p-8 sm:p-10 space-y-6 relative overflow-hidden">
             <div className="relative z-10 space-y-6">
               <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-neon" /> Профили «Нейро-Фокус»
               </h3>
               <p className="text-neutral-400 leading-relaxed font-medium">
                 Для максимальной простоты мы подготовили преднастроенные профили, оптимизированные под разные сценарии вашего бизнеса.
               </p>

               <div className="space-y-4">
                 {[
                   { title: "Утренний Кофе", time: "Morning", desc: "Легкая, пробуждающая музыка с мягкими переходами." },
                   { title: "Дневной Час-пик", time: "Lunch", desc: "Тенденциозный ритм, поддерживающий динамику клиентского потока." },
                   { title: "Вечерний Лаунж", time: "Evening", desc: "Глубокая, обволакивающая атмосфера для расслабленного ужина." }
                 ].map((profile) => (
                   <div key={profile.title} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-neon/20 transition-all">
                     <div className="space-y-1">
                       <p className="text-xs font-black text-white uppercase tracking-tight">{profile.title}</p>
                       <p className="text-[10px] text-neutral-500 font-medium">{profile.desc}</p>
                     </div>
                     <span className="text-[9px] font-black uppercase tracking-widest text-neon bg-neon/10 px-3 py-1 rounded-full">{profile.time}</span>
                   </div>
                 ))}
               </div>
             </div>
          </section>

          {/* Section: Technology (JIT) */}
          <section className="glass-dark border border-white/10 rounded-[2.5rem] p-8 sm:p-10 space-y-8">
             <div className="space-y-6">
               <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                 <TrendingUp className="w-5 h-5 text-blue-400" /> Технологии: JIT Micro-Batching
               </h3>
               <p className="text-neutral-400 leading-relaxed font-medium">
                 В отличие от традиционных систем, Бизнес-Волна работает по технологии **JIT (Just-In-Time)**. Система не создает плейлист на часы вперед — 
                 она генерирует эфир короткими партиями по 20 треков, мгновенно реагируя на ваши изменения в панели управления.
               </p>
               
               <div className="space-y-4 pt-4 border-t border-white/5">
                 <h4 className="text-sm font-black uppercase tracking-widest text-white border-l-2 border-neon pl-4">Алгоритм взвешенного скоринга</h4>
                 <ul className="space-y-3">
                   <li className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-lg bg-neon/10 flex items-center justify-center text-neon font-black text-[10px]">1</div>
                      <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                        <span className="text-white font-bold">Фильтрация:</span> Сначала отсекаются треки, не подходящие по юридическим правам или временным меткам.
                      </p>
                   </li>
                   <li className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-lg bg-neon/10 flex items-center justify-center text-neon font-black text-[10px]">2</div>
                      <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                        <span className="text-white font-bold">Рейтинг:</span> Оставшиеся треки получают баллы (0-100) в зависимости от близости их параметров к вашим текущим настройкам.
                      </p>
                   </li>
                   <li className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-lg bg-neon/10 flex items-center justify-center text-neon font-black text-[10px]">3</div>
                      <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                        <span className="text-white font-bold">Диверсификация:</span> Система следит, чтобы в эфире не повторялись одни и те же артисты слишком часто.
                      </p>
                   </li>
                 </ul>
               </div>
             </div>
          </section>

          {/* Section: Reliability */}
          <section className="glass-dark border border-white/10 rounded-[2.5rem] p-8 sm:p-10 space-y-6">
             <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
               <ShieldCheck className="w-5 h-5 text-neon" /> Надежность и кэширование
             </h3>
             <p className="text-neutral-400 text-sm leading-relaxed font-medium">
                Бизнес-Волна автоматически подгружает следующие 10 треков в локальное хранилище вашего устройства (IndexedDB). 
                Даже если интернет-соединение пропадет, эфир продолжится непрерывно, а отчеты о проигрывании синхронизируются позже.
             </p>
             <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-400/20 rounded-xl flex items-center justify-center border border-blue-400/30 shrink-0">
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-1">Мгновенные изменения</h4>
                  <p className="text-[10px] text-neutral-500 font-medium leading-relaxed">
                    Любое изменение в панели управления (Energy/Profile) применяется с начала следующего трека в очереди.
                  </p>
                </div>
             </div>
          </section>
        </div>

        {/* Sidebar / Quick Jump */}
        <aside className="space-y-6">
          <div className="glass-dark border border-white/10 rounded-[2.5rem] p-8 sticky top-8">
            <h4 className="text-sm font-black uppercase tracking-widest text-white mb-6">Как включить</h4>
            <div className="space-y-4">
              <p className="text-xs text-neutral-500 font-medium leading-relaxed italic">
                Перейдите в раздел Плеер вашего дашборда и найдите виджет с анимированной волной в верхней части страницы.
              </p>
              <Link href="/dashboard/player" className="w-full">
                <Button className="w-full bg-neon text-black rounded-xl font-black uppercase tracking-widest text-[10px] h-12 shadow-xl shadow-neon/20 hover:scale-105 transition-all">
                  Открыть плеер
                </Button>
              </Link>
            </div>
            
            <div className="mt-10 pt-10 border-t border-white/5 space-y-4">
              <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Читайте также</p>
              <nav className="flex flex-col gap-2 transition-all">
                {[
                  { name: "Быстрый старт плеера", href: "#" },
                  { name: "Голосовые анонсы", href: "/knowledge/voice-announcements" },
                  { name: "AI Ассистент", href: "/knowledge/ai-assist" }
                ].map((item) => (
                  <Link key={item.name} href={item.href} className="text-[11px] font-bold text-neutral-400 hover:text-neon transition-colors flex items-center gap-2">
                    <div className="w-1 h-1 bg-neutral-800 rounded-full" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
