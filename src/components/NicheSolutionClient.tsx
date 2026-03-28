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
  Play,
  Music as MusicIcon,
  Mic2,
  ChevronRight,
  Coffee,
  Utensils,
  Building2,
  ShoppingBag,
  Gem,
  Scissors,
  Car,
  ShoppingCart,
  TrendingUp,
  Heart,
  Clock
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NicheData } from "@/lib/data/niches";
import { usePlayerStore, Track } from "@/store/usePlayerStore";

// Icon mapping to resolve strings from niche data to components
const IconMap: Record<string, any> = {
  Coffee,
  Utensils,
  Building2,
  ShoppingBag,
  Gem,
  Scissors,
  Car,
  ShoppingCart,
  Zap,
  ShieldCheck,
  TrendingUp,
  Heart,
  Clock,
  Mic2
};

interface NicheSolutionClientProps {
  niche: NicheData;
}

export default function NicheSolutionClient({ niche }: NicheSolutionClientProps) {
  const { setTrack } = usePlayerStore();
  const HeroIcon = IconMap[niche.icon] || MusicIcon;

  const handlePlayDemo = (title: string) => {
    const demoTrack: Track = {
      id: `demo-${niche.slug}-${Date.now()}`,
      title: title,
      artist: "Бизмюзик",
      fileUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      duration: 372,
      cover_url: niche.heroImage,
    };
    setTrack(demoTrack);
  };

  return (
    <div className="flex flex-col gap-16 md:gap-32 pb-20 animate-fade-in relative z-0">
      {/* Background Effects */}
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] bg-neon/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center px-6 md:px-12 py-20 overflow-hidden rounded-[3rem] md:rounded-[4rem] mx-4 md:mx-6 border border-white/8 bg-[#14161e]/60 backdrop-blur-xl shadow-xl shadow-black/10">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-neutral-900/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f1117] via-[#0f1117]/70 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-4xl space-y-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon/30 bg-neon/10 backdrop-blur-md">
            <HeroIcon className="w-4 h-4 text-neon" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-neon">{niche.name}</span>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-[clamp(2.5rem,10vw,4.5rem)] sm:text-7xl md:text-8xl font-black uppercase tracking-tighter leading-[1] md:leading-[0.85] text-white">
              {niche.title.split(' ').map((word, i) => (
                <span key={i} className={i % 2 === 1 ? "text-neon outline-text" : ""}>{word} </span>
              ))}
            </h1>
            <p className="text-lg md:text-2xl text-neutral-300 font-medium leading-relaxed max-w-2xl">
              {niche.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6">
            <Link href="/demo" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-neon text-black hover:scale-105 transition-all rounded-2xl px-12 h-16 text-lg font-black uppercase tracking-widest shadow-[0_0_30px_rgba(92,243,135,0.4)]">
                Записаться на демо
              </Button>
            </Link>
            <Button 
              onClick={() => handlePlayDemo(`Плейлист: ${niche.name}`)}
              variant="outline" 
              className="w-full sm:w-auto border-white/20 text-white hover:bg-white/5 backdrop-blur-sm rounded-2xl px-12 h-16 text-lg font-black uppercase tracking-widest gap-2"
            >
              <Play className="w-5 h-5 fill-current" /> Слушать демо
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="px-6 md:px-12">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none text-white">
                {niche.problem.title}
              </h2>
              <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">Почему ваш бизнес теряет клиентов прямо сейчас</p>
            </div>
            
            <div className="space-y-6">
              {niche.problem.points.map((point, i) => (
                <div key={i} className="flex items-start gap-4 p-6 rounded-3xl bg-white/[0.04] border border-white/8 group hover:border-red-500/30 transition-all">
                  <div className="w-8 h-8 rounded-full border border-red-500/30 flex items-center justify-center text-red-500 text-xs shrink-0 mt-1">✕</div>
                  <p className="text-neutral-300 font-medium leading-relaxed">{point}</p>
                </div>
              ))}
            </div>

            <div className="p-8 glass-dark border border-neon/30 rounded-[2.5rem] bg-neon/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 bg-neon/10 blur-[80px] rounded-full" />
               <div className="relative z-10 space-y-4">
                 <h3 className="text-2xl font-black uppercase text-white flex items-center gap-3">
                   <Zap className="w-6 h-6 text-neon fill-neon" /> Решение от Бизмюзик
                 </h3>
                 <p className="text-neutral-300 text-lg leading-relaxed italic border-l-4 border-neon pl-6">
                   {niche.problem.solution}
                 </p>
               </div>
            </div>
          </div>

          <div className="relative h-[600px] rounded-[3.5rem] overflow-hidden group">
            <div className="absolute inset-0 bg-[#191c24] animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-br from-neon/20 via-transparent to-blue-500/20 mix-blend-overlay" />
            <div className="absolute inset-0 flex items-center justify-center">
               <HeroIcon className="w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-1000" />
            </div>
          </div>
        </div>
      </section>

      {/* Strategies Grid */}
      <section className="px-6 md:px-12 space-y-20">
        <div className="grid md:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Music Strategy */}
          <div className="p-10 md:p-14 glass-surface border border-white/8 rounded-[3rem] md:rounded-[4rem] relative overflow-hidden group shadow-lg shadow-black/10">
            <div className="absolute top-0 right-0 p-32 bg-neon/10 blur-[120px] rounded-full opacity-50" />
            <div className="relative z-10 space-y-10">
              <div className="w-20 h-20 rounded-3xl bg-neon/10 border border-neon/20 flex items-center justify-center">
                 <MusicIcon className="w-10 h-10 text-neon" />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl md:text-4xl font-black uppercase text-white tracking-widest">{niche.musicStrategy.title}</h3>
                <p className="text-neutral-400 font-medium leading-relaxed italic">
                  «{niche.musicStrategy.description}»
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {niche.musicStrategy.genres.map((genre) => (
                  <div key={genre} className="px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/8 text-xs font-black uppercase tracking-widest text-center text-neutral-300">
                    {genre}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-6 border-t border-white/5">
                 <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Рекомендуемый темп:</span>
                 <Badge className="bg-neon text-black font-black px-4">{niche.musicStrategy.tempo}</Badge>
              </div>
            </div>
          </div>

          {/* Announcement Strategy */}
          <div className="p-10 md:p-14 glass-surface border border-white/8 rounded-[3rem] md:rounded-[4rem] relative overflow-hidden group shadow-lg shadow-black/10">
            <div className="absolute top-0 right-0 p-32 bg-blue-500/10 blur-[120px] rounded-full opacity-50" />
            <div className="relative z-10 space-y-10">
              <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                 <Mic2 className="w-10 h-10 text-blue-500" />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl md:text-4xl font-black uppercase text-white tracking-widest">{niche.announcementStrategy.title}</h3>
                <p className="text-neutral-400 font-medium leading-relaxed">
                  {niche.announcementStrategy.description}
                </p>
              </div>

              <div className="space-y-3">
                {niche.announcementStrategy.examples.map((ex, i) => (
                  <div key={i} className="flex items-center gap-4 text-white font-medium p-4 rounded-2xl bg-white/[0.05] border border-white/8 group/ex hover:bg-blue-500/5 transition-colors">
                    <Play className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-sm italic">«{ex}»</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 md:px-12 bg-white/[0.03] py-24 rounded-[4rem] mx-4 md:mx-6 border border-white/5">
        <div className="max-w-6xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase text-white tracking-tight">Преимущества <span className="text-neon outline-text">для вас</span></h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {niche.benefits.map((benefit, i) => {
              const BenIcon = IconMap[benefit.icon] || ShieldCheck;
              return (
                <div key={i} className="p-10 glass-surface border border-white/8 rounded-[3rem] space-y-6 hover:border-neon/30 transition-all shadow-md shadow-black/10">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.06] flex items-center justify-center">
                    <BenIcon className="w-8 h-8 text-neon" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-black uppercase text-white tracking-widest leading-none">{benefit.title}</h4>
                    <p className="text-neutral-500 text-sm font-medium leading-relaxed">{benefit.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6">
        <div className="max-w-5xl mx-auto p-12 md:p-20 glass-surface border border-white/8 rounded-[3.5rem] text-center relative overflow-hidden group shadow-xl shadow-black/10">
          <div className="absolute inset-0 bg-neon/10 opacity-30 blur-[100px] -z-10" />
          <div className="space-y-10 relative z-10">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">
              Начните сегодня <br /> <span className="text-neon underline underline-offset-8 decoration-neon/20">бесплатно</span>
            </h2>
            <p className="text-xl text-neutral-400 font-medium max-w-2xl mx-auto leading-relaxed">
              Присоединяйтесь к числу успешных заведений в категории "{niche.name}" и обеспечьте свой бизнес качественным звуком.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Link href="/register" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-neon text-black rounded-2xl px-12 h-16 text-lg font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_40px_rgba(92,243,135,0.4)]">
                   Создать аккаунт
                </Button>
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto border-white/10 text-white rounded-2xl px-12 h-16 text-lg font-black uppercase tracking-widest hover:bg-white/5">
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
