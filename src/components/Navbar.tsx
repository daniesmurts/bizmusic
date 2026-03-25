"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { 
  Music, 
  Menu, 
  User, 
  X, 
  LayoutDashboard, 
  Play, 
  CreditCard, 
  FileText, 
  Settings,
  ChevronRight,
  Mic
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const { user, role, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const dashboardNavItems = [
    { name: "Обзор", href: "/dashboard", icon: LayoutDashboard },
    { name: "Плеер", href: "/dashboard/player", icon: Play },
    { name: "Объявления", href: "/dashboard/announcements", icon: Mic },
    { name: "Подписка", href: "/dashboard/subscription", icon: CreditCard },
    { name: "Договор", href: "/dashboard/contract", icon: FileText },
    { name: "Настройки", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto glass rounded-full px-6 py-3 flex items-center justify-between border border-white/10 shadow-2xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-neon rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-neon/20">
            <Music className="text-black w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white uppercase sm:block hidden">
            Бизнес<span className="text-neon">Музыка</span>
          </span>
        </Link>

        {/* Links - Desktop */}
        <div className="hidden md:flex items-center gap-8 text-sm font-black uppercase tracking-widest">
          {role === 'ADMIN' && (
            <Link href="/admin/content" className="text-neon hover:text-white transition-colors">Админ</Link>
          )}
          {isDashboard ? (
            <>
               <Link href="/dashboard" className={cn("transition-colors", pathname === "/dashboard" ? "text-neon" : "text-neutral-400 hover:text-white")}>Дашборд</Link>
               <Link href="/products" className="text-neutral-400 hover:text-neon transition-colors">Каталог</Link>
            </>
          ) : (
            <>
              <Link href="/products" className="text-neutral-400 hover:text-neon transition-colors">Продукты</Link>
              <Link href="/blog" className="text-neutral-400 hover:text-neon transition-colors">Блог</Link>
              <Link href="/about" className="text-neutral-400 hover:text-neon transition-colors">О нас</Link>
              <Link href="/pricing" className="text-neutral-400 hover:text-neon transition-colors">Тарифы</Link>
              <Link href="/knowledge" className="text-neutral-400 hover:text-neon transition-colors">База знаний</Link>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors overflow-hidden">
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-neutral-400" />
                )}
              </Link>
              <Button 
                variant="ghost" 
                className="text-neutral-400 hover:text-neon font-black uppercase tracking-widest text-xs md:flex hidden"
                onClick={() => signOut()}
              >
                Выйти
              </Button>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm font-black uppercase tracking-widest text-neutral-400 hover:text-neon transition-colors md:block hidden">
                Войти
              </Link>
              <Button asChild className="bg-neon text-black hover:scale-105 transition-transform rounded-full px-8 font-black uppercase tracking-widest text-xs h-11 border-none outline-none">
                <Link href="/register">Регистрация</Link>
              </Button>
            </>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-white hover:bg-white/5 rounded-full"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
          
          <div className="relative h-full flex flex-col p-6 overflow-y-auto">
            <div className="flex justify-between items-center py-4">
              <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-neon rounded-lg flex items-center justify-center">
                  <Music className="text-black w-5 h-5" />
                </div>
                <span className="text-lg font-black tracking-tighter text-white uppercase">Бизнес<span className="text-neon">Музыка</span></span>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/10 rounded-full w-10 h-10"
                onClick={() => setIsMenuOpen(false)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            <div className="mt-8 space-y-8">
              {/* Dashboard Section */}
              {isDashboard && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 pl-4">Управление бизнесом</h3>
                  <div className="grid gap-2">
                    {dashboardNavItems.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                            isActive 
                              ? "bg-neon/10 border-neon/20 text-neon" 
                              : "bg-white/[0.02] border-white/5 text-white/70"
                          )}
                        >
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", isActive ? "bg-neon text-black" : "bg-white/5")}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-black uppercase tracking-widest text-xs">{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Main Links */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 pl-4">Навигация</h3>
                <div className="grid gap-2">
                  <Link 
                    href="/products" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-white/70 hover:text-white transition-all"
                  >
                    <span className="font-black uppercase tracking-widest text-xs">Продукты</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link 
                    href="/pricing" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-white/70 hover:text-white transition-all"
                  >
                    <span className="font-black uppercase tracking-widest text-xs">Тарифы</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link 
                    href="/about" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-white/70 hover:text-white transition-all"
                  >
                    <span className="font-black uppercase tracking-widest text-xs">О компании</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link 
                    href="/knowledge" 
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-white/70 hover:text-white transition-all font-black uppercase tracking-widest text-xs"
                  >
                    <span>База знаний</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Account Section */}
              <div className="pt-8 border-t border-white/5 flex flex-col gap-4">
                {user ? (
                  <Button 
                    variant="destructive" 
                    className="h-14 rounded-2xl font-black uppercase tracking-widest text-xs gap-3"
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                  >
                    Выйти из аккаунта
                  </Button>
                ) : (
                  <Button asChild className="h-14 bg-neon text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-neon/20">
                    <Link href="/register" onClick={() => setIsMenuOpen(false)}>Начать бесплатно</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
