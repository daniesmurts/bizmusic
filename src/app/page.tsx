"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  Zap, 
  Clock, 
  ArrowRight, 
  Play,
  Heart,
  ExternalLink,
  CreditCard,
  WifiOff
} from "lucide-react";
import { usePlayerStore, Track } from "@/store/usePlayerStore";

export default function Home() {
  const { setTrack } = usePlayerStore();

  const handlePlayDemo = (title: string, artist: string) => {
    const demoTrack: Track = {
      id: "demo-" + Math.random(),
      title,
      artist,
      file_url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // Demo URL
      duration: 372,
      cover_url: title.includes("Jazz") ? "/images/mood-1.png" : "/images/mood-2.png"
    };
    setTrack(demoTrack);
  };

  return (
    <div className="flex flex-col gap-24 pb-20">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center px-12 overflow-hidden rounded-[3rem] mx-6">
        <Image
          src="/images/hero.png"
          alt="Hero Background"
          fill
          className="object-cover brightness-[0.4]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
        
        <div className="relative z-10 max-w-2xl space-y-8 animate-in fade-in slide-in-from-left duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon/30 bg-neon/10 backdrop-blur-md">
            <Zap className="w-4 h-4 text-neon fill-neon" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-neon">Новое поколение звука</span>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-white">
            Атмосфера <br />
            <span className="text-neon outline-text">вашего успеха</span>
          </h1>
          
          <p className="text-xl text-neutral-300 font-medium leading-relaxed max-w-xl">
            Легальное музыкальное оформление для бизнеса. <br />
            Без РАО и ВОИС. В одно касание.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link href="/register">
              <Button className="bg-neon text-black hover:scale-105 transition-transform rounded-full px-10 py-8 text-lg font-black uppercase tracking-widest shadow-[0_0_30px_rgba(92,243,135,0.4)]">
                Начать бесплатно
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 backdrop-blur-sm rounded-full px-10 py-8 text-lg font-black uppercase tracking-widest">
                Все тарифы
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="px-12 space-y-12">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-5xl font-black uppercase tracking-tighter">Наши <span className="text-neon">Продукты</span></h2>
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">Комплексные решения для вашего бизнеса</p>
          </div>
          <Link href="/products">
            <Button variant="ghost" className="text-neon font-black uppercase tracking-widest group">
              Смотреть все <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "Музыка для бизнеса",
              description: "Для кафе, ритейл, офисов",
              img: "/images/mood-1.png",
              link: "/pricing"
            },
            {
              title: "Контент для блогеров",
              description: "Для YouTube, VK, Telegram",
              img: "/images/mood-2.png",
              link: "/pricing"
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
                className="group relative h-[450px] rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-neon/20 transition-all duration-500"
              >
                <Image
                  src={item.img}
                  alt={item.title}
                  fill
                  className="object-cover brightness-75 group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                  <Button size="icon" className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-full hover:bg-neon hover:text-black transition-colors">
                    <Heart className="w-5 h-5" />
                  </Button>
                  <Button size="icon" className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-full hover:bg-white/20">
                    <ExternalLink className="w-5 h-5 text-white" />
                  </Button>
                </div>

                <div className="absolute inset-x-8 bottom-8">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-3xl font-black uppercase leading-none text-white">{item.title}</h3>
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

      {/* Compliance & Features */}
      <section className="px-12">
        <div className="glass-dark border border-white/10 rounded-[3.5rem] p-16 relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[60%] bg-neon/10 blur-[120px] rounded-full" />
          
          <div className="relative z-10 grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-6xl font-black uppercase tracking-tighter leading-[0.9]">
                Ваша <span className="text-neon underline decoration-neon/30 underline-offset-8">защита</span> <br />
                наша работа
              </h2>
              <p className="text-neutral-400 text-lg leading-relaxed font-medium">
                Мы берем на себя все юридические риски. Прямые договора с правообладателями позволяют вам не платить в РАО и ВОИС.
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-neon/10 border border-neon/20 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7 text-neon" />
                  </div>
                  <div>
                    <h4 className="font-black uppercase tracking-tighter text-white">152-ФЗ (Данные)</h4>
                    <p className="text-neutral-500 text-sm font-medium leading-tight">Сервера Yandex Cloud в РФ</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                    <CreditCard className="w-7 h-7 text-neutral-300" />
                  </div>
                  <div>
                    <h4 className="font-black uppercase tracking-tighter text-white">54-ФЗ (Платежи)</h4>
                    <p className="text-neutral-500 text-sm font-medium leading-tight">Чеки через YooKassa</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative h-[500px] rounded-3xl overflow-hidden border border-white/10">
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

      {/* Footer */}
      <footer className="px-12 py-12 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tighter uppercase leading-none">
                Бизнес<span className="text-neon">Музыка</span>
              </span>
            </div>
            <p className="text-neutral-500 text-sm font-bold max-w-xs text-center md:text-left uppercase tracking-tighter">
              © 2026 Бизнес Музыка. 100% легальный контент в РФ.
            </p>
          </div>
          <div className="flex gap-10 text-xs font-black uppercase tracking-widest text-neutral-400">
            <Link href="#" className="hover:text-neon transition-colors">Оферта</Link>
            <Link href="#" className="hover:text-neon transition-colors">Политика</Link>
            <Link href="#" className="hover:text-neon transition-colors">Контакты</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
