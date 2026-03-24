"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  Music, 
  Calendar, 
  ArrowRight, 
  Play, 
  FileText, 
  AlertCircle, 
  ChevronRight,
  Plus,
  Minus,
  HelpCircle,
  Zap,
  Globe,
  Settings,
  Headphones,
  Download,
  ScrollText,
  Clock,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function BusinessMusicPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-neon/30 selection:text-neon overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/business_music.png"
          alt="Business Music Hero"
          fill
          className="object-cover brightness-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center space-y-8">
          <Badge className="bg-neon text-black hover:bg-neon/90 px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest animate-fade-in">
            Профессиональное аудио-оформление
          </Badge>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.85] text-white">
            Музыка для <span className="text-neon outline-text">бизнеса</span>
          </h1>
          
          <p className="text-2xl md:text-3xl text-neutral-300 font-medium max-w-4xl mx-auto leading-tight">
            Легально. Безопасно. Под ключ. Идеально для кафе, ресторанов, ритейла, офисов и фитнес-центров.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
            <Link href="/register">
              <Button className="h-16 px-10 bg-neon text-black hover:scale-105 transition-all text-lg font-black uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(92,243,135,0.4)]">
                Попробовать 14 дней бесплатно
              </Button>
            </Link>
            <Link href="/images/sample-license.pdf" target="_blank">
              <Button variant="outline" className="h-16 px-10 border-white/20 text-white hover:bg-white/5 transition-all text-lg font-black uppercase tracking-widest rounded-2xl backdrop-blur-md">
                <Download className="w-5 h-5 mr-3" />
                Скачать пример лицензии
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center p-1">
            <div className="w-1 h-2 bg-white rounded-full" />
          </div>
        </div>
      </section>

      {/* Legal Importance Section */}
      <section className="px-6 py-24 md:py-32">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Юридическая справка</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-white leading-[0.9]">
              Почему это важно <br /><span className="text-neon">для вашего бизнеса?</span>
            </h2>
            <div className="space-y-6">
              <div className="p-8 rounded-[2rem] bg-red-500/5 border border-red-500/10 space-y-4">
                <h3 className="text-xl font-black uppercase text-red-500">Проблема</h3>
                <p className="text-neutral-400 leading-relaxed font-medium">
                  По данным ФАС и судов, штрафы за нелегальное использование музыки в общественных местах достигают <span className="text-white font-bold tracking-tight">40 000 – 300 000 рублей</span> за каждую проверку. Организации РАО и ВОИС активно проверяют заведения по всей России.
                </p>
              </div>
              <div className="p-8 rounded-[2rem] bg-neon/5 border border-neon/10 space-y-4">
                <h3 className="text-xl font-black uppercase text-neon">Решение БизнесМузыка</h3>
                <p className="text-neutral-300 leading-relaxed font-medium">
                  Мы предоставляем прямую лицензию от правообладателя. Согласно п. 2 ст. 1243 ГК РФ, при наличии прямого договора выплаты в пользу коллективных обществ (РАО/ВОИС) <span className="text-neon font-bold">не требуются</span>.
                </p>
              </div>
            </div>
          </div>
          
          <div className="glass-dark border border-white/10 rounded-[3rem] p-12 space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-neon/10 blur-[120px] rounded-full -mr-32 -mt-32 pointer-events-none" />
            <h3 className="text-2xl font-black uppercase tracking-tight text-white relative z-10">
              Полный пакет документов <br />для любой проверки
            </h3>
            <div className="grid gap-6 relative z-10">
              {[
                { title: "Лицензионный договор-оферта", desc: "Юридическое основание использования" },
                { title: "Подтверждение права (QR-код)", desc: "Для мгновенной проверки инспекторами" },
                { title: "Логи воспроизведения", desc: "Доказательство легальности каждого трека" },
                { title: "Закрывающие документы", desc: "УПД/Акт через систему ЭДО или кабинет" }
              ].map((doc, i) => (
                <div key={i} className="flex gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-neon/10 group-hover:border-neon/30 transition-all duration-300">
                    <CheckCircle2 className="w-6 h-6 text-neon" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black uppercase tracking-tight text-white group-hover:text-neon transition-colors">{doc.title}</h4>
                    <p className="text-neutral-500 text-sm font-medium">{doc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="px-6 py-24 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">Возможности тарифа <span className="text-neon">«Бизнес»</span></h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "Полная юридическая защита",
                desc: "Публичное исполнение в соответствии со ст. 1243 ГК РФ. Мы берем на себя все риски. Если вам придет претензия — мы поможем её оспорить на основании нашего договора."
              },
              {
                icon: MapPin,
                title: "Безлимитные точки вещания",
                desc: "Управляйте музыкой во всех ваших филиалах из одного кабинета. Добавляйте новые адреса («Точки вещания») без дополнительных согласований."
              },
              {
                icon: Music,
                title: "Курируемые плейлисты",
                desc: "Наши музыкальные эксперты собрали коллекции под любую задачу: от HoReCa (Лаунж, Джаз) до Ритейла (Фоновая музыка) и Офисов."
              },
              {
                icon: Calendar,
                title: "Планирование ротации",
                desc: "Настройте расписание вещания под режим работы: спокойное утро, активный обед и расслабляющий вечер."
              }
            ].map((feature, i) => (
              <div key={i} className="glass-dark border border-white/5 p-12 rounded-[2.5rem] hover:border-white/20 transition-all duration-500 group">
                <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center mb-8 group-hover:bg-neon group-hover:scale-110 transition-all duration-500">
                  <feature.icon className="w-8 h-8 text-white group-hover:text-black transition-colors" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-4">{feature.title}</h3>
                <p className="text-neutral-400 text-lg leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Advantages Table */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
              <Settings className="w-4 h-4 text-white" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Технологии</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase text-white">Технические <span className="text-neon outline-text">преимущества</span></h2>
          </div>
          
          <div className="glass-dark border border-white/10 rounded-[2.5rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 font-black uppercase tracking-widest text-[10px] text-neutral-400">
                    <th className="px-8 py-6">Функция</th>
                    <th className="px-8 py-6">Описание</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  {[
                    { label: "Офлайн-режим", desc: "Музыка не остановится, если пропадёт интернет. Плеер кэширует треки заранее." },
                    { label: "Без рекламы", desc: "Никаких голосовых вставок и джинглов радио. Только чистая лицензионная музыка." },
                    { label: "Управление громкостью", desc: "Ограничьте максимальную громкость в кабинете, чтобы персонал не мешал гостям." },
                    { label: "Электронный документооборот", desc: "Все акты и лицензии формируются автоматически и доступны в Личном кабинете." },
                    { label: "Поддержка 24/7", desc: "Помощь с настройкой оборудования и доступом по email и в мессенджерах." },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6 text-white font-bold uppercase tracking-tight whitespace-nowrap">{row.label}</td>
                      <td className="px-8 py-6 text-neutral-400">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Table */}
      <section id="pricing" className="px-6 py-24 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase text-white">Тарифные <span className="text-neon outline-text">планы</span></h2>
          </div>
          
          <div className="glass-dark border border-white/10 rounded-[2.5rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 font-black uppercase tracking-widest text-[10px] text-neutral-400">
                    <th className="px-8 py-6">Параметр</th>
                    <th className="px-8 py-6 text-white">Старт</th>
                    <th className="px-8 py-6 text-neon border-x border-white/10">Бизнес</th>
                    <th className="px-8 py-6 text-blue-500">Сеть</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-medium">
                  {[
                    { label: "Цена", start: "990 ₽/мес", biz: "1 490 ₽/мес", net: "2 990 ₽/мес" },
                    { label: "Точки вещания", start: "1 точка", biz: "3 точки", net: "Безлимитно" },
                    { label: "Качество звука", start: "128 kbps", biz: "320 kbps", net: "Lossless" },
                    { label: "Приоритет поддержки", start: "Стандарт", biz: "Приоритет", net: "Персональный менеджер" },
                    { label: "Документы", start: "Электронные", biz: "Электронные + ЭДО", net: "ЭДО + Бухгалтерия" },
                    { label: "Период оплаты", start: "每月", biz: "每月 / Год (-20%)", net: "每月 / Год (-20%)" },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-5 text-neutral-400 font-bold uppercase tracking-tight">{row.label}</td>
                      <td className="px-8 py-5 text-white">{row.start}</td>
                      <td className="px-8 py-5 text-neon font-black border-x border-white/5 tracking-wider">{row.biz}</td>
                      <td className="px-8 py-5 text-white font-bold">{row.net}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-8 bg-white/5 flex justify-center">
              <Link href="/register">
                <Button className="h-16 px-16 bg-neon text-black hover:scale-105 transition-all text-lg font-black uppercase tracking-widest rounded-2xl shadow-[0_0_30px_rgba(92,243,135,0.4)]">
                  Выбрать тариф и начать
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase text-white tracking-tighter">Как начать <span className="text-neon outline-text">работу?</span></h2>
          </div>
          
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { icon: Zap, title: "Регистрация", desc: "Создайте аккаунт на bizmusic.ru мгновенно." },
              { icon: ScrollText, title: "Оплата", desc: "Выберите тариф и оплатите подписку (карта, СБП, счёт)." },
              { icon: CheckCircle2, title: "Активация", desc: "Оплата — это акцепт оферты. Доступ открывается сразу." },
              { icon: LayoutDashboard, title: "Настройка", desc: "Добавьте точки, выберите плейлисты и включите плеер." },
              { icon: FileText, title: "Документы", desc: "Скачайте лицензию для уголка потребителя." }
            ].map((step, i) => (
              <div key={i} className="relative group overflow-hidden p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all">
                <div className="absolute top-0 right-0 p-4 text-4xl font-black text-white/5 pointer-events-none">{i+1}</div>
                <div className="w-12 h-12 rounded-xl bg-neon/10 flex items-center justify-center mb-6 group-hover:bg-neon group-hover:text-black transition-all">
                  <step.icon className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-black uppercase text-white mb-2">{step.title}</h4>
                <p className="text-neutral-500 text-sm font-medium leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-6 py-24 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">
              Частые <span className="text-neon outline-text">вопросы</span>
            </h2>
          </div>
 
          <div className="space-y-4">
            {[
              {
                q: "Гарантируете ли вы защиту от штрафов РАО?",
                a: "Да. Мы предоставляем прямую лицензию от правообладателя. Согласно ГК РФ, это освобождает от платежей в коллективные общества. Мы выдаём все документы для проверки."
              },
              {
                q: "Нужно ли подписывать бумажный договор?",
                a: "Нет. Согласно ст. 434 ГК РФ, договор заключается в электронной форме. Оплата подписки является полным акцептом. Все акты формируются автоматически."
              },
              {
                q: "Что будет, если интернет отключится?",
                a: "Наш плеер имеет встроенный кэш. Музыка продолжит играть в офлайн-режиме. Статистика синхронизируется при появлении сети."
              },
              {
                q: "Можно ли использовать свой компьютер/планшет?",
                a: "Да. Плеер работает в любом браузере (Chrome, Safari, Яндекс) на Windows, macOS, Android, iOS. Также поддерживается подключение к внешней акустике."
              },
              {
                q: "Как вы фиксируете использование музыки?",
                a: "Система автоматически логирует каждый воспроизведённый трек (время, точка, идентификатор). Эти логи являются юридическим доказательством."
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
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto glass-dark border border-white/10 rounded-[3rem] p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-neon/5 opacity-50" />
          <div className="relative z-10 space-y-8">
            <h2 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter text-white leading-none">
              Музыка, которая <br /><span className="text-neon">работает на вас</span>
            </h2>
            <p className="text-xl text-neutral-400 font-medium max-w-2xl mx-auto leading-relaxed">
              Присоединяйтесь к тысячам бизнесов, которые уже перешли на легальное и качественное звучание.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/register">
                <Button className="bg-neon text-black hover:scale-105 transition-all rounded-2xl px-12 h-16 text-lg font-black uppercase tracking-widest shadow-[0_0_30px_rgba(92,243,135,0.4)]">
                  Начать бесплатно
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" className="border-white/20 text-white rounded-2xl px-12 h-16 text-lg font-black uppercase tracking-widest hover:bg-white/5 transition-all">
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
