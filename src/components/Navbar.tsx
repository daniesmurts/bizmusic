"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Music, Menu, User, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export const Navbar = () => {
  const { user, role, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          <Link href="/products" className="text-neutral-400 hover:text-neon transition-colors">Продукты</Link>
          <Link href="/blog" className="text-neutral-400 hover:text-neon transition-colors">Блог</Link>
          <Link href="/about" className="text-neutral-400 hover:text-neon transition-colors">О нас</Link>
          <Link href="/pricing" className="text-neutral-400 hover:text-neon transition-colors">Тарифы</Link>
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
                className="text-neutral-400 hover:text-neon font-black uppercase tracking-widest text-xs"
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
          
          {/* Close Button Inside Overlay */}
          <div className="absolute top-8 right-8 z-[70]">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/10 rounded-full w-12 h-12"
              onClick={() => setIsMenuOpen(false)}
            >
              <X className="w-8 h-8" />
            </Button>
          </div>

          <div className="relative h-full flex flex-col items-center justify-center gap-12 p-6 text-center">
            <div className="flex flex-col gap-8 text-3xl font-black uppercase tracking-[0.25em]">
              {role === 'ADMIN' && (
                <Link href="/admin/content" onClick={() => setIsMenuOpen(false)} className="text-neon">Админ</Link>
              )}
              <Link href="/products" onClick={() => setIsMenuOpen(false)} className="text-white hover:text-neon transition-colors">Продукты</Link>
              <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="text-white hover:text-neon transition-colors">Блог</Link>
              <Link href="/about" onClick={() => setIsMenuOpen(false)} className="text-white hover:text-neon transition-colors">О нас</Link>
              <Link href="/pricing" onClick={() => setIsMenuOpen(false)} className="text-white hover:text-neon transition-colors">Тарифы</Link>
              {!user && (
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="text-neutral-400 hover:text-neon transition-colors">Войти</Link>
              )}
            </div>
            
            {user ? (
              <Button 
                variant="ghost" 
                className="text-neon font-black uppercase tracking-widest text-xl mt-4"
                onClick={() => {
                  signOut();
                  setIsMenuOpen(false);
                }}
              >
                Выйти
              </Button>
            ) : (
              <Button asChild className="bg-neon text-black rounded-full px-16 py-10 text-2xl font-black uppercase tracking-widest mt-4 shadow-2xl shadow-neon/40">
                <Link href="/register" onClick={() => setIsMenuOpen(false)}>Регистрация</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
