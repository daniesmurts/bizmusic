"use client";

import { cn } from "@/lib/utils";
import type { PnLMetrics, PlatformSettingsData, RateOverrides } from "./types";
import { formatRubles, formatPercent } from "./types";

interface Props {
  pnl: PnLMetrics;
  settings: PlatformSettingsData;
  rateOverrides?: RateOverrides;
}

export function UnitEconomicsTable({ pnl, settings, rateOverrides }: Props) {
  const commissionPct = rateOverrides?.commissionPercent ?? settings.ambassadorCommissionPercent;
  const processingPct = rateOverrides?.processingFeePercent ?? settings.paymentProcessingFeePercent;
  const taxPct = rateOverrides?.taxPercent ?? settings.taxRatePercent;

  return (
    <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black uppercase tracking-tight text-white">
          Unit Economics
        </h3>
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
          По тарифам
        </span>
      </div>

      <div className="overflow-x-auto -mx-2">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="text-left border-b border-white/5">
              {[
                "Тариф",
                "Цена",
                `Амбассадор (${formatPercent(commissionPct)})`,
                `Эквайринг (${formatPercent(processingPct)})`,
                `УСН (${formatPercent(taxPct)})`,
                "Чистое/подп.",
                "Маржа %",
              ].map((header) => (
                <th
                  key={header}
                  className="px-3 py-3 text-[10px] font-black uppercase tracking-widest text-neutral-500 whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pnl.tierMetrics.map((tier) => {
              const ambassadorCutPerSub = Math.round(
                tier.priceKopeks * (commissionPct / 100)
              );
              const processingPerSub = Math.round(
                tier.priceKopeks * (processingPct / 100)
              );
              const taxPerSub = Math.round(
                tier.priceKopeks * (taxPct / 100)
              );

              return (
                <tr
                  key={tier.slug}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-neon" />
                      <span className="text-sm font-bold text-white">
                        {tier.name}
                      </span>
                      {tier.subscriberCount > 0 && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/5 text-neutral-400">
                          {tier.subscriberCount} подп.
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm font-bold text-white">
                    {formatRubles(tier.priceKopeks)}
                  </td>
                  <td className="px-3 py-4 text-sm text-orange-400 font-medium">
                    −{formatRubles(ambassadorCutPerSub)}
                  </td>
                  <td className="px-3 py-4 text-sm text-red-400 font-medium">
                    −{formatRubles(processingPerSub)}
                  </td>
                  <td className="px-3 py-4 text-sm text-purple-400 font-medium">
                    −{formatRubles(taxPerSub)}
                  </td>
                  <td className="px-3 py-4 text-sm font-bold text-neon">
                    {formatRubles(tier.netPerSubscriber)}
                  </td>
                  <td className="px-3 py-4">
                    <span
                      className={cn(
                        "text-sm font-bold",
                        tier.netMarginPercent >= 50
                          ? "text-neon"
                          : tier.netMarginPercent >= 30
                          ? "text-amber-400"
                          : "text-red-400"
                      )}
                    >
                      {formatPercent(tier.netMarginPercent)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
