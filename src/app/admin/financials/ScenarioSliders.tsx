"use client";

import { Slider } from "@/components/ui/slider";
import { TIER_CONFIGS, formatPercent } from "./types";
import type { RateOverrides } from "./types";

interface InfraState {
  ambassadors: number;
  crmCost: number;
  cloudAtcCost: number;
  simCardCost: number;
  otherFixed: number;
}

interface Props {
  totalSubscribers: number;
  onTotalChange: (val: number) => void;
  allocation: Record<string, number>;
  onAllocationChange: (val: Record<string, number>) => void;
  infra: InfraState;
  onInfraChange: (val: InfraState) => void;
  rates: RateOverrides;
  onRatesChange: (val: RateOverrides) => void;
}

export function ScenarioSliders({
  totalSubscribers,
  onTotalChange,
  allocation,
  onAllocationChange,
  infra,
  onInfraChange,
  rates,
  onRatesChange,
}: Props) {
  const handleAllocationChange = (slug: string, newVal: number) => {
    const updated = { ...allocation, [slug]: newVal };
    // Ensure total doesn't exceed 100
    const slugs = TIER_CONFIGS.map((t) => t.slug);
    const currentSlugIndex = slugs.indexOf(slug);
    const total = Object.values(updated).reduce((s, v) => s + v, 0);

    if (total > 100) {
      // Subtract overflow from the next available tier
      let overflow = total - 100;
      for (let i = 0; i < slugs.length && overflow > 0; i++) {
        if (i !== currentSlugIndex) {
          const reduce = Math.min(updated[slugs[i]], overflow);
          updated[slugs[i]] -= reduce;
          overflow -= reduce;
        }
      }
    }

    onAllocationChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top row: Subscribers + Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscribers */}
        <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-6">
          <h3 className="text-lg font-black uppercase tracking-tight text-white">
            Подписчики
          </h3>

          {/* Total */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Всего подписчиков
              </span>
              <span className="text-sm font-black text-neon">{totalSubscribers}</span>
            </div>
            <Slider
              value={[totalSubscribers]}
              onValueChange={([v]) => onTotalChange(v)}
              min={1}
              max={1000}
              step={1}
            />
          </div>

          {/* Per-tier allocation */}
          {TIER_CONFIGS.map((tier) => {
            const pct = allocation[tier.slug] ?? 0;
            const count = Math.round((pct / 100) * totalSubscribers);
            return (
              <div key={tier.slug} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-400">{tier.name}</span>
                  <span className="text-xs font-black text-white">
                    {pct}% ({count})
                  </span>
                </div>
                <Slider
                  value={[pct]}
                  onValueChange={([v]) => handleAllocationChange(tier.slug, v)}
                  min={0}
                  max={100}
                  step={1}
                />
              </div>
            );
          })}

          <p className="text-[10px] text-neutral-600 font-medium">
            Сумма: {Object.values(allocation).reduce((s, v) => s + v, 0)}% — остаток
            распределяется на последний тариф.
          </p>
        </div>

        {/* Commissions & Taxes */}
        <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-6">
          <h3 className="text-lg font-black uppercase tracking-tight text-white">
            Комиссии и налоги
          </h3>

          {/* Ambassador commission */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Комиссия амбассадоров
              </span>
              <span className="text-sm font-black text-orange-400">
                {formatPercent(rates.commissionPercent ?? 30)}
              </span>
            </div>
            <Slider
              value={[rates.commissionPercent ?? 30]}
              onValueChange={([v]) => onRatesChange({ ...rates, commissionPercent: v })}
              min={0}
              max={50}
              step={0.5}
            />
          </div>

          {/* Processing fee */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Эквайринг (процессинг)
              </span>
              <span className="text-sm font-black text-red-400">
                {formatPercent(rates.processingFeePercent ?? 2.5)}
              </span>
            </div>
            <Slider
              value={[rates.processingFeePercent ?? 2.5]}
              onValueChange={([v]) => onRatesChange({ ...rates, processingFeePercent: v })}
              min={0}
              max={10}
              step={0.1}
            />
          </div>

          {/* Tax */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                УСН (налог)
              </span>
              <span className="text-sm font-black text-purple-400">
                {formatPercent(rates.taxPercent ?? 6)}
              </span>
            </div>
            <Slider
              value={[rates.taxPercent ?? 6]}
              onValueChange={([v]) => onRatesChange({ ...rates, taxPercent: v })}
              min={0}
              max={20}
              step={0.5}
            />
          </div>

          {/* Summary */}
          <div className="pt-4 border-t border-white/5 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
              Всего удержания от выручки
            </p>
            <p className="text-xl font-black tracking-tighter text-white">
              {formatPercent(
                (rates.commissionPercent ?? 30) +
                (rates.processingFeePercent ?? 2.5) +
                (rates.taxPercent ?? 6)
              )}
            </p>
            <p className="text-[10px] text-neutral-600 font-medium">
              = Амбассадор + Эквайринг + УСН
            </p>
          </div>
        </div>
      </div>

      {/* Bottom row: Infrastructure */}
      <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-6">
        <h3 className="text-lg font-black uppercase tracking-tight text-white">
          Инфраструктура (фикс. расходы)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          {/* Ambassadors */}
          <div className="space-y-3 xl:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Амбассадоры (мамы)
              </span>
              <span className="text-sm font-black text-neon">{infra.ambassadors}</span>
            </div>
            <Slider
              value={[infra.ambassadors]}
              onValueChange={([v]) => onInfraChange({ ...infra, ambassadors: v })}
              min={1}
              max={50}
              step={1}
            />
          </div>

          {/* CRM cost */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
              CRM (₽/мес)
            </label>
            <input
              type="number"
              min={0}
              value={infra.crmCost}
              onChange={(e) =>
                onInfraChange({ ...infra, crmCost: Math.max(0, parseInt(e.target.value) || 0) })
              }
              className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-neon/50"
            />
          </div>

          {/* Cloud ATC */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
              Облачная АТС (₽/мес)
            </label>
            <input
              type="number"
              min={0}
              value={infra.cloudAtcCost}
              onChange={(e) =>
                onInfraChange({
                  ...infra,
                  cloudAtcCost: Math.max(0, parseInt(e.target.value) || 0),
                })
              }
              className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-neon/50"
            />
          </div>

          {/* SIM card cost per ambassador */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
              SIM-карта (₽/амб./мес)
            </label>
            <input
              type="number"
              min={0}
              value={infra.simCardCost}
              onChange={(e) =>
                onInfraChange({
                  ...infra,
                  simCardCost: Math.max(0, parseInt(e.target.value) || 0),
                })
              }
              className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-neon/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Other fixed costs */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
              Прочие фикс. расходы (₽/мес)
            </label>
            <input
              type="number"
              min={0}
              value={infra.otherFixed}
              onChange={(e) =>
                onInfraChange({
                  ...infra,
                  otherFixed: Math.max(0, parseInt(e.target.value) || 0),
                })
              }
              className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-neon/50"
            />
          </div>

          {/* Total */}
          <div className="flex items-end">
            <div className="p-4 bg-white/[0.03] rounded-xl border border-white/5 w-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-neutral-400">
                  Итого инфраструктура
                </span>
                <span className="text-lg font-black text-white">
                  {new Intl.NumberFormat("ru-RU").format(
                    infra.crmCost +
                      infra.cloudAtcCost +
                      infra.simCardCost * infra.ambassadors +
                      infra.otherFixed
                  )}{" "}
                  ₽/мес
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
