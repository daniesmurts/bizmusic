"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Building2,
  Play,
  CreditCard,
  FileText,
  LayoutDashboard,
  Music,
  ChevronRight,
  Settings,
  Mic,
  BookOpen,
  Users,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/dashboard/BottomNav";
import { MiniPlayer } from "@/components/dashboard/MiniPlayer";
import { getBusinessDetailsAction } from "@/lib/actions/dashboard";
import { useAuth } from "@/components/AuthProvider";
import { getMyUnreadSupportReplyAction } from "@/lib/actions/support";
import { isBusinessProfileComplete } from "@/lib/validation/business";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useAuth();
  const [isSigned, setIsSigned] = useState(false);
  const [hasUnreadSupport, setHasUnreadSupport] = useState(false);
  const isBranchManager = role === "STAFF";
  const isPartner = role === "PARTNER";

  // Track whether we already fetched business status — avoids a DB call on
  // every navigation click (layout re-renders when pathname changes).
  const businessCheckedRef = useRef(false);
  // Track last support-check time — only re-check every 60 s, not on every nav.
  const lastSupportCheckRef = useRef(0);

  useEffect(() => {
    if (role === null) return;

    // --- Role-based redirect: runs on every pathname change (cheap, no DB) ---
    if (isPartner) {
      if (!pathname.startsWith("/dashboard/affiliate") && !pathname.startsWith("/dashboard/leads")) router.push("/dashboard/affiliate");
      return;
    }
    if (isBranchManager) {
      const staffAllowedRoutes = ["/dashboard/player", "/dashboard/announcements"];
      if (!staffAllowedRoutes.some((r) => pathname.startsWith(r))) {
        router.push("/dashboard/player");
      }
      setIsSigned(true);
    }

    // --- Business profile check: runs ONCE per session, not on every nav ---
    if (!isBranchManager && !businessCheckedRef.current) {
      businessCheckedRef.current = true;
      getBusinessDetailsAction()
        .then((result) => {
          const isSetupRoute = pathname.startsWith("/dashboard/setup");
          if (result.success && result.data?.subscriptionStatus === "ACTIVE") {
            setIsSigned(true);
          }
          const needsSetup = !result.data || !isBusinessProfileComplete({
            inn: result.data.inn,
            legalName: result.data.legalName,
            address: result.data.address,
          });
          if (needsSetup && !isSetupRoute) router.push("/dashboard/setup");
        })
        .catch((err) => console.error("Failed to check business status in layout", err));
    }

    // --- Support unread check: at most once every 60 s ---
    const now = Date.now();
    if (!isPartner && now - lastSupportCheckRef.current > 60_000) {
      lastSupportCheckRef.current = now;
      getMyUnreadSupportReplyAction().then((res) => {
        if (res.success) setHasUnreadSupport(res.hasUnread);
      });
    }
  }, [isBranchManager, isPartner, pathname, role, router]);

  const navItems = role === null
    ? [] // auth resolving — render nothing so we never flash B2B items to a partner
    : isPartner
    ? [
        {
          name: "Кабинет партнёра",
          href: "/dashboard/affiliate",
          icon: Users,
        },
        {
          name: "Мои лиды",
          href: "/dashboard/leads",
          icon: Phone,
        },
      ]
    : isBranchManager
    ? [
        {
          name: "Плеер",
          href: "/dashboard/player",
          icon: Play,
        },
        {
          name: "Анонсы",
          href: "/dashboard/announcements",
          icon: Mic,
        },
      ]
    : [
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
          name: "Анонсы",
          href: "/dashboard/announcements",
          icon: Mic,
        },
        {
          name: "Brand Voice",
          href: "/dashboard/brand-voice",
          icon: Mic,
        },
        {
          name: "Филиалы",
          href: "/dashboard/branches",
          icon: Building2,
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
          name: "Партнёрам",
          href: "/dashboard/affiliate",
          icon: Users,
        },
        {
          name: "Настройки",
          href: "/dashboard/settings",
          icon: Settings,
        },
      ];

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <div className="flex flex-1 gap-6 lg:gap-8 p-6 lg:p-12 pb-40 lg:pb-12">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex w-72 flex-col gap-6">
          <div className="glass-dark border border-white/10 rounded-[2.5rem] p-6 space-y-2">
            <div className="px-4 py-2 mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Управление</span>
            </div>

            <nav className="space-y-1">
              {role === null ? (
                /* Loading skeleton — prevents B2B items from flashing before role resolves */
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-4 rounded-2xl border border-transparent">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800 animate-pulse" />
                    <div className="h-3 w-24 bg-neutral-800 animate-pulse rounded-full" />
                  </div>
                ))
              ) : (
                navItems.map((item) => {
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
                })
              )}
            </nav>
          </div>

          {/* Support/Info Card — not shown for partners (irrelevant to their workflow) */}
          {!isPartner && (
            <div className="glass-dark border border-white/10 rounded-[2.5rem] p-8 space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 text-neon/10 group-hover:text-neon/20 transition-colors">
                <Music className="w-16 h-16" />
              </div>
              <div className="relative z-10 space-y-4">
                <h4 className="text-sm font-black uppercase text-white tracking-widest leading-tight">Нужна помощь <br />с настройкой?</h4>
                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Наш персональный менеджер доступен 24/7</p>
                <Link href="/dashboard/support" className="inline-flex items-center gap-2 text-neon text-[10px] font-black uppercase tracking-[0.2em] hover:underline underline-offset-4 transition-all">
                  Чат поддержки
                  {hasUnreadSupport && (
                    <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse" />
                  )}
                </Link>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 flex flex-col pb-48 lg:pb-0">
          <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
          <Footer variant="dashboard" />
          <div className="h-32 lg:hidden" />
        </main>
      </div>

      {/* Persistent Mini Player — only for B2B clients/staff, not partners */}
      {!isPartner && <MiniPlayer />}

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
