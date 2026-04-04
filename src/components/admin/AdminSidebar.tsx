"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Mic,
  Music,
  Users,
  CreditCard,
  ShieldCheck,
  Settings,
  ChevronRight,
  LogOut,
  ShieldAlert,
  BookOpen,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { getAdminSupportBadgeCountAction } from "@/lib/actions/support";

const adminNavItems = [
  { name: "Обзор", href: "/admin", icon: LayoutDashboard },
  { name: "Медиатека", href: "/admin/content", icon: Music },
  { name: "Песня Недели", href: "/admin/song-of-the-week", icon: Music },
  { name: "Аналитика", href: "/admin/analytics", icon: BarChart3 },
  { name: "Блог", href: "/admin/blog", icon: BookOpen },
  { name: "Клиенты", href: "/admin/clients", icon: Users },
  { name: "Brand Voice", href: "/admin/brand-voice", icon: Mic },
  { name: "Поддержка", href: "/admin/support", icon: MessageSquare },
  { name: "Комплаенс", href: "/admin/logs", icon: ShieldCheck },
  { name: "Финансы", href: "/admin/billing", icon: CreditCard },
  { name: "Настройки", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [supportBadge, setSupportBadge] = useState(0);

  useEffect(() => {
    getAdminSupportBadgeCountAction().then((res) => {
      if (res.success) setSupportBadge(res.count);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  return (
    <aside className="w-80 border-r border-white/5 bg-black/50 backdrop-blur-xl flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="p-8 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-neon rounded-xl flex items-center justify-center rotate-3 group-hover:rotate-6 transition-transform shadow-[0_0_20px_rgba(92,243,135,0.3)]">
            <ShieldAlert className="w-6 h-6 text-black" />
          </div>
          <div>
            <span className="text-xl font-black uppercase tracking-tighter leading-none block">Бизнес<br /><span className="text-neon">Музыка</span></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Админ-панель</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
        {adminNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const isSupport = item.href === "/admin/support";

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group",
                isActive 
                  ? "bg-neon/10 border-neon/20 text-neon shadow-[0_0_20px_rgba(92,243,135,0.05)]" 
                  : "border-transparent text-neutral-400 hover:border-white/5 hover:text-white hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-4">
                <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-neon" : "text-neutral-500 group-hover:text-white")} />
                <span className="text-xs font-black uppercase tracking-widest leading-none">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {isSupport && supportBadge > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                    {supportBadge > 99 ? "99+" : supportBadge}
                  </span>
                )}
                <ChevronRight className={cn("w-4 h-4 opacity-0 transition-all", isActive ? "opacity-30" : "group-hover:opacity-20 translate-x-1")} />
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Account */}
      <div className="p-6 border-t border-white/5 space-y-4">
        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neon/20 flex items-center justify-center border border-neon/20">
            <Users className="w-4 h-4 text-neon" />
          </div>
          <div className="min-w-0">
             <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 truncate">Super Admin</p>
             <p className="text-xs font-bold text-white truncate">Administrator</p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-4 text-neutral-500 hover:text-red-500 transition-colors uppercase text-[10px] font-black tracking-widest group"
        >
          <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          Выйти из системы
        </button>
      </div>
    </aside>
  );
}
