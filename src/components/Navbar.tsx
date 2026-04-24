"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Music,
  Menu,
  User,
  Users,
  X,
  LayoutDashboard,
  Play,
  CreditCard,
  FileText,
  Settings,
  ChevronRight,
  Mic,
  ChevronDown,
  Coffee,
  Utensils,
  Building2,
  ShoppingBag,
  Gem,
  Scissors,
  Car,
  ShoppingCart,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import { niches } from "@/lib/data/niches";
import type { LucideIcon } from "lucide-react";

const NicheIconMap: Record<string, LucideIcon> = {
  Coffee, Utensils, Building2, ShoppingBag, Gem, Scissors, Car, ShoppingCart
};

export const Navbar = () => {
  const { user, role, loading, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNicheOpen, setIsNicheOpen] = useState(false);
  const pathname = usePathname();
  const isDashboard = pathname.startsWith('/dashboard');
  const isPartner = role === 'PARTNER';

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

  const dashboardNavItems = [
    { name: "Обзор", href: "/dashboard", icon: LayoutDashboard },
    { name: "Плеер", href: "/dashboard/player", icon: Play },
    { name: "Анонсы", href: "/dashboard/announcements", icon: Mic },
    { name: "Brand Voice", href: "/dashboard/brand-voice", icon: Mic },
    { name: "Филиалы", href: "/dashboard/branches", icon: Building2 },
    { name: "Подписка", href: "/dashboard/subscription", icon: CreditCard },
    { name: "Договор", href: "/dashboard/contract", icon: FileText },
    { name: "База знаний", href: "/knowledge", icon: BookOpen },
    { name: "Настройки", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-4">
      <div className="max-w-7xl mx-auto glass rounded-full px-6 py-3 flex items-center justify-between border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-neon rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-neon/20">
            <Music className="text-black w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white uppercase sm:block hidden">
            Бизнес<span className="text-neon">Музыка</span>
          </span>
        </Link>

        {/* Links - Desktop — hidden for partners (their sidebar is the only nav they need) */}
        <div className="hidden xl:flex items-center gap-8 text-sm font-black uppercase tracking-widest leading-none">
          {role === 'ADMIN' && (
            <Link href="/admin/content" className="text-neon hover:text-white transition-colors">Админ</Link>
          )}
          {isDashboard && isPartner ? null : isDashboard ? (
            <>
               <Link href="/dashboard" className={cn("transition-colors", pathname === "/dashboard" ? "text-neon" : "text-neutral-400 hover:text-white")}>Дашборд</Link>
               <Link href="/products" className="text-neutral-400 hover:text-neon transition-colors">Каталог</Link>
            </>
          ) : (
            <>
               <Link href="/products" className="text-neutral-400 hover:text-neon transition-colors">Решения</Link>
               
               {/* Niche Dropdown */}
               <div className="relative group py-4">
                 <button className="flex items-center gap-1.5 text-neutral-400 group-hover:text-neon transition-all duration-300 font-black uppercase tracking-widest">
                   Ниши <ChevronDown className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                 </button>
                 <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-72 p-5 glass-dark rounded-[2.5rem] border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-[0_30px_60px_rgba(0,0,0,0.8)] z-[110]">
                    <div className="grid gap-2">
                      {Object.values(niches).map((niche) => {
                        const Icon = NicheIconMap[niche.icon] || Music;
                        return (
                          <Link 
                            key={niche.slug} 
                            href={`/solutions/${niche.slug}`}
                            className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/[0.03] text-neutral-400 hover:text-white transition-all group/item border border-transparent hover:border-white/5"
                          >
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover/item:border-neon/30 border border-transparent transition-all shadow-inner">
                               <Icon className="w-5 h-5 text-neutral-500 group-hover/item:text-neon transition-colors" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest">{niche.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                 </div>
               </div>

               <Link href="/blog" className="hidden xl:block text-neutral-400 hover:text-neon transition-colors">Блог</Link>
               <Link href="/about" className="hidden xl:block text-neutral-400 hover:text-neon transition-colors">О нас</Link>
               <Link href="/pricing" className="text-neutral-400 hover:text-neon transition-colors">Тарифы</Link>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {loading ? (
            /* Auth resolving — show a neutral placeholder so we never flash Login/Register */
            <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
          ) : user ? (
             <div className="flex items-center gap-4">
               <Link
                 href={isPartner ? "/dashboard/affiliate" : "/dashboard"}
                 className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors overflow-hidden"
               >
                 {user.user_metadata?.avatar_url ? (
                   <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                 ) : (
                   <User className="w-5 h-5 text-neutral-400" />
                 )}
               </Link>
               <Button
                 variant="ghost"
                 className="text-neutral-400 hover:text-neon font-black uppercase tracking-widest text-xs md:flex hidden"
                 onClick={() => { void signOut(); }}
               >
                 Выйти
               </Button>
             </div>
           ) : (
             <>
               <Link href="/login" className="text-sm font-black uppercase tracking-widest text-neutral-400 hover:text-neon transition-colors hidden sm:block">
                 Войти
               </Link>
               <Button asChild className="bg-neon text-black hover:scale-105 transition-transform rounded-full px-6 xl:px-8 font-black uppercase tracking-widest text-xs h-11 border-none outline-none">
                 <Link href="/register">Регистрация</Link>
               </Button>
             </>
           )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="xl:hidden text-white hover:bg-white/5 rounded-full touch-manipulation z-10"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] xl:hidden animate-in fade-in duration-300">
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
                className="text-white hover:bg-white/10 rounded-full w-10 h-10 touch-manipulation z-10"
                onClick={() => setIsMenuOpen(false)}
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            <div className="mt-8 space-y-8">
              {/* Dashboard Section */}
              {isDashboard && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 pl-4">
                    {isPartner ? "Партнёрский кабинет" : "Управление бизнесом"}
                  </h3>
                  <div className="grid gap-2">
                    {(isPartner ? [{ name: "Кабинет партнёра", href: "/dashboard/affiliate", icon: Users }] : dashboardNavItems).map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
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

              {/* Main Links — hidden for partners, they have no need for marketing pages from their dashboard */}
              {!isPartner && (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 pl-4">Навигация</h3>
                  <div className="grid gap-2">
                    <Link
                      href="/products"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-white/70 hover:text-white transition-all"
                    >
                      <span className="font-black uppercase tracking-widest text-xs">Решения</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>

                    {/* Mobile Niche Accordion */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setIsNicheOpen(!isNicheOpen)}
                        className="w-full flex items-center justify-between p-4 text-white/70 hover:text-white transition-all"
                      >
                        <span className="font-black uppercase tracking-widest text-xs">Ниши для бизнеса</span>
                        <ChevronRight className={cn("w-4 h-4 transition-transform", isNicheOpen && "rotate-90")} />
                      </button>
                      {isNicheOpen && (
                        <div className="px-4 pb-4 grid gap-1 border-t border-white/5 pt-2">
                          {Object.values(niches).map((niche) => (
                            <Link
                              key={niche.slug}
                              href={`/solutions/${niche.slug}`}
                              onClick={() => {
                                setIsMenuOpen(false);
                                setIsNicheOpen(false);
                              }}
                              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-neutral-400 hover:text-white transition-colors"
                            >
                              {(() => { const Icon = NicheIconMap[niche.icon] || Music; return <Icon className="w-3.5 h-3.5" />; })()}
                              <span className="text-[10px] font-black uppercase tracking-widest">{niche.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

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
                  </div>
                </div>
              )}

              {/* Account Section */}
              <div className="pt-8 border-t border-white/5 flex flex-col gap-4">
                {loading ? (
                  <div className="h-14 rounded-2xl bg-white/5 animate-pulse" />
                ) : user ? (
                  <Button
                    variant="destructive"
                    className="h-14 rounded-2xl font-black uppercase tracking-widest text-xs gap-3"
                    onClick={() => {
                      void signOut();
                      setIsMenuOpen(false);
                    }}
                  >
                    Выйти из аккаунта
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" className="h-14 rounded-2xl font-black uppercase tracking-widest text-xs border-white/20 text-white hover:bg-white/10">
                      <Link href="/login" onClick={() => setIsMenuOpen(false)}>Войти в аккаунт</Link>
                    </Button>
                    <Button asChild className="h-14 bg-neon text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-neon/20">
                      <Link href="/register" onClick={() => setIsMenuOpen(false)}>Начать бесплатно</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
