import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Play, ShieldCheck, CreditCard, WifiOff, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-black overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center pt-20">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero.png"
            alt="Hero Background"
            fill
            className="object-cover opacity-60 scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80" />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-8 border border-white/10 animate-fade-in">
            <span className="w-2 h-2 bg-neon rounded-full animate-pulse" />
            <span className="text-sm font-bold tracking-wider uppercase text-neon">100% Легально в РФ</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-tight">
            АТМОСФЕРА <br />
            <span className="text-neon">ВАШЕГО УСПЕХА</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-neutral-300 mb-12 max-w-3xl mx-auto font-medium">
            Музыкальное оформление для ресторанов, отелей и ритейла. 
            Прямые лицензии без выплат в РАО и ВОИС.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button size="lg" className="bg-neon text-black hover:scale-105 transition-transform px-10 py-8 text-xl rounded-full font-black uppercase">
              Начать бесплатно
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 px-10 py-8 text-xl rounded-full font-black uppercase glass">
              Слушать демо
            </Button>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center p-1">
            <div className="w-1 h-2 bg-neon rounded-full" />
          </div>
        </div>
      </section>

      {/* Compliance & Features */}
      <section className="py-32 container mx-auto px-4 relative">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon/10 blur-[120px] rounded-full -z-10" />
        
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6 uppercase">
              Ваш бизнес в <br /><span className="text-neon">безопасности</span>
            </h2>
            <p className="text-xl text-neutral-400">
              Мы берем на себя все юридические вопросы. Вы получаете готовое решение «под ключ» с полной защитой от проверок.
            </p>
          </div>
          <Link href="/compliance" className="group flex items-center gap-2 text-neon font-bold uppercase tracking-widest text-sm translate-y-[-10px]">
            Все о комплаенсе <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-dark p-10 rounded-3xl border border-white/5 hover:border-white/20 transition-all group">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-neon/10 transition-colors">
              <ShieldCheck className="w-8 h-8 text-neon" />
            </div>
            <h3 className="text-2xl font-bold mb-4">152-ФЗ (Данные)</h3>
            <p className="text-neutral-500 leading-relaxed">
              Все персональные данные хранятся на серверах Yandex Cloud в РФ. Полная юридическая чистота.
            </p>
          </div>

          <div className="glass-dark p-10 rounded-3xl border border-white/5 hover:border-white/20 transition-all group">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-neon/10 transition-colors">
              <CreditCard className="w-8 h-8 text-neon" />
            </div>
            <h3 className="text-2xl font-bold mb-4">54-ФЗ (Платежи)</h3>
            <p className="text-neutral-500 leading-relaxed">
              Автоматическая фискализация чеков через YooKassa. Никаких проблем с налоговой.
            </p>
          </div>

          <div className="glass-dark p-10 rounded-3xl border border-white/5 hover:border-white/20 transition-all group">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-neon/10 transition-colors">
              <WifiOff className="w-8 h-8 text-neon" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Оффлайн Режим</h3>
            <p className="text-neutral-500 leading-relaxed">
              PWA-приложение кэширует треки. Ваша музыка не остановится, даже если пропадет интернет.
            </p>
          </div>
        </div>
      </section>

      {/* Moods Section */}
      <section className="py-32 bg-neutral-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black tracking-tighter mb-6 uppercase">Готовые решения по настроению</h2>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
              Наши музыкальные редакторы уже собрали идеальные плейлисты для любого времени суток.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Mood Card 1 */}
            <div className="relative group cursor-pointer overflow-hidden rounded-[40px]">
              <div className="aspect-[4/5] relative">
                <Image
                  src="/images/mood-1.png"
                  alt="Morning Jazz"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                <div className="absolute inset-0 flex flex-col justify-end p-10">
                  <h4 className="text-3xl font-black mb-2 uppercase">Утренний Кофе</h4>
                  <p className="text-neutral-300 mb-6">Легкий джаз и акустика для бодрого начала дня.</p>
                  <Button className="w-fit bg-white text-black rounded-full px-6 gap-2">
                    <Play className="w-4 h-4 fill-current" /> Слушать
                  </Button>
                </div>
              </div>
            </div>

            {/* Mood Card 2 */}
            <div className="relative group cursor-pointer overflow-hidden rounded-[40px]">
              <div className="aspect-[4/5] relative">
                <Image
                  src="/images/mood-2.png"
                  alt="Night Lounge"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                <div className="absolute inset-0 flex flex-col justify-end p-10">
                  <h4 className="text-3xl font-black mb-2 uppercase">Вечерний Лаунж</h4>
                  <p className="text-neutral-300 mb-6">Глубокий хаус и чиллаут для создания интимной атмосферы.</p>
                  <Button className="w-fit bg-white text-black rounded-full px-6 gap-2">
                    <Play className="w-4 h-4 fill-current" /> Слушать
                  </Button>
                </div>
              </div>
            </div>

            {/* Mood Card 3 */}
            <div className="relative group cursor-pointer overflow-hidden rounded-[40px]">
              <div className="aspect-[4/5] relative">
                <div className="absolute inset-0 bg-neon/20 z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Image
                  src="/images/hero.png"
                  alt="Energetic Retail"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                <div className="absolute inset-0 flex flex-col justify-end p-10">
                  <h4 className="text-3xl font-black mb-2 uppercase">Смарт Ритейл</h4>
                  <p className="text-neutral-300 mb-6">Энергичный поп и соул для повышения среднего чека.</p>
                  <Button className="w-fit bg-white text-black rounded-full px-6 gap-2">
                    <Play className="w-4 h-4 fill-current" /> Слушать
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tighter">
                БИЗНЕС<span className="text-neon">МУЗЫКА</span>
              </span>
            </Link>
            <p className="text-neutral-500 text-sm max-w-xs text-center md:text-left">
              © 2026 Бизнес Музыка. Все права защищены. 100% легальный контент в РФ.
            </p>
          </div>
          <div className="flex gap-10 text-sm font-bold uppercase tracking-widest text-neutral-400">
            <Link href="#" className="hover:text-neon transition-colors">Оферта</Link>
            <Link href="#" className="hover:text-neon transition-colors">Политика</Link>
            <Link href="#" className="hover:text-neon transition-colors">Контакты</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

import Link from "next/link";
