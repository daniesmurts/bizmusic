"use client";

import { useState, useCallback } from "react";
import { Save, AlertTriangle, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlatformSettingsData } from "./types";
import { TIER_CONFIGS, PAYOUT_DAYS, formatRubles } from "./types";

interface Props {
  settings: PlatformSettingsData;
  onSaved: (updated: PlatformSettingsData) => void;
}

export function PricingSettingsTab({ settings, onSaved }: Props) {
  const [form, setForm] = useState<PlatformSettingsData>({ ...settings });
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasChanges = JSON.stringify(form) !== JSON.stringify(settings);

  const priceChanged =
    form.tierBusinessPrice !== settings.tierBusinessPrice ||
    form.tierContentPrice !== settings.tierContentPrice ||
    form.tierBusinessProPrice !== settings.tierBusinessProPrice ||
    form.tierBusinessPlusPrice !== settings.tierBusinessPlusPrice;

  const commissionChanged =
    form.ambassadorCommissionPercent !== settings.ambassadorCommissionPercent;

  const setField = <K extends keyof PlatformSettingsData>(
    field: K,
    value: PlatformSettingsData[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, number | string> = {};
      for (const key of Object.keys(form) as Array<keyof PlatformSettingsData>) {
        if (key === "id" || key === "updatedAt") continue;
        if (form[key] !== settings[key]) {
          body[key] = form[key] as number | string;
        }
      }

      const res = await fetch("/api/admin/financials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.errors?.join(", ") || data.error || "Failed to save");
      }

      const data = await res.json();
      onSaved(data.settings);
      setForm(data.settings);
      setSuccess(true);
      setShowConfirm(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }, [form, settings, onSaved]);

  const handleSaveClick = () => {
    if (priceChanged || commissionChanged) {
      setShowConfirm(true);
    } else {
      handleSave();
    }
  };

  return (
    <div className="space-y-8">
      {/* Tier Prices */}
      <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-6">
        <h3 className="text-lg font-black uppercase tracking-tight text-white">
          Цены подписок
        </h3>
        <p className="text-xs text-neutral-500">
          Все цены в рублях за месяц. Изменения вступят в силу для новых подписок и
          продлений. Гранфазеринг: текущие подписчики остаются на старой цене.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {TIER_CONFIGS.map((tier) => {
            const field = tier.priceField;
            const kopeks = form[field] as number;
            const rubles = Math.round(kopeks / 100);
            return (
              <div key={tier.slug} className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  {tier.name} (₽/мес)
                </label>
                <input
                  type="number"
                  min={0}
                  value={rubles}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value) || 0);
                    setField(field, val * 100 as never);
                  }}
                  className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-lg font-bold text-white outline-none focus:border-neon/50 transition-colors"
                />
                {kopeks !== (settings[field] as number) && (
                  <p className="text-[10px] text-amber-400 font-bold">
                    Было: {formatRubles(settings[field] as number)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fee & Tax Settings */}
      <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-6">
        <h3 className="text-lg font-black uppercase tracking-tight text-white">
          Комиссии и налоги
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Processing fee */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
              Эквайринг (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={form.paymentProcessingFeePercent}
              onChange={(e) =>
                setField("paymentProcessingFeePercent", parseFloat(e.target.value) || 0)
              }
              className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-lg font-bold text-white outline-none focus:border-neon/50"
            />
          </div>

          {/* Tax rate */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
              УСН (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={form.taxRatePercent}
              onChange={(e) =>
                setField("taxRatePercent", parseFloat(e.target.value) || 0)
              }
              className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-lg font-bold text-white outline-none focus:border-neon/50"
            />
          </div>

          {/* Ambassador commission */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
              Комиссия амбассадоров (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.01}
              value={form.ambassadorCommissionPercent}
              onChange={(e) =>
                setField("ambassadorCommissionPercent", parseFloat(e.target.value) || 0)
              }
              className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-lg font-bold text-white outline-none focus:border-neon/50"
            />
            {commissionChanged && (
              <p className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Существующие договоры с амбассадорами могут потребовать обновления
              </p>
            )}
          </div>

          {/* Min payout */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
              Мин. выплата (₽)
            </label>
            <input
              type="number"
              min={0}
              value={Math.round(form.minimumPayoutThresholdKopeks / 100)}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value) || 0);
                setField("minimumPayoutThresholdKopeks", val * 100);
              }}
              className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-lg font-bold text-white outline-none focus:border-neon/50"
            />
          </div>

          {/* Payout day */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
              День выплат
            </label>
            <select
              value={form.payoutDay}
              onChange={(e) => setField("payoutDay", e.target.value)}
              className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-lg font-bold text-white outline-none focus:border-neon/50 appearance-none"
            >
              {PAYOUT_DAYS.map((d) => (
                <option key={d.value} value={d.value} className="bg-neutral-900">
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Infrastructure cost */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
              Инфраструктура (₽/мес)
            </label>
            <input
              type="number"
              min={0}
              value={Math.round(form.infrastructureCostKopeks / 100)}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value) || 0);
                setField("infrastructureCostKopeks", val * 100);
              }}
              className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-lg font-bold text-white outline-none focus:border-neon/50"
            />
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div
        className={cn(
          "flex items-center justify-between p-5 rounded-2xl border transition-all duration-300",
          hasChanges
            ? "bg-neon/5 border-neon/20"
            : "bg-white/[0.02] border-white/5"
        )}
      >
        <div className="flex items-center gap-3">
          {success && (
            <div className="flex items-center gap-2 text-neon text-xs font-black">
              <Check className="w-4 h-4" />
              Сохранено
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs font-black">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
          {!success && !error && hasChanges && (
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              Есть несохранённые изменения
            </span>
          )}
        </div>

        <button
          onClick={handleSaveClick}
          disabled={!hasChanges || saving}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            hasChanges
              ? "bg-neon text-black hover:scale-[1.02] shadow-[0_0_20px_rgba(92,243,135,0.2)]"
              : "bg-white/5 text-neutral-600 cursor-not-allowed"
          )}
        >
          <Save className="w-4 h-4" />
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="glass-dark border border-white/10 rounded-[2rem] p-8 max-w-lg w-full mx-4 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-white">
                Подтверждение
              </h3>
            </div>

            <div className="space-y-3 text-sm text-neutral-300">
              {priceChanged && (
                <p>
                  Изменение цен повлияет на все новые подписки и расчёт комиссий
                  амбассадоров. Текущие подписчики останутся на старой цене до
                  продления или апгрейда.
                </p>
              )}
              {commissionChanged && (
                <p className="text-amber-400">
                  ⚠ Изменение ставки комиссии повлияет на все будущие выплаты. Существующие
                  договоры с амбассадорами могут потребовать ручного обновления.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-neon text-black text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(92,243,135,0.2)]"
              >
                <Check className="w-4 h-4" />
                {saving ? "Сохранение..." : "Подтвердить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
