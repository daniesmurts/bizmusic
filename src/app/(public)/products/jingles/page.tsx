"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  AudioLines, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Music, 
  Mic2, 
  Volume2, 
  Zap,
  ArrowLeft,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function JingleOrderPage() {
  const [formData, setFormData] = useState({
    brandName: "",
    slogan: "",
    industry: "",
    style: "energetic",
    references: "",
    notes: "",
    customerName: "",
    email: "",
    phone: ""
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    setTimeout(() => {
      setSubmitted(true);
    }, 800);
  };

  const styles = [
    { id: "energetic", name: "Энергичный", icon: Zap },
    { id: "calm", name: "Спокойный", icon: Volume2 },
    { id: "modern", name: "Современный", icon: Sparkles },
    { id: "premium", name: "Премиальный", icon: Music },
  ];

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-6">
        <div className="max-w-2xl w-full glass-dark border border-white/10 rounded-[3rem] p-12 md:p-20 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-neon/10 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
          
          <div className="w-24 h-24 bg-neon/20 border border-neon/30 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(92,243,135,0.2)] animate-in zoom-in duration-500">
            <CheckCircle2 className="w-12 h-12 text-neon" />
          </div>

          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white leading-tight">
            Заявка <span className="text-neon">получена!</span>
          </h1>
          <p className="text-xl text-neutral-400 font-medium leading-relaxed">
            Спасибо! Наш менеджер свяжется с вами в ближайшее время, чтобы обсудить детали вашего будущего джингла.
          </p>
          
          <div className="pt-8">
            <Link href="/products">
              <Button className="bg-neon text-black hover:scale-105 transition-transform rounded-2xl px-10 h-14 font-black uppercase tracking-widest shadow-[0_0_30px_rgba(92,243,135,0.4)]">
                Вернуться к продуктам
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
      {/* Header */}
      <div className="mb-16 space-y-6">
        <Link href="/products" className="inline-flex items-center gap-2 text-neutral-500 hover:text-neon transition-colors group">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">Назад к продуктам</span>
        </Link>
        
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neon/20 bg-neon/5 backdrop-blur-md">
            <AudioLines className="w-3.5 h-3.5 text-neon" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neon">Premium Service</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none text-white">
            Создайте свой <br /> <span className="text-neon underline decoration-neon/20 underline-offset-8">аудио-бренд</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 font-medium max-w-2xl leading-relaxed">
            Заполните бриф, и наша команда композиторов разработает уникальный джингл, который сделает ваш бренд узнаваемым с первых секунд.
          </p>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_350px] gap-12">
        <div className="space-y-12">
          {/* Section 1: Brand Info */}
          <div className="glass-dark border border-white/5 rounded-[2.5rem] p-8 md:p-12 space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-16 bg-white/5 blur-[80px] rounded-full -mr-16 -mt-16 pointer-events-none" />
            
            <div className="space-y-2 border-l-2 border-neon pl-6">
              <h3 className="text-xl font-black uppercase tracking-tighter text-white">1. О вашем бренде</h3>
              <p className="text-sm text-neutral-500 font-medium lowercase italic">основная информация для композитора</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Название бренда *</label>
                <Input 
                  required
                  placeholder="Например: Моя Кофейня" 
                  className="h-14 bg-white/5 border-white/10 rounded-2xl focus:border-neon focus:ring-neon transition-all"
                  value={formData.brandName}
                  onChange={(e) => setFormData({...formData, brandName: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Слоган (если есть)</label>
                <Input 
                  placeholder="Вкус вашего утра" 
                  className="h-14 bg-white/5 border-white/10 rounded-2xl focus:border-neon focus:ring-neon transition-all"
                  value={formData.slogan}
                  onChange={(e) => setFormData({...formData, slogan: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Сфера деятельности *</label>
                <Input 
                  required
                  placeholder="Например: Ресторанный бизнес, Ритейл" 
                  className="h-14 bg-white/5 border-white/10 rounded-2xl focus:border-neon focus:ring-neon transition-all"
                  value={formData.industry}
                  onChange={(e) => setFormData({...formData, industry: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Creative Brief */}
          <div className="glass-dark border border-white/5 rounded-[2.5rem] p-8 md:p-12 space-y-10 relative overflow-hidden">
            <div className="space-y-2 border-l-2 border-neon pl-6">
              <h3 className="text-xl font-black uppercase tracking-tighter text-white">2. Творческое задание</h3>
              <p className="text-sm text-neutral-500 font-medium lowercase italic">настроение и стиль звучания</p>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Выберите основное настроение</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {styles.map((style) => {
                    const Icon = style.icon;
                    const isActive = formData.style === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setFormData({...formData, style: style.id})}
                        className={cn(
                          "flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border transition-all duration-300",
                          isActive 
                            ? "bg-neon/10 border-neon/40 text-neon shadow-[0_0_20px_rgba(92,243,135,0.1)]" 
                            : "bg-white/5 border-white/10 text-neutral-500 hover:border-white/20 hover:bg-white/10"
                        )}
                      >
                        <Icon className={cn("w-6 h-6", isActive ? "text-neon" : "text-neutral-600")} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">
                          {style.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Ссылки на примеры (Youtube, Spotify, и т.д.)</label>
                <Textarea 
                  placeholder="Вставьте ссылки на аудио или видео, которые вам нравятся по стилю..." 
                  className="min-h-[100px] bg-white/5 border-white/10 rounded-3xl focus:border-neon focus:ring-neon transition-all resize-none p-6"
                  value={formData.references}
                  onChange={(e) => setFormData({...formData, references: e.target.value})}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Дополнительные комментарии</label>
                <Textarea 
                  placeholder="Опишите ваши ожидания или примечания для композитора..." 
                  className="min-h-[150px] bg-white/5 border-white/10 rounded-3xl focus:border-neon focus:ring-neon transition-all resize-none p-6"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Contact */}
          <div className="glass-dark border border-white/5 rounded-[2.5rem] p-8 md:p-12 space-y-10 relative overflow-hidden">
            <div className="space-y-2 border-l-2 border-neon pl-6">
              <h3 className="text-xl font-black uppercase tracking-tighter text-white">3. Контактные данные</h3>
              <p className="text-sm text-neutral-500 font-medium lowercase italic">куда отправить готовые варианты</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Как вас зовут *</label>
                <Input 
                  required
                  placeholder="Ваше имя" 
                  className="h-14 bg-white/5 border-white/10 rounded-2xl focus:border-neon focus:ring-neon transition-all"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Email *</label>
                <Input 
                  required
                  type="email"
                  placeholder="example@mail.ru" 
                  className="h-14 bg-white/5 border-white/10 rounded-2xl focus:border-neon focus:ring-neon transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Телефон</label>
                <Input 
                  placeholder="+7 (999) 000-00-00" 
                  className="h-14 bg-white/5 border-white/10 rounded-2xl focus:border-neon focus:ring-neon transition-all"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Sticky Panel */}
        <aside className="space-y-8">
          <div className="sticky top-32 space-y-8">
            <div className="glass-dark border border-white/10 rounded-[2.5rem] p-8 md:p-10 space-y-8 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 p-24 bg-neon/5 blur-[80px] rounded-full -mr-24 -mb-24 pointer-events-none" />
              
              <div className="space-y-2">
                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-neon underline decoration-neon/20 underline-offset-8 mb-6 block">Ваш заказ</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Тип услуги:</span>
                    <span className="text-white font-black uppercase tracking-tighter">Джингл</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Пакет:</span>
                    <span className="text-white font-black uppercase tracking-tighter">Premium</span>
                  </div>
                  <div className="h-[1px] bg-white/5 my-4" />
                  <div className="flex justify-between items-center text-xl">
                    <span className="text-white font-black uppercase tracking-tighter">Итого:</span>
                    <span className="text-neon font-black tracking-tighter text-2xl">от 5 900 ₽</span>
                  </div>
                </div>
              </div>

              <Button 
                type="submit"
                className="w-full h-16 bg-neon text-black hover:scale-[1.02] transition-all rounded-[1.5rem] font-black uppercase tracking-widest shadow-[0_0_40px_rgba(92,243,135,0.3)] flex items-center justify-center gap-3"
              >
                Отправить заявку
                <Send className="w-5 h-5" />
              </Button>

              <p className="text-[10px] text-neutral-500 text-center uppercase tracking-widest leading-relaxed font-bold">
                Наш менеджер свяжется с вами для уточнения деталей и подтверждения заказа.
              </p>
            </div>

            <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-6">
              <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">Что входит в стоимость:</h5>
              <ul className="space-y-4 list-none p-0 m-0">
                {[
                  { icon: Zap, t: "3 варианта на выбор" },
                  { icon: Music, t: "Аудио-логотип (3-5 сек)" },
                  { icon: Mic2, t: "Полный джингл (15-30 сек)" },
                  { icon: ShieldCheck, t: "Передача авторских прав" }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-neutral-400">
                    <item.icon className="w-4 h-4 text-neon" />
                    {item.t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
