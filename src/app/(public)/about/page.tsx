"use client";

import {
  ShieldCheck,
  Music,
  TrendingUp,
  Users,
  Award,
  Globe,
  Heart,
  Zap,
  Target,
  Eye,
  Mail,
  Phone,
  MapPin,
  Send,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const stats = [
  {
    value: "10,000+",
    label: "Треков в библиотеке",
    icon: Music,
  },
  {
    value: "500+",
    label: "Довольных клиентов",
    icon: Users,
  },
  {
    value: "100%",
    label: "Легальный контент",
    icon: ShieldCheck,
  },
  {
    value: "24/7",
    label: "Поддержка",
    icon: Zap,
  },
];

const values = [
  {
    icon: Target,
    title: "Наша миссия",
    description:
      "Сделать легальную музыку доступной для каждого бизнеса в России. Мы верим, что защита авторских прав должна быть простой и понятной.",
  },
  {
    icon: Eye,
    title: "Наше видение",
    description:
      "Стать ведущей платформой музыкального лицензирования в СНГ, где каждый предприниматель может найти идеальную музыку для своего бизнеса.",
  },
  {
    icon: Heart,
    title: "Наши ценности",
    description:
      "Прозрачность, инновации и забота о клиентах — основа всего, что мы делаем. Мы создаём решения, которые работают на вас.",
  },
];

const achievements = [
  {
    icon: Award,
    title: "100% легально",
    description: "Все треки лицензированы напрямую от правообладателей",
  },
  {
    icon: Globe,
    title: "Работаем по всей РФ",
    description: "Клиенты от Калининграда до Владивостока",
  },
  {
    icon: TrendingUp,
    title: "Постоянное развитие",
    description: "Еженедельные обновления библиотеки новыми треками",
  },
  {
    icon: ShieldCheck,
    title: "Защита от РАО/ВОИС",
    description: "Полная юридическая защита для всех клиентов",
  },
];

const contactInfo = [
  {
    icon: Mail,
    title: "Email",
    value: "daniel@boadtech.com",
    href: "mailto:daniel@boadtech.com",
  },
  {
    icon: Phone,
    title: "Телефон",
    value: "+7 (999) 123-45-67",
    href: "tel:+79991234567",
  },
  {
    icon: MapPin,
    title: "Адрес",
    value: "г. Казань, Республика Татарстан",
    href: "#",
  },
];

export default function AboutPage() {
  const [agreed, setAgreed] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    topic: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY,
          ...formData,
          from_name: "Бизнес Музыка - Контактная форма",
          subject: `Новое сообщение: ${formData.topic || "Общий запрос"}`,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setStatus("success");
        setFormData({ name: "", email: "", phone: "", topic: "", message: "" });
        setAgreed(false);
      } else {
        setStatus("error");
        setErrorMessage(result.message || "Произошла ошибка при отправке.");
      }
    } catch (error) {
      console.error("Web3Forms Error:", error);
      setStatus("error");
      setErrorMessage("Северная ошибка. Пожалуйста, попробуйте позже.");
    }
  };

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative px-6">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon/30 bg-neon/10 backdrop-blur-md">
            <Heart className="w-4 h-4 text-neon" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-neon">
              О компании
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-white">
            Бизнес <span className="text-neon">Музыка</span>
          </h1>

          <p className="text-xl text-neutral-400 font-medium max-w-3xl mx-auto leading-relaxed">
            Мы делаем легальную музыку доступной для каждого бизнеса. 
            Прямые лицензии от правообладателей, полная защита от РАО и ВОИС, 
            и музыка, которая создаёт атмосферу вашего успеха.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="group relative p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-neon/20 transition-all duration-500"
                >
                  <div className="absolute top-0 right-0 p-12 bg-neon/5 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-neon/10 border border-neon/20 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-neon" />
                    </div>
                    <div>
                      <p className="text-5xl font-black text-white mb-2">
                        {stat.value}
                      </p>
                      <p className="text-neutral-500 text-xs font-black uppercase tracking-widest">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-black uppercase tracking-tighter text-white mb-4">
              Кто <span className="text-neon">мы</span>
            </h2>
            <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
              Наша миссия и ценности
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, i) => {
              const Icon = value.icon;
              return (
                <div
                  key={i}
                  className="relative p-8 bg-white/[0.02] border border-white/5 rounded-[3rem] hover:border-neon/20 transition-all duration-500 group"
                >
                  <div className="absolute top-0 right-0 p-24 bg-neon/5 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="relative z-10 space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-neon/10 border border-neon/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8 text-neon" />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-2xl font-black uppercase tracking-tighter text-white">
                        {value.title}
                      </h3>
                      <p className="text-neutral-400 text-sm font-medium leading-relaxed">
                        {value.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="px-6">
        <div className="max-w-6xl mx-auto">
          <div className="glass-dark border border-white/10 rounded-[3rem] p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-48 bg-neon/5 blur-[150px] rounded-full -mr-48 -mt-48 pointer-events-none" />
            <div className="absolute bottom-0 left-0 p-48 bg-blue-500/5 blur-[150px] rounded-full -ml-48 -mb-48 pointer-events-none" />

            <div className="relative z-10">
              <div className="text-center mb-12">
                <h2 className="text-5xl font-black uppercase tracking-tighter text-white mb-4">
                  Почему <span className="text-neon">выбирают нас</span>
                </h2>
                <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
                  Наши преимущества
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {achievements.map((achievement, i) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={i}
                      className="text-center space-y-4"
                    >
                      <div className="w-20 h-20 mx-auto rounded-2xl bg-neon/10 border border-neon/20 flex items-center justify-center">
                        <Icon className="w-10 h-10 text-neon" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-white mb-2">
                          {achievement.title}
                        </h3>
                        <p className="text-neutral-500 text-sm font-medium leading-relaxed">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl font-black uppercase tracking-tighter text-white mb-4">
              Свяжитесь с <span className="text-neon">нами</span>
            </h2>
            <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
              Мы всегда рады помочь вам
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="glass-dark border border-white/5 rounded-[3rem] p-10 space-y-8">
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
                    Контактная информация
                  </h3>
                  <p className="text-neutral-400 text-sm font-medium leading-relaxed">
                    Свяжитесь с нами любым удобным способом
                  </p>
                </div>

                <div className="space-y-6">
                  {contactInfo.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={i}
                        href={item.href}
                        className="flex items-center gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-neon/30 transition-all group"
                      >
                        <div className="w-14 h-14 rounded-2xl bg-neon/10 border border-neon/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon className="w-7 h-7 text-neon" />
                        </div>
                        <div>
                          <p className="text-neutral-500 text-xs font-black uppercase tracking-widest mb-1">
                            {item.title}
                          </p>
                          <p className="text-white font-bold text-lg">
                            {item.value}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Working Hours */}
                <div className="pt-6 border-t border-white/5">
                  <h4 className="text-xl font-black uppercase tracking-tight text-white mb-4">
                    Режим работы
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 text-sm font-medium">
                        Понедельник - Пятница
                      </span>
                      <span className="text-white font-bold">9:00 - 18:00</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 text-sm font-medium">
                        Суббота
                      </span>
                      <span className="text-white font-bold">10:00 - 15:00</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 text-sm font-medium">
                        Воскресенье
                      </span>
                      <span className="text-neon font-bold">Выходной</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="glass-dark border border-white/10 rounded-[3rem] p-10">
              <div className="mb-8">
                <h3 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">
                  Напишите нам
                </h3>
                <p className="text-neutral-400 text-sm font-medium leading-relaxed">
                  Заполните форму и мы ответим в течение рабочего дня
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-white font-black uppercase tracking-widest text-xs mb-2 block">
                      Имя *
                    </label>
                    <Input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Иван Иванов"
                      className="w-full bg-white/[0.02] border border-white/10 text-white rounded-2xl h-14 px-6 focus:border-neon focus:ring-1 focus:ring-neon/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-white font-black uppercase tracking-widest text-xs mb-2 block">
                      Email *
                    </label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ivan@example.com"
                      className="w-full bg-white/[0.02] border border-white/10 text-white rounded-2xl h-14 px-6 focus:border-neon focus:ring-1 focus:ring-neon/20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-white font-black uppercase tracking-widest text-xs mb-2 block">
                      Телефон *
                    </label>
                    <Input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+7 (XXX) XXX-XX-XX"
                      className="w-full bg-white/[0.02] border border-white/10 text-white rounded-2xl h-14 px-6 focus:border-neon focus:ring-1 focus:ring-neon/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-white font-black uppercase tracking-widest text-xs mb-2 block">
                      Тема
                    </label>
                    <select 
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full bg-white/[0.02] border border-white/10 text-white rounded-2xl h-14 px-6 focus:border-neon focus:ring-1 focus:ring-neon/20 transition-all outline-none"
                    >
                      <option value="" className="bg-neutral-900">Выберите тему</option>
                      <option value="sales" className="bg-neutral-900">Продажи и тарифы</option>
                      <option value="support" className="bg-neutral-900">Техническая поддержка</option>
                      <option value="partnership" className="bg-neutral-900">Партнёрство</option>
                      <option value="other" className="bg-neutral-900">Другое</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-white font-black uppercase tracking-widest text-xs mb-2 block">
                    Сообщение *
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Ваше сообщение..."
                    rows={6}
                    className="w-full bg-white/[0.02] border border-white/10 text-white rounded-2xl p-6 resize-none focus:border-neon focus:ring-1 focus:ring-neon/20 transition-all outline-none"
                  />
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-neon/20 transition-all group">
                  <div className="relative flex items-center h-5">
                    <input
                      id="legal-consent"
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="w-5 h-5 rounded border-neutral-800 bg-neutral-900 text-neon focus:ring-neon/20 focus:ring-offset-0 transition-all cursor-pointer accent-neon"
                    />
                  </div>
                  <label htmlFor="legal-consent" className="text-[11px] font-medium text-neutral-400 leading-normal cursor-pointer">
                    Я согласен с{" "}
                    <Link href="/legal/public-offer" target="_blank" className="text-neon hover:underline">Публичной офертой</Link>,{" "}
                    <Link href="/legal/terms" target="_blank" className="text-neon hover:underline">Пользовательским соглашением</Link>,{" "}
                    <Link href="/legal/privacy" target="_blank" className="text-neon hover:underline">Политикой конфиденциальности</Link>,{" "}
                    <Link href="/legal/data-processing" target="_blank" className="text-neon hover:underline">Согласием на обработку персональных данных</Link>,{" "}
                    <Link href="/legal/advertising-consent" target="_blank" className="text-neon hover:underline">Согласием на рекламную рассылку</Link>
                    {" "}и{" "}
                    <Link href="/legal/cookies" target="_blank" className="text-neon hover:underline">Политикой использования Cookie</Link>
                  </label>
                </div>

                {status === "success" && (
                  <div className="p-4 rounded-2xl bg-neon/10 border border-neon/20 text-neon text-center font-bold text-sm">
                    Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.
                  </div>
                )}

                {status === "error" && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-center font-bold text-sm">
                    {errorMessage || "Произошла ошибка. Пожалуйста, попробуйте еще раз."}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={!agreed || status === "loading"}
                  className="w-full bg-neon text-black hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-2xl h-14 font-black uppercase tracking-widest shadow-[0_0_20px_rgba(92,243,135,0.3)] gap-2"
                >
                  {status === "loading" ? (
                    "Отправка..."
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Отправить сообщение
                    </>
                  )}
                </Button>

                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest text-center">
                  Все поля обязательны для заполнения для связи с нами
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6">
        <div className="max-w-4xl mx-auto glass-dark border border-white/10 rounded-[3rem] p-16 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-neon/5 blur-[120px] rounded-full -mr-32 -mt-32 pointer-events-none" />
          <div className="absolute bottom-0 left-0 p-32 bg-blue-500/5 blur-[120px] rounded-full -ml-32 -mb-32 pointer-events-none" />

          <div className="relative z-10 space-y-8">
            <h2 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter text-white">
              Готовы <span className="text-neon">начать?</span>
            </h2>
            <p className="text-xl text-neutral-400 font-medium max-w-2xl mx-auto leading-relaxed">
              Присоединяйтесь к сотням довольных клиентов и обеспечьте свой бизнес 
              легальной музыкой уже сегодня.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/pricing">
                <Button className="bg-neon text-black hover:scale-105 transition-transform rounded-2xl px-10 h-14 font-black uppercase tracking-widest shadow-[0_0_30px_rgba(92,243,135,0.4)]">
                  Выбрать тариф
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/5 backdrop-blur-sm rounded-2xl px-10 h-14 font-black uppercase tracking-widest"
                >
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
