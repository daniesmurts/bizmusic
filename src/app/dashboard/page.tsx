"use client";

import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Music,
  MapPin,
  Plus,
  Settings,
  CreditCard,
  ShieldCheck,
  BarChart3,
  Play,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-1">
          <h2 className="text-4xl font-black uppercase tracking-tighter">Обзор <span className="text-neon">Активности</span></h2>
          <p className="text-neutral-400 font-medium text-sm italic">
            Добро пожаловать, <span className="text-white font-bold not-italic">{user?.email}</span>
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard/settings">
            <Button className="bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-2xl px-6 py-6 font-black uppercase text-xs tracking-widest gap-2">
              <Settings className="w-4 h-4" /> Настройки
            </Button>
          </Link>
          <Button className="bg-neon text-black hover:scale-105 transition-transform rounded-2xl px-8 py-6 font-black uppercase text-xs tracking-widest gap-2 shadow-lg shadow-neon/20">
            <Plus className="w-4 h-4" /> Добавить точку
          </Button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-dark border border-white/10 p-8 rounded-[2.5rem] space-y-4">
          <div className="w-12 h-12 bg-neon/10 rounded-xl flex items-center justify-center">
            <MapPin className="text-neon w-6 h-6" />
          </div>
          <div>
            <div className="text-4xl font-black text-white leading-none mb-1">1</div>
            <div className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Активные локации</div>
          </div>
        </div>
        <div className="glass-dark border border-white/10 p-8 rounded-[2.5rem] space-y-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Music className="text-blue-500 w-6 h-6" />
          </div>
          <div>
            <div className="text-4xl font-black text-white leading-none mb-1">128</div>
            <div className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Треков в плейлистах</div>
          </div>
        </div>
        <div className="glass-dark border border-white/10 p-8 rounded-[2.5rem] space-y-4">
          <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
            <ShieldCheck className="text-orange-500 w-6 h-6" />
          </div>
          <div>
            <div className="text-4xl font-black text-white leading-none mb-1 text-orange-500">Active</div>
            <div className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Статус лицензии</div>
          </div>
        </div>
      </div>

      {/* Locations List */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-black uppercase tracking-tighter">Ваши <span className="text-neon">локации</span></h2>
          <Link href="#" className="text-neon text-[10px] font-black uppercase tracking-widest hover:underline underline-offset-4">Посмотреть все</Link>
        </div>
        
        <div className="glass-dark border border-white/10 rounded-[2.5rem] overflow-hidden">
          <div className="p-8 flex items-center justify-between border-b border-white/5 group hover:bg-white/5 transition-colors cursor-pointer">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center border border-white/5 relative overflow-hidden group-hover:scale-105 transition-transform">
                <Music className="text-neon/40 w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-white mb-1">Кафе "Весна"</h3>
                <p className="text-neutral-500 text-sm font-medium">ул. Большая Садовая, Ростов-на-Дону</p>
              </div>
            </div>
            <div className="flex items-center gap-12">
              <div className="hidden md:block">
                <div className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] mb-1">Текущий плейлист</div>
                <div className="text-white font-black text-sm uppercase">Morning Jazz Lounge</div>
              </div>
              <Button size="icon" className="bg-neon/10 border border-neon/20 text-neon rounded-full hover:bg-neon hover:text-black">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </Button>
            </div>
          </div>
          
          <div className="bg-white/5 p-4 flex items-center justify-center gap-8">
             <div className="flex items-center gap-2 text-neutral-500">
               <BarChart3 className="w-4 h-4" />
               <span className="text-xs font-bold uppercase tracking-widest">Аналитика доступна</span>
             </div>
             <div className="flex items-center gap-2 text-neutral-500">
               <CreditCard className="w-4 h-4" />
               <span className="text-xs font-bold uppercase tracking-widest">Следующая оплата: —</span>
             </div>
          </div>
        </div>
      </section>

      {/* Quick Links to new pages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
         <Link href="/dashboard/player" className="glass-dark border border-white/10 p-10 rounded-[2.5rem] space-y-6 relative overflow-hidden group">
           <div className="relative z-10 space-y-4">
             <h3 className="text-3xl font-black uppercase tracking-tight leading-none">Управление <br />Эфиром</h3>
             <p className="text-neutral-400 font-medium">Перейдите в плеер для управления музыкой в ваших заведениях.</p>
             <div className="text-neon flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                Открыть плеер <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
             </div>
           </div>
         </Link>

         <Link href="/dashboard/contract" className="glass-dark border border-white/10 p-10 rounded-[2.5rem] space-y-6 relative overflow-hidden group">
           <div className="relative z-10 space-y-4">
             <h3 className="text-3xl font-black uppercase tracking-tight leading-none">Документы и <br />Договоры</h3>
             <p className="text-neutral-400 font-medium">Ваши лицензии и сертификаты соответствия в одном месте.</p>
             <div className="text-neon flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                Проверить статус <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
             </div>
           </div>
         </Link>
      </div>
    </div>
  );
}
