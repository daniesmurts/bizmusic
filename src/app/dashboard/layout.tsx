"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  BarChart3,
  Play,
  CreditCard,
  FileText,
  LayoutDashboard,
  Music,
  ChevronRight,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Mic,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/Footer";
import { getBusinessDetailsAction } from "@/lib/actions/dashboard";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const [isSigned, setIsSigned] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const result = await getBusinessDetailsAction();
        if (result.success && result.data?.subscriptionStatus === "ACTIVE") {
          setIsSigned(true);
        } else {
          setIsSigned(false);
        }
      } catch (err) {
        console.error("Failed to check business status in layout", err);
      }
    }
    checkStatus();
  }, [pathname]);

  const navItems = [
    {
      name: "Обзор",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Плеер",
      href: "/dashboard/player",
      icon: Play,
    },
    {
      name: "Объявления",
      href: "/dashboard/announcements",
      icon: Mic,
    },
    {
      name: "Подписка",
      href: "/dashboard/subscription",
      icon: CreditCard,
    },
    {
      name: "Договор",
      href: "/dashboard/contract",
      icon: FileText,
      hasAction: true,
      status: isSigned ? 'success' : 'action'
    },
    {
      name: "База знаний",
      href: "/knowledge",
      icon: BookOpen,
    },
    {
      name: "Настройки",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <div className="flex flex-1 gap-6 lg:gap-8 p-6 lg:p-12">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex w-72 flex-col gap-6">
          <div className="glass-dark border border-white/10 rounded-[2.5rem] p-6 space-y-2">
            <div className="px-4 py-2 mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Управление</span>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-300 group",
                      isActive
                        ? "bg-neon/10 text-neon border border-neon/20 shadow-[0_0_20px_rgba(92,243,135,0.05)]"
                        : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        isActive ? "bg-neon text-black" : "bg-neutral-900 group-hover:bg-neutral-800"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-black uppercase tracking-widest text-xs">{item.name}</span>
                    </div>

                    {item.hasAction && (
                      <div className="relative flex items-center">
                        <div className={cn(
                          "w-2 h-2 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse",
                          item.status === 'success' ? "bg-neon shadow-neon/50" : "bg-red-500 shadow-red-500/50"
                        )} />
                      </div>
                    )}

                    {!item.hasAction && isActive && (
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Support/Info Card */}
          <div className="glass-dark border border-white/10 rounded-[2.5rem] p-8 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 text-neon/10 group-hover:text-neon/20 transition-colors">
              <Music className="w-16 h-16" />
            </div>
            <div className="relative z-10 space-y-4">
              <h4 className="text-sm font-black uppercase text-white tracking-widest leading-tight">Нужна помощь <br />с настройкой?</h4>
              <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Наш персональный менеджер доступен 24/7</p>
              <Link href="#" className="inline-block text-neon text-[10px] font-black uppercase tracking-[0.2em] hover:underline underline-offset-4 transition-all">Чат поддержки</Link>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
          <Footer variant="dashboard" />
        </main>
      </div>
    </div>
  );
}
