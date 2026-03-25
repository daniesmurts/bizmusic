"use client";

import React from "react";
import Link from "next/link";
import { 
  ChevronLeft, 
  Mic, 
  Zap, 
  CreditCard, 
  Info, 
  ShieldCheck, 
  Clock, 
  BarChart3,
  MessageSquare,
  HelpCircle,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VoiceAnnouncementsKnowledgePage() {
  return (
    <div className="space-y-10 pb-20 animate-fade-in relative">
      {/* Decorative Gradients */}
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] bg-neon/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-6 px-2 sm:px-4">
        <Link href="/knowledge" className="hover:text-neon transition-colors">База знаний</Link>
        <span className="opacity-30">/</span>
        <span className="text-white">Голосовые объявления</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-12 h-12 bg-neon/10 rounded-2xl flex items-center justify-center border border-neon/20">
               <Mic className="w-6 h-6 text-neon" />
             </div>
             <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white">
               Голосовые <span className="text-neon">объявления</span>
             </h2>
          </div>
          <p className="text-neutral-400 font-medium text-xs sm:text-sm italic max-w-2xl">
            Подробное руководство по использованию сервиса синтеза речи, помощи ИИ и управлению токенами.
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
                 <Zap className="w-5 h-5 text-neon" /> Описание функции
               </h3>
               <p className="text-neutral-400 leading-relaxed font-medium">
                 Функция синтеза речи позволяет создавать голосовые объявления, рекламные сообщения и аудио‑анонсы для вашего пространства. 
                 Вы пишете текст (до 500 символов), а система преобразует его в готовый аудиофайл, который можно использовать в плейлистах, 
                 трансляциях или скачать.
               </p>
             </div>
          </section>

          {/* Section: AI Assist */}
          <section className="glass-dark border border-white/10 rounded-[2.5rem] p-8 sm:p-10 space-y-6 relative overflow-hidden bg-gradient-to-br from-violet-950/20 to-transparent">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <Sparkles className="w-32 h-32 text-violet-400" />
             </div>
             
             <div className="relative z-10 space-y-6">
               <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-violet-400" /> Помощь ИИ в создании текста
               </h3>
               <p className="text-neutral-400 leading-relaxed font-medium">
                 Чтобы сделать текст объявления более чётким, убедительным или просто быстрее его составить, вы можете воспользоваться встроенной помощью искусственного интеллекта. 
                 Нажмите кнопку <span className="text-violet-400 font-bold">«✨ Улучшить с ИИ»</span> – и система предложит отредактированный вариант вашего текста, соблюдая лимит в 500 символов. 
                 Вы сможете принять предложение, доработать его вручную и затем использовать для синтеза речи.
               </p>

               <div className="space-y-4 pt-4 border-t border-white/5">
                 <h4 className="text-sm font-black uppercase tracking-widest text-white border-l-2 border-violet-500 pl-4">Квоты на использование ИИ‑помощи</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                    {[
                      { plan: "Бизнес", count: "5" },
                      { plan: "Бизнес+", count: "10" },
                      { plan: "Контент", count: "2" }
                    ].map((item) => (
                      <div key={item.plan} className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                        <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">{item.plan}</p>
                        <p className="text-2xl font-black text-white mt-1">{item.count}</p>
                        <p className="text-[8px] text-violet-400 font-black uppercase tracking-widest mt-1">улучшений</p>
                      </div>
                    ))}
                 </div>
                 <p className="text-[11px] text-neutral-500 font-medium italic">
                   Бесплатные улучшения не переносятся на следующий месяц – они обнуляются в начале нового расчётного периода.
                 </p>
               </div>

               <div className="bg-violet-500/5 border border-violet-500/10 rounded-2xl p-4 flex items-start gap-3">
                 <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                 <p className="text-[11px] text-neutral-400 font-medium leading-relaxed">
                   Если вы исчерпали бесплатные улучшения, каждое дополнительное использование ИИ‑помощи стоит <span className="text-violet-400 font-bold">1 токен</span>. 
                   Токены для этого берутся из ваших приобретённых пакетов. ИИ‑помощь не создаёт аудио автоматически – за последующий синтез речи также списывается 1 токен (или используется бесплатная генерация).
                 </p>
               </div>
             </div>
          </section>

          {/* Section: Quotas */}
          <section id="quotas" className="glass-dark border border-white/10 rounded-[2.5rem] p-8 sm:p-10 space-y-8">
             <div className="space-y-6">
               <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                 <BarChart3 className="w-5 h-5 text-neon" /> Квоты и токены
               </h3>
               
               <div className="space-y-4">
                 <h4 className="text-sm font-black uppercase tracking-widest text-white border-l-2 border-neon pl-4">Включённые генерации</h4>
                 <p className="text-neutral-400 text-sm leading-relaxed">
                   В зависимости от вашего тарифа вы получаете определённое количество бесплатных генераций в месяц.
                 </p>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    {[
                      { plan: "Бизнес", count: "30" },
                      { plan: "Бизнес+", count: "100" },
                      { plan: "Контент", count: "10" }
                    ].map((item) => (
                      <div key={item.plan} className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                        <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">{item.plan}</p>
                        <p className="text-2xl font-black text-white mt-1">{item.count}</p>
                        <p className="text-[8px] text-neon/60 font-black uppercase tracking-widest mt-1">генераций</p>
                      </div>
                    ))}
                 </div>
                 
                 <div className="bg-neon/5 border border-neon/10 rounded-2xl p-4 flex items-start gap-3">
                   <Info className="w-4 h-4 text-neon shrink-0 mt-0.5" />
                   <p className="text-[11px] text-neutral-400 font-medium leading-relaxed">
                     <span className="text-neon font-bold uppercase tracking-widest">Обратите внимание:</span> Включённые генерации не переносятся на следующий месяц – они обнуляются в начале нового расчётного периода.
                   </p>
                 </div>
               </div>

               <div className="space-y-4 pt-4 border-t border-white/5">
                 <h4 className="text-sm font-black uppercase tracking-widest text-white border-l-2 border-indigo-500 pl-4">Пакеты токенов</h4>
                 <p className="text-neutral-400 text-sm leading-relaxed">
                   Если вы использовали все бесплатные генерации, можно докупить пакеты токенов.
                 </p>
                 
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { tokens: "5", price: "150 ₽" },
                      { tokens: "10", price: "280 ₽" },
                      { tokens: "25", price: "625 ₽" },
                      { tokens: "50", price: "1 150 ₽" }
                    ].map((item) => (
                      <div key={item.tokens} className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center group hover:border-neon/30 transition-all">
                        <p className="text-xl font-black text-white">{item.tokens} токенов</p>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{item.price}</p>
                      </div>
                    ))}
                 </div>

                 <p className="text-[11px] text-neutral-500 font-medium italic">
                   Токены не сгорают в конце месяца. Приобретённые пакеты действуют до тех пор, пока вы их не израсходуете, даже если вы смените тариф.
                 </p>
               </div>
             </div>
          </section>

          {/* Section: Consumption Logic */}
          <section className="glass-dark border border-white/10 rounded-[2.5rem] p-8 sm:p-10 space-y-6">
             <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
               <CreditCard className="w-5 h-5 text-neon" /> Как расходуются токены
             </h3>
             <ul className="space-y-4">
               <li className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                 <div className="w-8 h-8 rounded-lg bg-neon/10 flex items-center justify-center text-neon font-black italic">1</div>
                 <div className="space-y-1">
                   <p className="text-sm font-black text-white uppercase tracking-tight">1 генерация = 1 токен</p>
                   <p className="text-[11px] text-neutral-400 leading-relaxed font-medium capitalize">Независимо от того, какой движок синтеза речи используется (Google или Salute).</p>
                 </div>
               </li>
               <li className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                 <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 font-black italic">2</div>
                 <div className="space-y-1">
                   <p className="text-sm font-black text-white uppercase tracking-tight">1 ИИ-улучшение = 1 токен</p>
                   <p className="text-[11px] text-neutral-400 leading-relaxed font-medium capitalize">Каждое дополнительное обращение к ИИ-помощнику сверх бесплатного лимита списывает 1 токен.</p>
                 </div>
               </li>
               <li className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                 <div className="w-8 h-8 rounded-lg bg-neon/10 flex items-center justify-center text-neon font-black italic">3</div>
                 <div className="space-y-1">
                   <p className="text-sm font-black text-white uppercase tracking-tight">Лимит 500 символов</p>
                   <p className="text-[11px] text-neutral-400 leading-relaxed font-medium">Включая пробелы и знаки препинания. Если текст длиннее, токен не будет списан, и система выдаст предупреждение.</p>
                 </div>
               </li>
               <li className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 shadow-lg shadow-neon/5">
                 <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black italic">4</div>
                 <div className="space-y-1">
                   <p className="text-sm font-black text-white uppercase tracking-tight">Смена тарифа</p>
                   <p className="text-[11px] text-neutral-400 leading-relaxed font-medium">При апгрейде или даунгрейде ваши купленные токены всегда сохраняются.</p>
                 </div>
               </li>
             </ul>
          </section>

          {/* Section: Examples */}
          <section className="glass-dark border border-white/10 rounded-[2.5rem] p-8 sm:p-10 space-y-6 bg-gradient-to-br from-neutral-900 to-indigo-950/20">
             <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
               <Info className="w-5 h-5 text-indigo-400" /> Примеры
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-neon uppercase tracking-widest">Сценарий 1</p>
                  <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                    У вас тариф <span className="text-white font-bold">«Бизнес»</span> (30 генераций, 5 улучшений ИИ). Вы использовали 3 улучшения и 20 генераций. Покупаете пакет 10 токенов. Остаток: 2 бесплатных улучшения + 10 бесплатных генераций + 10 токенов. При создании ещё 15 генераций: сначала спишутся 10 бесплатных, затем 5 из купленных.
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Сценарий 2</p>
                  <p className="text-xs text-neutral-400 leading-relaxed font-medium">
                    У вас тариф <span className="text-white font-bold">«Бизнес+»</span> (100 генераций, 10 улучшений) и 20 токенов. Переходите на <span className="text-white font-bold">«Бизнес»</span>. Купленные 20 токенов остаются, а бесплатные лимиты становятся 30 генераций и 5 улучшений ИИ на месяц.
                  </p>
                </div>
             </div>
          </section>

          {/* Section: Technologies */}
          <section className="glass-dark border border-white/10 rounded-[2.5rem] p-8 sm:p-10 space-y-6">
             <h3 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
               <ShieldCheck className="w-5 h-5 text-neon" /> Почему мы используем разные технологии
             </h3>
             <p className="text-neutral-400 text-sm leading-relaxed font-medium">
                Мы задействуем несколько сервисов синтеза речи (<span className="text-white font-bold">Sber Salute</span>, <span className="text-white font-bold">Google TTS</span>), 
                чтобы обеспечить стабильность и разнообразие голосов. Для вас это абсолютно прозрачно: всегда 1 генерация = 1 токен.
             </p>
             <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-red-400">Важно</h4>
                <p className="text-[11px] text-neutral-500 font-medium leading-relaxed">
                  Все генерации подчиняются правилам использования сервиса. Не допускается создание контента, нарушающего законодательство или наши правила.
                </p>
             </div>
          </section>
        </div>

        {/* Sidebar / Quick Jump */}
        <aside className="space-y-6">
          <div className="glass-dark border border-white/10 rounded-[2.5rem] p-8 sticky top-8">
            <h4 className="text-sm font-black uppercase tracking-widest text-white mb-6">Поддержка</h4>
            <div className="space-y-4">
              <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                Если у вас возникли вопросы по списанию токенов или квотам, мы поможем разобраться.
              </p>
              <Button className="w-full bg-white/5 border border-white/10 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] h-12 hover:bg-neon hover:text-black hover:border-neon transition-all">
                Связаться с нами
              </Button>
            </div>
            
            <div className="mt-10 pt-10 border-t border-white/5 space-y-4">
              <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Другие темы</p>
              <nav className="flex flex-col gap-2">
                {[
                  { name: "Настройка плеера", href: "#" },
                  { name: "Оплата и документы", href: "#" },
                  { name: "Публикация контента", href: "#" }
                ].map((item) => (
                  <Link key={item.name} href={item.href} className="text-[11px] font-bold text-neutral-400 hover:text-neon transition-colors">
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
