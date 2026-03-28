import { Metadata } from "next";
import { DemoRequestForm } from "@/components/DemoRequestForm";
import { 
  Zap, 
  ShieldCheck, 
  Music, 
  Mic2, 
  BarChart3, 
  Settings,
  ArrowRight
} from "lucide-react";
 
export const metadata: Metadata = {
  title: "Записаться на демо | Бизнес Музыка",
  description: "Узнайте, как Бизнес Музыка может помочь вашему бизнесу. Запишитесь на персональную демонстрацию платформы.",
};
 
export default function DemoPage() {
  return (
    <div className="flex flex-col gap-16 md:gap-24 pb-20 animate-fade-in relative z-0">
      {/* Decorative Backgrounds */}
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] bg-neon/15 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />
 
      {/* Hero Section */}
      <section className="px-6 md:px-12 pt-12 md:pt-20">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon/30 bg-neon/10 backdrop-blur-md">
              <Zap className="w-4 h-4 text-neon fill-neon" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-neon">Персональный разбор</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-white">
              Ваш бизнес <br />
              <span className="text-neon outline-text">в новом ритме</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-neutral-400 font-medium leading-relaxed max-w-xl">
              Запишитесь на демо, и мы покажем, как автоматизировать музыку и аудиоанонсы в вашем заведении за 15 минут.
            </p>
 
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8">
              {[
                { icon: Mic2, title: "AI Анонсы", desc: "Как создавать и планировать анонсы" },
                { icon: Music, title: "Умные плейлисты", desc: "Настройка атмосферы под время суток" },
                { icon: ShieldCheck, title: "Легальность", desc: "Проверка сертификатов и прав" },
                { icon: BarChart3, title: "Аналитика", desc: "Отчеты об эфире и посещаемости" }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-neon/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-neon" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black uppercase text-white tracking-tight">{item.title}</h4>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
 
          <div className="relative group">
            <div className="absolute inset-0 bg-neon/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10" />
            <div className="glass-dark border border-white/10 rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-24 bg-neon/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
               <div className="relative z-10 space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black uppercase text-white tracking-tight">Заявка на демо</h2>
                    <p className="text-neutral-500 text-sm font-medium">Заполните форму, и мы свяжемся с вами</p>
                  </div>
                  <DemoRequestForm />
               </div>
            </div>
          </div>
        </div>
      </section>
 
      {/* Workflow Section */}
      <section className="px-6 md:px-12 pt-20">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">Что будет <span className="text-neon">на встрече</span></h2>
            <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs max-w-xs md:text-right">
              Никакой воды, только реальные кейсы и настройка под ваш бизнес
            </p>
          </div>
 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Аудит заведения",
                desc: "Проанализируем ваш тип бизнеса, площадь и целевую аудиторию для идеального подбора жанров."
              },
              {
                step: "02",
                title: "Настройка плеера",
                desc: "Покажем, как установить PWA-приложение и настроить расписание вещания за 2 минуты."
              },
              {
                step: "03",
                title: "Запуск анонсов",
                desc: "Вместе создадим ваш первый AI-анонс и встроим его в эфирную сетку."
              }
            ].map((item, i) => (
              <div key={i} className="group p-8 md:p-12 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-neon/20 transition-all relative overflow-hidden">
                <div className="text-8xl font-black text-white/[0.03] absolute -bottom-4 -right-4 group-hover:text-neon/5 transition-colors leading-none">{item.step}</div>
                <div className="relative z-10 space-y-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-neon/10 transition-colors">
                    <ArrowRight className="w-6 h-6 text-neutral-500 group-hover:text-neon transition-all -rotate-45 group-hover:rotate-0" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black uppercase text-white tracking-tight">{item.title}</h3>
                    <p className="text-neutral-400 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
