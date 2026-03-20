"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Music, Menu, Search, User } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/5">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-neon rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Music className="text-black w-6 h-6" />
            </div>
            <span className="text-xl font-black tracking-tighter text-white">
              БИЗНЕС<span className="text-neon">МУЗЫКА</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/browse" className="text-sm font-medium text-neutral-400 hover:text-neon transition-colors">
              Обзор
            </Link>
            <Link href="/playlists" className="text-sm font-medium text-neutral-400 hover:text-neon transition-colors">
              Плейлисты
            </Link>
            <Link href="/compliance" className="text-sm font-medium text-neutral-400 hover:text-neon transition-colors">
              Комплаенс
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-neutral-400 hover:text-neon transition-colors">
              Тарифы
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 text-neutral-400 hover:text-white transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />
          <Link href="/login" className="hidden sm:block">
            <Button variant="ghost" className="text-neutral-400 hover:text-white hover:bg-white/5">
              Войти
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-neon text-black hover:opacity-90 font-bold rounded-full px-6">
              Регистрация
            </Button>
          </Link>
          <button className="md:hidden p-2 text-neutral-400">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>
    </nav>
  );
}
