"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Play,
  Mic,
  CreditCard,
  Menu,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

export function BottomNav({ onMoreClick }: { onMoreClick?: () => void }) {
  const pathname = usePathname();
  const { role } = useAuth();
  const isBranchManager = role === "STAFF";
  const isPartner = role === "PARTNER";

  const items = isPartner
    ? [{ name: "Кабинет", href: "/dashboard/affiliate", icon: Users }]
    : isBranchManager
    ? [
        { name: "Плеер", href: "/dashboard/player", icon: Play },
        { name: "Анонсы", href: "/dashboard/announcements", icon: Mic },
      ]
    : [
        { name: "Обзор", href: "/dashboard", icon: LayoutDashboard, exact: true },
        { name: "Плеер", href: "/dashboard/player", icon: Play },
        { name: "Анонсы", href: "/dashboard/announcements", icon: Mic },
        { name: "Подписка", href: "/dashboard/subscription", icon: CreditCard },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[90] lg:hidden">
      <div className="bg-black/90 backdrop-blur-xl border-t border-white/10 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        <div className="flex items-center justify-around h-16">
          {items.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[60px] touch-manipulation",
                  isActive
                    ? "text-neon"
                    : "text-neutral-500 active:text-white"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_6px_rgba(92,243,135,0.5)]")} />
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                  {item.name}
                </span>
              </Link>
            );
          })}
          {!isBranchManager && !isPartner && (
            <button
              onClick={onMoreClick}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl text-neutral-500 active:text-white transition-colors min-w-[60px] touch-manipulation"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                Ещё
              </span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
