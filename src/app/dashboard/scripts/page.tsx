"use client";

import { useState, useEffect } from "react";
import { Mail, MessageSquare, Coffee, Utensils, Building2, ShoppingBag, Gem, Scissors, Car, ShoppingCart, Music, Sparkles, Dumbbell, ChevronDown } from "lucide-react";
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
  const [isNicheDropdownOpen, setIsNicheDropdownOpen] = useState(false);
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
  const currentNiche = niches[selectedNiche];

  return (
    <div className="space-y-8 animate-fade-in pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
            Мои <span className="text-neon">Скрипты</span>
          </h1>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] md:text-[12px] mt-1">
            Шаблоны для продаж и общения
          </p>
        </div>

        {/* Niche Dropdown Filter */}
        <div className="relative z-50 w-full md:w-72">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 block mb-2 px-1">
            Ниша бизнеса
          </label>
          <button
            onClick={() => setIsNicheDropdownOpen(!isNicheDropdownOpen)}
            className={cn(
              "w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-black/40 border transition-all duration-300 group",
              isNicheDropdownOpen ? "border-neon shadow-[0_0_30px_rgba(92,243,135,0.1)]" : "border-white/10 hover:border-white/20"
            )}
          >
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = NICHE_ICONS[currentNiche?.icon] || Music;
                return <Icon className="w-4 h-4 text-neutral-500 group-hover:text-neon transition-colors" />;
              })()}
              <span className="text-[12px] md:text-[13px] font-black uppercase tracking-widest text-white">
                {currentNiche?.name || "Выберите нишу"}
              </span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-neutral-500 transition-transform duration-300", isNicheDropdownOpen && "rotate-180")} />
          </button>

          {isNicheDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-2 p-2 rounded-2xl bg-[#0A0A0A] border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 origin-top">
              <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                {nicheList.map((n) => {
                  const Icon = NICHE_ICONS[n.icon] || Music;
                  return (
                    <button
                      key={n.slug}
                      onClick={() => {
                        setSelectedNiche(n.slug);
                        setIsNicheDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group",
                        selectedNiche === n.slug 
                          ? "bg-neon/10 text-neon" 
                          : "text-neutral-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[12px] font-black uppercase tracking-widest">{n.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] md:text-[12px] font-black uppercase tracking-widest border whitespace-nowrap transition-all",
              tab === t.key
                ? "bg-neon/10 text-neon border-neon/20 shadow-[0_0_20px_rgba(92,243,135,0.05)]"
                : "bg-white/5 text-neutral-400 border-transparent hover:bg-white/10 hover:text-white"
            )}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
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
              <h3 className="text-white font-black uppercase tracking-widest text-sm md:text-base">Скрипты в разработке</h3>
              <p className="text-neutral-500 text-[12px] md:text-sm font-medium max-w-xs mx-auto">
                Мы готовим специализированные шаблоны для ниши "{niches[selectedNiche]?.name}". Они появятся здесь в ближайшее время.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Overlay to close dropdown */}
      {isNicheDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsNicheDropdownOpen(false)} 
        />
      )}
    </div>
  );
}
