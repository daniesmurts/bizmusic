"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Activity,
  TrendingUp,
  BarChart3,
  Settings,
  Banknote,
  Users,
  Receipt,
  PiggyBank,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlatformSettingsData, LiveData, RateOverrides } from "./types";
import { calculatePnL, formatRubles, formatPercent, TIER_CONFIGS } from "./types";
import { MetricCards } from "./MetricCards";
import { WaterfallChart } from "./WaterfallChart";
import { UnitEconomicsTable } from "./UnitEconomicsTable";
import { ScenarioSliders } from "./ScenarioSliders";
import { ComparisonTable } from "./ComparisonTable";
import { PricingSettingsTab } from "./PricingSettingsTab";

type Tab = "live" | "scenario" | "settings";

interface Props {
  initialSettings: PlatformSettingsData;
  initialLiveData: LiveData;
}

export function FinancialDashboardClient({ initialSettings, initialLiveData }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("live");
  const [settings, setSettings] = useState(initialSettings);
  const [liveData] = useState(initialLiveData);

  // Scenario mode state
  const [scenarioSubscribers, setScenarioSubscribers] = useState(
    Math.max(initialLiveData.totalActiveSubscribers, 10)
  );
  const [scenarioAllocation, setScenarioAllocation] = useState<Record<string, number>>({
    business: 50,
    content: 20,
    "business-pro": 20,
    "business-plus": 10,
  });
  const [scenarioInfra, setScenarioInfra] = useState({
    ambassadors: Math.max(initialLiveData.activeAmbassadors, 5),
    crmCost: 0,
    cloudAtcCost: 0,
    simCardCost: 0,
    otherFixed: 0,
  });
  const [scenarioRates, setScenarioRates] = useState<RateOverrides>({
    commissionPercent: initialSettings.ambassadorCommissionPercent,
    processingFeePercent: initialSettings.paymentProcessingFeePercent,
    taxPercent: initialSettings.taxRatePercent,
  });

  // ─── Live P&L ──────────────────────────────────────────────────────────────────

  const livePnL = useMemo(
    () => calculatePnL(settings, liveData.subscribersByTier),
    [settings, liveData.subscribersByTier]
  );

  // ─── Scenario P&L ─────────────────────────────────────────────────────────────

  const scenarioSubscribersByTier = useMemo(() => {
    const result: Record<string, number> = {};
    let allocated = 0;
    const slugs = TIER_CONFIGS.map((t) => t.slug);
    for (let i = 0; i < slugs.length - 1; i++) {
      const count = Math.round((scenarioAllocation[slugs[i]] / 100) * scenarioSubscribers);
      result[slugs[i]] = count;
      allocated += count;
    }
    // Last tier gets the remainder
    result[slugs[slugs.length - 1]] = scenarioSubscribers - allocated;
    return result;
  }, [scenarioSubscribers, scenarioAllocation]);

  const scenarioInfraCost = useMemo(() => {
    return (
      scenarioInfra.crmCost * 100 +
      scenarioInfra.cloudAtcCost * 100 +
      scenarioInfra.simCardCost * scenarioInfra.ambassadors * 100 +
      scenarioInfra.otherFixed * 100
    );
  }, [scenarioInfra]);

  const scenarioPnL = useMemo(
    () => calculatePnL(settings, scenarioSubscribersByTier, scenarioInfraCost, scenarioRates),
    [settings, scenarioSubscribersByTier, scenarioInfraCost, scenarioRates]
  );

  // ─── Comparison P&L (old prices) ──────────────────────────────────────────────

  const [comparisonSettings, setComparisonSettings] = useState<PlatformSettingsData>({
    ...initialSettings,
    // Start with initial as "old" — user can modify
  });

  const comparisonPnL = useMemo(
    () => calculatePnL(comparisonSettings, scenarioSubscribersByTier, scenarioInfraCost),
    [comparisonSettings, scenarioSubscribersByTier, scenarioInfraCost]
  );

  const handleSettingsSaved = useCallback((updated: PlatformSettingsData) => {
    setSettings(updated);
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "live", label: "Live P&L", icon: BarChart3 },
    { id: "scenario", label: "Сценарий", icon: TrendingUp },
    { id: "settings", label: "Настройки цен", icon: Settings },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-neutral-500">
          <Activity className="w-4 h-4 text-neon" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            Финансовая модель • P&L Дашборд
          </span>
        </div>
        <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none">
          Финансовая <br />
          <span className="text-neon underline decoration-neon/20 underline-offset-8">
            Модель
          </span>
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1.5 bg-white/[0.03] border border-white/5 rounded-2xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                isActive
                  ? "bg-neon/10 text-neon border border-neon/20 shadow-[0_0_20px_rgba(92,243,135,0.08)]"
                  : "text-neutral-500 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "live" && (
        <div className="space-y-8">
          <MetricCards pnl={livePnL} />
          <WaterfallChart pnl={livePnL} />
          <UnitEconomicsTable pnl={livePnL} settings={settings} />

          {/* Break-even */}
          <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-4">
            <h3 className="text-lg font-black uppercase tracking-tight text-white">
              Точка безубыточности
            </h3>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Необходимо подписчиков
                </p>
                <p className="text-3xl font-black tracking-tighter text-white">
                  {livePnL.breakEvenSubscribers}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Сейчас подписчиков
                </p>
                <p className="text-3xl font-black tracking-tighter text-white">
                  {livePnL.currentSubscribers}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Статус
                </p>
                {livePnL.currentSubscribers >= livePnL.breakEvenSubscribers ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-neon shadow-[0_0_8px_rgba(92,243,135,0.5)]" />
                    <span className="text-neon font-black text-sm">
                      Выше на {livePnL.currentSubscribers - livePnL.breakEvenSubscribers}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    <span className="text-red-400 font-black text-sm">
                      Ниже на {livePnL.breakEvenSubscribers - livePnL.currentSubscribers}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "scenario" && (
        <div className="space-y-8">
          <ScenarioSliders
            totalSubscribers={scenarioSubscribers}
            onTotalChange={setScenarioSubscribers}
            allocation={scenarioAllocation}
            onAllocationChange={setScenarioAllocation}
            infra={scenarioInfra}
            onInfraChange={setScenarioInfra}
            rates={scenarioRates}
            onRatesChange={setScenarioRates}
          />

          <MetricCards pnl={scenarioPnL} />
          <WaterfallChart pnl={scenarioPnL} />
          <UnitEconomicsTable pnl={scenarioPnL} settings={settings} rateOverrides={scenarioRates} />

          {/* Break-even */}
          <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-4">
            <h3 className="text-lg font-black uppercase tracking-tight text-white">
              Точка безубыточности (сценарий)
            </h3>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Необходимо подписчиков
                </p>
                <p className="text-3xl font-black tracking-tighter text-white">
                  {scenarioPnL.breakEvenSubscribers}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  В сценарии
                </p>
                <p className="text-3xl font-black tracking-tighter text-white">
                  {scenarioPnL.currentSubscribers}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Статус
                </p>
                {scenarioPnL.currentSubscribers >= scenarioPnL.breakEvenSubscribers ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-neon shadow-[0_0_8px_rgba(92,243,135,0.5)]" />
                    <span className="text-neon font-black text-sm">
                      Выше на {scenarioPnL.currentSubscribers - scenarioPnL.breakEvenSubscribers}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    <span className="text-red-400 font-black text-sm">
                      Ниже на {scenarioPnL.breakEvenSubscribers - scenarioPnL.currentSubscribers}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comparison */}
          <ComparisonTable
            currentSettings={settings}
            comparisonSettings={comparisonSettings}
            onComparisonChange={setComparisonSettings}
            subscribersByTier={scenarioSubscribersByTier}
            infrastructureCost={scenarioInfraCost}
          />
        </div>
      )}

      {activeTab === "settings" && (
        <PricingSettingsTab
          settings={settings}
          onSaved={handleSettingsSaved}
        />
      )}
    </div>
  );
}
