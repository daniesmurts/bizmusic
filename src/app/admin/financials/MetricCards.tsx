"use client";

import { Banknote, Users, Receipt, PiggyBank, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PnLMetrics } from "./types";
import { formatRubles, formatPercent } from "./types";

interface Props {
  pnl: PnLMetrics;
}

export function MetricCards({ pnl }: Props) {
  const cards = [
    {
      label: "MRR",
      value: formatRubles(pnl.mrr),
      sub: `${pnl.currentSubscribers} подписчиков`,
      icon: Banknote,
      color: "text-neon",
      bg: "bg-neon/10",
      borderColor: "border-neon/20",
    },
    {
      label: "Выплаты амбассадорам",
      value: formatRubles(pnl.ambassadorPayouts),
      sub: `${formatPercent(pnl.mrr > 0 ? (pnl.ambassadorPayouts / pnl.mrr) * 100 : 0)} от MRR`,
      icon: Users,
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      borderColor: "border-orange-400/20",
    },
    {
      label: "Общие расходы",
      value: formatRubles(pnl.totalCosts),
      sub: `${formatPercent(pnl.mrr > 0 ? (pnl.totalCosts / pnl.mrr) * 100 : 0)} от MRR`,
      icon: Receipt,
      color: "text-red-400",
      bg: "bg-red-400/10",
      borderColor: "border-red-400/20",
    },
    {
      label: "Чистая прибыль",
      value: formatRubles(pnl.netProfit),
      sub: `Маржа: ${formatPercent(pnl.netMarginPercent)}`,
      icon: PiggyBank,
      color: pnl.netProfit >= 0 ? "text-neon" : "text-red-400",
      bg: pnl.netProfit >= 0 ? "bg-neon/10" : "bg-red-400/10",
      borderColor: pnl.netProfit >= 0 ? "border-neon/20" : "border-red-400/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={cn(
              "group relative p-7 bg-white/[0.02] border rounded-[2rem] overflow-hidden transition-all duration-500 hover:border-white/10",
              card.borderColor
            )}
          >
            {/* Glow */}
            <div
              className={cn(
                "absolute top-0 right-0 p-16 blur-[80px] rounded-full opacity-20",
                card.bg
              )}
            />

            <div className="relative z-10 flex flex-col gap-5">
              <div
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110",
                  card.bg,
                  card.borderColor
                )}
              >
                <Icon className={cn("w-5 h-5", card.color)} />
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  {card.label}
                </p>
                <p className="text-2xl font-black tracking-tighter text-white leading-none">
                  {card.value}
                </p>
                <p className="text-xs text-neutral-500 font-medium">{card.sub}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
