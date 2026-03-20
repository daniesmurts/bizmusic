"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Music, Menu, User } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export const Navbar = () => {
  const { user, role, signOut } = useAuth();

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
          <Link href="/playlists" className="text-neutral-400 hover:text-neon transition-colors">Плейлисты</Link>
          <Link href="/compliance" className="text-neutral-400 hover:text-neon transition-colors">Право</Link>
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
          <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/5 rounded-full">
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </nav>
  );
};
