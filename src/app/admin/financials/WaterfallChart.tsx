"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type { PnLMetrics } from "./types";
import { formatRubles } from "./types";

interface Props {
  pnl: PnLMetrics;
}

interface WaterfallItem {
  name: string;
  value: number;
  base: number;    // invisible base bar for waterfall effect
  display: number;  // visible portion
  fill: string;
  isTotal?: boolean;
}

export function WaterfallChart({ pnl }: Props) {
  const data: WaterfallItem[] = useMemo(() => {
    const mrrRub = pnl.mrr / 100;
    const ambassadorRub = pnl.ambassadorPayouts / 100;
    const processingRub = pnl.processingFee / 100;
    const taxRub = pnl.tax / 100;
    const infraRub = pnl.infrastructureCost / 100;
    const netRub = pnl.netProfit / 100;

    let runningTotal = mrrRub;

    const items: WaterfallItem[] = [
      {
        name: "Выручка (MRR)",
        value: mrrRub,
        base: 0,
        display: mrrRub,
        fill: "#5cf387",
      },
    ];

    // Ambassador payouts
    runningTotal -= ambassadorRub;
    items.push({
      name: "Амбассадоры",
      value: -ambassadorRub,
      base: runningTotal,
      display: ambassadorRub,
      fill: "#f97316",
    });

    // Processing fee
    runningTotal -= processingRub;
    items.push({
      name: "Эквайринг",
      value: -processingRub,
      base: runningTotal,
      display: processingRub,
      fill: "#ef4444",
    });

    // Tax
    runningTotal -= taxRub;
    items.push({
      name: "УСН",
      value: -taxRub,
      base: runningTotal,
      display: taxRub,
      fill: "#a855f7",
    });

    // Infrastructure
    runningTotal -= infraRub;
    items.push({
      name: "Инфраструктура",
      value: -infraRub,
      base: runningTotal,
      display: infraRub,
      fill: "#6b7280",
    });

    // Net profit (result bar)
    items.push({
      name: "Чистая прибыль",
      value: netRub,
      base: 0,
      display: Math.abs(netRub),
      fill: netRub >= 0 ? "#5cf387" : "#ef4444",
      isTotal: true,
    });

    return items;
  }, [pnl]);

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: WaterfallItem }> }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0].payload;
    return (
      <div className="glass-dark border border-white/10 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-1">
          {item.name}
        </p>
        <p className="text-sm font-black text-white">
          {item.value >= 0 ? "+" : ""}
          {formatRubles(item.value * 100)}
        </p>
      </div>
    );
  };

  return (
    <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black uppercase tracking-tight text-white">
          P&L Waterfall
        </h3>
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
          Помесячная структура
        </span>
      </div>

      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#737373", fontSize: 10, fontWeight: 900 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              interval={0}
              angle={-15}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: "#737373", fontSize: 10, fontWeight: 900 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              tickFormatter={(val: number) =>
                val >= 1000 ? `${(val / 1000).toFixed(0)}K` : String(val)
              }
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
            {/* Invisible base bar for waterfall positioning */}
            <Bar dataKey="base" stackId="waterfall" fill="transparent" />
            {/* Visible portion */}
            <Bar dataKey="display" stackId="waterfall" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} fillOpacity={entry.isTotal ? 1 : 0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
