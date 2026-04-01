import Link from "next/link";
import { Music, MessageSquare, Mail, ShieldCheck, ExternalLink } from "lucide-react";

interface FooterProps {
  variant?: "default" | "dashboard" | "admin";
}

export function Footer({ variant = "default" }: FooterProps) {
  const currentYear = new Date().getFullYear();

  if (variant === "dashboard") {
    return (
      <footer className="border-t border-white/5 px-6 py-4 md:py-8 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">
          <div className="flex items-center gap-2 text-neutral-500 font-bold uppercase tracking-widest text-[10px]">
            © {currentYear} Бизнес Музыка. 100% Легально.
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3">
            <Link href="/legal/terms" className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-neon transition-colors">Оферта</Link>
            <Link href="/legal/privacy" className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-neon transition-colors">Политика</Link>
            <Link href="/knowledge" className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-neon transition-colors">Справка</Link>
            <Link href="/about" className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-neon transition-colors">Контакты</Link>
          </div>
        </div>
      </footer>
    );
  }

  if (variant === "admin") {
    return (
      <footer className="border-t border-white/5 px-10 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600 italic">
              © {currentYear} BizMusic HQ. Admin Access Only.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-neon transition-colors">На сайт</Link>
            <Link href="/legal/privacy" className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-neon transition-colors">Security</Link>
            <Link href="/about" className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-neon transition-colors">Support</Link>
          </div>
        </div>
      </footer>
    );
  }

  // Default variant for public pages
  return (
    <footer className="bg-[#0a0c12] border-t border-white/8 px-6 md:px-12 pt-20 pb-12 overflow-hidden relative">
      {/* Decorative Blur */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-neon/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-neon rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-neon/20">
                <Music className="text-black w-6 h-6" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white uppercase">
                Бизнес<span className="text-neon">Музыка</span>
              </span>
            </Link>
            <p className="text-neutral-500 text-sm font-medium leading-relaxed max-w-xs">
              Первая в России PWA-платформа для легального музыкального вещания. Мы создаем атмосферу, которая помогает вашему бизнесу расти.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/5 text-neutral-400 hover:text-neon hover:border-neon transition-all">
                <Mail className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/5 text-neutral-400 hover:text-neon hover:border-neon transition-all">
                <MessageSquare className="w-4 h-4" />
              </a>
              <a href="https://t.me/bizmuzik_ru" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/5 text-neutral-400 hover:text-neon hover:border-neon transition-all">
                 <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.36-.49.99-.75 3.84-1.67 6.41-2.77 7.71-3.3 3.66-1.51 4.42-1.77 4.92-1.78.11 0 .35.03.51.16.13.1.17.24.19.34.02.09.03.26.02.39z"/></svg>
              </a>
            </div>
          </div>

          {/* Column 2: Solutions & Niches */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white">Решения по нишам</h4>
            <nav className="flex flex-col gap-4">
              {[
                { name: "Все решения", href: "/products" },
                { name: "Для кафе", href: "/solutions/cafe" },
                { name: "Для ресторанов", href: "/solutions/restaurant" },
                { name: "Для ритейла", href: "/solutions/retail" },
                { name: "Для офисов", href: "/solutions/office" },
                { name: "Для ТЦ", href: "/solutions/mall" },
              ].map((link) => (
                <Link key={link.name} href={link.href} className="text-sm font-bold text-neutral-500 hover:text-neon transition-colors uppercase tracking-widest text-[11px]">
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 3: Company */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white">Компания</h4>
            <nav className="flex flex-col gap-4">
              {[
                { name: "О нас", href: "/about" },
                { name: "Блог", href: "/blog" },
                { name: "Тарифы", href: "/pricing" },
                { name: "База знаний", href: "/knowledge" },
                { name: "Записаться на демо", href: "/demo" }
              ].map((link) => (
                <Link key={link.name} href={link.href} className="text-sm font-bold text-neutral-500 hover:text-neon transition-colors uppercase tracking-widest text-[11px]">
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Column 4: Legal & Support */}
          <div className="space-y-6">
             <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white">Юридические данные</h4>
             <nav className="flex flex-col gap-4">
              {[
                { name: "Публичная оферта", href: "/legal/terms" },
                { name: "Конфиденциальность", href: "/legal/privacy" },
                { name: "Личный кабинет", href: "/dashboard" },
                { name: "Вопросы и ответы", href: "/#faq" }
              ].map((link) => (
                <Link key={link.name} href={link.href} className="text-sm font-bold text-neutral-500 hover:text-neon transition-colors uppercase tracking-widest text-[11px]">
                  {link.name}
                </Link>
              ))}
            </nav>
            <div className="pt-4 flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                 <ShieldCheck className="w-4 h-4 text-green-400" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                 100% защита <br /> от РАО и ВОИС
               </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">
            © {currentYear} ООО "Бизнес Музыка". Все права защищены. <span className="hidden md:inline ml-2">•</span> <span className="md:ml-2">Сделано с ❤️ для бизнеса</span>
          </p>
          <div className="flex items-center gap-6">
             <Link href="/legal/advertising-consent" className="text-[10px] font-black uppercase tracking-widest text-neutral-600 hover:text-neon transition-colors">Рассылка</Link>
             <div className="h-1 w-1 bg-neutral-800 rounded-full" />
             <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 italic">v2.4.0 Stable</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
