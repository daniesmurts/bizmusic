"use client";

import React from "react";
import Link from "next/link";
import { 
  BookOpen, 
  Mic, 
  Music, 
  Settings, 
  CreditCard, 
  ChevronRight,
  HelpCircle,
  FileText,
  Search,
  MessageCircle,
  Play,
  Sliders
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useState, useMemo } from "react";

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      title: "Начало работы",
      icon: Play,
      articles: [
        { title: "Быстрый старт: запуск плеера", href: "/knowledge/player-quick-start" },
        { title: "Настройка музыкального расписания", href: "/knowledge/music-scheduling-setup" }
      ]
    },
    {
      title: "Голосовые объявления",
      icon: Mic,
      articles: [
        { title: "Как работают голосовые объявления", href: "/knowledge/voice-announcements" },
        { title: "Новые функции: как это работает", href: "/knowledge/announcement-feature-updates" },
        { title: "Улучшение текста с ИИ (AI Assist)", href: "/knowledge/ai-assist" },
        { title: "Квоты и покупка токенов", href: "/knowledge/voice-announcements#quotas" }
      ]
    },
    {
      title: "Финансы и документы",
      icon: CreditCard,
      articles: [
        { title: "Управление подпиской", href: "/knowledge/subscription-management" },
        { title: "Бухгалтерские документы", href: "/knowledge/accounting-documents" }
      ]
    },
    {
      title: "Управление эфиром",
      icon: Sliders,
      articles: [
        { title: "Бизнес-Волна: Что это?", href: "/knowledge/business-wave" },
        { title: "Тайм-зона и расписание", href: "/knowledge/timezone-and-schedule" }
      ]
    }
  ];

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const lowerQuery = searchQuery.toLowerCase();
    
    return categories
      .map(cat => ({
        ...cat,
        articles: cat.articles.filter(article => 
          article.title.toLowerCase().includes(lowerQuery) || 
          cat.title.toLowerCase().includes(lowerQuery)
        )
      }))
      .filter(cat => cat.articles.length > 0 || cat.title.toLowerCase().includes(lowerQuery));
  }, [searchQuery]);

  return (
    <div className="space-y-10 pb-20 animate-fade-in relative">
      {/* Decorative Gradients */}
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] bg-neon/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-4 pt-10 pb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-neon mb-4">
           <BookOpen className="w-3 h-3" /> Справочный центр
        </div>
        <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white">
          База <span className="text-neon">знаний</span>
        </h2>
        <p className="text-neutral-500 font-medium text-sm sm:text-base italic max-w-xl">
          Все ответы на вопросы по работе сервиса, настройке оборудования и юридическим аспектам.
        </p>

        <div className="w-full max-w-2xl mt-12 relative group px-4">
           <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-600 group-focus-within:text-neon transition-colors" />
           <Input 
             placeholder="Поиск по статьям..." 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full h-16 pl-14 pr-6 bg-white/5 border-white/10 text-white rounded-[2rem] focus-visible:ring-neon focus-visible:border-neon transition-all"
           />
        </div>
      </div>

      {/* Categories Grid */}
      {filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.title} className="glass-dark border border-white/10 rounded-[2.5rem] p-8 space-y-6 hover:border-white/20 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:bg-neon/10 group-hover:border-neon/20 transition-colors">
                    <Icon className="w-6 h-6 text-neutral-500 group-hover:text-neon transition-colors" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">{category.title}</h3>
                </div>
                
                <nav className="flex flex-col gap-3">
                  {category.articles.length > 0 ? (
                    category.articles.map((article) => (
                      <Link 
                        key={article.title} 
                        href={article.href}
                        className="flex items-center justify-between p-4 bg-white/5 border border-transparent rounded-2xl text-neutral-400 hover:text-white hover:border-white/10 hover:bg-white/10 transition-all font-bold text-[11px] uppercase tracking-widest group/link"
                      >
                        {article.title}
                        <ChevronRight className="w-3 h-3 text-neutral-600 group-hover/link:text-neon group-hover/link:translate-x-1 transition-all" />
                      </Link>
                    ))
                  ) : (
                    <p className="text-neutral-600 text-[10px] font-bold uppercase tracking-widest italic p-4">Нет подходящих статей</p>
                  )}
                </nav>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4">
          <Search className="w-12 h-12 text-neutral-800 mx-auto" />
          <h3 className="text-xl font-black uppercase tracking-widest text-neutral-600">Результатов не найдено</h3>
          <p className="text-neutral-500 text-sm max-w-xs mx-auto italic">Попробуйте изменить запрос или обратитесь в нашу службу заботы ниже.</p>
          <Button 
            variant="ghost" 
            onClick={() => setSearchQuery("")}
            className="text-neon font-black uppercase tracking-widest text-[10px]"
          >
            Сбросить поиск
          </Button>
        </div>
      )}

      {/* Help Section */}
      <div className="glass-dark border border-white/10 rounded-[3rem] p-10 sm:p-16 flex flex-col md:flex-row items-center justify-between gap-10 mt-10 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-10 opacity-5">
           <HelpCircle className="w-48 h-48" />
         </div>
         <div className="space-y-4 relative z-10 max-w-xl">
           <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-white">
             Не нашли <span className="text-neon">ответ?</span>
           </h3>
           <p className="text-neutral-500 text-sm font-medium leading-relaxed italic">
             Наша служба заботы всегда на связи. Опишите вашу проблему, и мы поможем максимально оперативно.
           </p>
         </div>
         <a href="https://t.me/SmurtsTele_bot" target="_blank" rel="noopener noreferrer" className="shrink-0">
           <Button className="bg-neon text-black font-black uppercase tracking-widest text-xs h-14 px-10 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-neon/20 shrink-0">
             Написать в поддержку
           </Button>
         </a>
      </div>
    </div>
  );
}
