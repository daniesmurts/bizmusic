"use client";

import { useState, useEffect } from "react";
import { Mail, MessageSquare, Coffee, Utensils, Building2, ShoppingBag, Gem, Scissors, Car, ShoppingCart, Music, Sparkles, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { niches } from "@/lib/data/niches";
import { scriptTemplates } from "@/lib/data/scripts";
import { ScriptCard } from "@/components/dashboard/ScriptCard";
import { getReferralDataAction } from "@/lib/actions/referral";

const TABS = [
  { key: "email", label: "Email", icon: Mail },
  { key: "messengers", label: "Мессенджеры", icon: MessageSquare },
] as const;

// Map niche icons from string to Lucide component
const NICHE_ICONS: Record<string, any> = {
  Coffee,
  Utensils,
  Building2,
  ShoppingBag,
  Gem,
  Scissors,
  Car,
  ShoppingCart,
  Music,
  Sparkles,
  Dumbbell
};

export default function ScriptsPage() {
  const [tab, setTab] = useState<"email" | "messengers">("email");
  const [selectedNiche, setSelectedNiche] = useState<string>("salon");
  const [referralData, setReferralData] = useState<{ referralCode: string; fullName: string } | null>(null);

  useEffect(() => {
    getReferralDataAction().then((res) => {
      if (res.success && res.data) {
        setReferralData(res.data);
      }
    });
  }, []);

  const filteredScripts = scriptTemplates.filter(
    (s) => s.type === tab && s.niche === selectedNiche
  );

  const nicheList = Object.values(niches);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-tighter">
          Мои <span className="text-neon">Скрипты</span>
        </h1>
        <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] mt-1">
          Шаблоны для продаж и общения
        </p>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border whitespace-nowrap transition-all",
              tab === t.key
                ? "bg-neon/10 text-neon border-neon/20 shadow-[0_0_20px_rgba(92,243,135,0.05)]"
                : "bg-white/5 text-neutral-400 border-transparent hover:bg-white/10 hover:text-white"
            )}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Niche Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Ниша бизнеса</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {nicheList.map((n) => {
            const Icon = NICHE_ICONS[n.icon] || Music;
            const isActive = selectedNiche === n.slug;
            
            return (
              <button
                key={n.slug}
                onClick={() => setSelectedNiche(n.slug)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border whitespace-nowrap transition-all flex-shrink-0",
                  isActive
                    ? "bg-white/10 text-white border-white/20"
                    : "bg-black/40 text-neutral-500 border-white/5 hover:border-white/10 hover:text-neutral-300"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {n.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scripts Content */}
      <div className="space-y-6">
        {filteredScripts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {filteredScripts.map((script) => (
              <ScriptCard
                key={script.id}
                label={script.label}
                subject={script.subject}
                body={script.body}
                footer={script.footer}
                day={script.day}
                referralCode={referralData?.referralCode}
                userName={referralData?.fullName}
              />
            ))}
          </div>
        ) : (
          <div className="glass-dark border border-white/10 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-neutral-700" />
            </div>
            <div className="space-y-1">
              <h3 className="text-white font-black uppercase tracking-widest text-sm">Скрипты в разработке</h3>
              <p className="text-neutral-500 text-xs font-medium max-w-xs mx-auto">
                Мы готовим специализированные шаблоны для ниши "{niches[selectedNiche]?.name}". Они появятся здесь в ближайшее время.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
