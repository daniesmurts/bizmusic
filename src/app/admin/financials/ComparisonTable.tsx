"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { PlatformSettingsData } from "./types";
import { calculatePnL, formatRubles, formatPercent, TIER_CONFIGS } from "./types";

interface Props {
  currentSettings: PlatformSettingsData;
  comparisonSettings: PlatformSettingsData;
  onComparisonChange: (settings: PlatformSettingsData) => void;
  subscribersByTier: Record<string, number>;
  infrastructureCost: number;
}

export function ComparisonTable({
  currentSettings,
  comparisonSettings,
  onComparisonChange,
  subscribersByTier,
  infrastructureCost,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const currentPnL = useMemo(
    () => calculatePnL(currentSettings, subscribersByTier, infrastructureCost),
    [currentSettings, subscribersByTier, infrastructureCost]
  );

  const compPnL = useMemo(
    () => calculatePnL(comparisonSettings, subscribersByTier, infrastructureCost),
    [comparisonSettings, subscribersByTier, infrastructureCost]
  );

  const delta = (a: number, b: number) => a - b;
  const deltaFormatted = (a: number, b: number) => {
    const d = a - b;
    if (d === 0) return "—";
    const prefix = d > 0 ? "+" : "";
    return prefix + formatRubles(d);
  };

  const handlePriceChange = (field: keyof PlatformSettingsData, rubles: string) => {
    const val = parseInt(rubles) || 0;
    onComparisonChange({ ...comparisonSettings, [field]: val * 100 });
  };

  return (
    <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black uppercase tracking-tight text-white">
          Сравнение сценариев
        </h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-neon transition-colors"
        >
          {expanded ? "Свернуть" : "Настроить Сценарий Б"}
        </button>
      </div>

      {/* Edit comparison prices */}
      {expanded && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/[0.02] rounded-xl border border-white/5">
          {TIER_CONFIGS.map((tier) => (
            <div key={tier.slug} className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                {tier.name} (₽)
              </label>
              <input
                type="number"
                min={0}
                value={Math.round((comparisonSettings[tier.priceField] as number) / 100)}
                onChange={(e) => handlePriceChange(tier.priceField, e.target.value)}
                className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-neon/50"
              />
            </div>
          ))}
        </div>
      )}

      {/* Comparison table */}
      <div className="overflow-x-auto -mx-2">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="text-left border-b border-white/5">
              <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Метрика
              </th>
              <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-neon">
                Сценарий А (текущий)
              </th>
              <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-blue-400">
                Сценарий Б
              </th>
              <th className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Дельта
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: "MRR", a: currentPnL.mrr, b: compPnL.mrr },
              { label: "Выплаты амбассадорам", a: currentPnL.ambassadorPayouts, b: compPnL.ambassadorPayouts },
              { label: "Эквайринг", a: currentPnL.processingFee, b: compPnL.processingFee },
              { label: "УСН", a: currentPnL.tax, b: compPnL.tax },
              { label: "Инфраструктура", a: currentPnL.infrastructureCost, b: compPnL.infrastructureCost },
              { label: "Чистая прибыль", a: currentPnL.netProfit, b: compPnL.netProfit },
            ].map((row) => {
              const d = delta(row.b, row.a);
              return (
                <tr
                  key={row.label}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-3 py-3 text-sm font-bold text-neutral-400">
                    {row.label}
                  </td>
                  <td className="px-3 py-3 text-sm font-bold text-white">
                    {formatRubles(row.a)}
                  </td>
                  <td className="px-3 py-3 text-sm font-bold text-white">
                    {formatRubles(row.b)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-3 text-sm font-bold",
                      d > 0 ? "text-neon" : d < 0 ? "text-red-400" : "text-neutral-600"
                    )}
                  >
                    {deltaFormatted(row.b, row.a)}
                  </td>
                </tr>
              );
            })}
            {/* Margin row */}
            <tr className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
              <td className="px-3 py-3 text-sm font-bold text-neutral-400">Маржа</td>
              <td className="px-3 py-3 text-sm font-bold text-white">
                {formatPercent(currentPnL.netMarginPercent)}
              </td>
              <td className="px-3 py-3 text-sm font-bold text-white">
                {formatPercent(compPnL.netMarginPercent)}
              </td>
              <td
                className={cn(
                  "px-3 py-3 text-sm font-bold",
                  compPnL.netMarginPercent > currentPnL.netMarginPercent
                    ? "text-neon"
                    : compPnL.netMarginPercent < currentPnL.netMarginPercent
                    ? "text-red-400"
                    : "text-neutral-600"
                )}
              >
                {compPnL.netMarginPercent === currentPnL.netMarginPercent
                  ? "—"
                  : (compPnL.netMarginPercent > currentPnL.netMarginPercent ? "+" : "") +
                    formatPercent(compPnL.netMarginPercent - currentPnL.netMarginPercent)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Ambassador earnings comparison */}
      <div className="space-y-3">
        <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400">
          Доход амбассадора на клиента/мес
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TIER_CONFIGS.map((tier) => {
            const currentPrice = currentSettings[tier.priceField] as number;
            const compPrice = comparisonSettings[tier.priceField] as number;
            const currentEarn = Math.round(
              currentPrice * (currentSettings.ambassadorCommissionPercent / 100)
            );
            const compEarn = Math.round(
              compPrice * (comparisonSettings.ambassadorCommissionPercent / 100)
            );

            return (
              <div
                key={tier.slug}
                className="p-4 bg-white/[0.02] rounded-xl border border-white/5 space-y-2"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  {tier.name}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neon font-bold">А: {formatRubles(currentEarn)}</span>
                  <span className="text-blue-400 font-bold">Б: {formatRubles(compEarn)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
