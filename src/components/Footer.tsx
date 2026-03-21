import Link from "next/link";

interface FooterProps {
  variant?: "default" | "dashboard" | "admin";
}

export function Footer({ variant = "default" }: FooterProps) {
  const currentYear = new Date().getFullYear();

  if (variant === "dashboard") {
    return (
      <footer className="border-t border-white/5 px-6 py-8 mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-tighter text-neutral-500">
              © {currentYear} Бизнес Музыка. Все права защищены.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/legal/terms" className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-neon transition-colors">
              Оферта
            </Link>
            <Link href="/legal/privacy" className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-neon transition-colors">
              Политика
            </Link>
            <Link href="/legal/advertising-consent" className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-neon transition-colors">
              Рассылка
            </Link>
            <Link href="/about" className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-neon transition-colors">
              Контакты
            </Link>
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
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">
              © {currentYear} Бизнес Музыка. Админ-панель.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/legal/terms" className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-neon transition-colors">
              Документация
            </Link>
            <Link href="/admin/settings" className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-neon transition-colors">
              Настройки
            </Link>
            <Link href="/about" className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-neon transition-colors">
              Поддержка
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  // Default variant for public pages
  return (
    <footer className="px-12 py-12 border-t border-white/5">
      <div className="flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter uppercase leading-none">
              Бизнес<span className="text-neon">Музыка</span>
            </span>
          </div>
          <p className="text-neutral-500 text-sm font-bold max-w-xs text-center md:text-left uppercase tracking-tighter">
            © {currentYear} Бизнес Музыка. 100% легальный контент в РФ.
          </p>
        </div>
        <div className="flex gap-10 text-xs font-black uppercase tracking-widest text-neutral-400">
          <Link href="/legal/terms" className="hover:text-neon transition-colors">
            Оферта
          </Link>
          <Link href="/legal/privacy" className="hover:text-neon transition-colors">
            Политика
          </Link>
          <Link href="/legal/advertising-consent" className="hover:text-neon transition-colors">
            Рассылка
          </Link>
          <Link href="/about" className="hover:text-neon transition-colors">
            Контакты
          </Link>
        </div>
      </div>
    </footer>
  );
}
