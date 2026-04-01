"use client";

import { useEffect, useState } from "react";
import { getWaveSettingsAction, updateWaveSettingsAction } from "@/lib/actions/wave";
import { usePlayerStore } from "@/store/usePlayerStore";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Activity, Lock, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const WaveControls = ({ 
  businessId, 
  subscriptionStatus 
}: { 
  businessId: string;
  subscriptionStatus?: string;
}) => {
  const isSubscribed = subscriptionStatus === "ACTIVE";
  const { isWaveMode, setWaveMode, isFetchingWave } = usePlayerStore();
  const [settings, setSettings] = useState({
    energyPreference: 5,
    vocalPreference: "both",
    focusProfile: "none",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) return;
    getWaveSettingsAction(businessId).then(res => {
      if (res.success && res.settings) {
        setSettings(res.settings as any);
      }
      setLoading(false);
    });
  }, [businessId]);

  const handleUpdate = async (updates: Partial<typeof settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    await updateWaveSettingsAction(businessId, updates);
    toast.success("Настройки волны обновлены");
  };

  return (
    <div className={cn("relative rounded-[2.5rem] p-6 lg:p-8 animate-slide-up overflow-hidden group transition-all duration-1000 shadow-2xl",
      isWaveMode ? "bg-black/90 border border-neon/40 shadow-[0_0_40px_rgba(0,255,170,0.1)]" : "glass-dark border border-white/5"
    )}>
      
      {/* Animated Wave Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 rounded-[2.5rem]">
         <div className={cn("absolute inset-0 bg-gradient-to-tr from-transparent via-neon/5 to-transparent transition-opacity duration-1000", isWaveMode ? "opacity-100" : "opacity-0")} />
         <svg className={cn("absolute w-[200%] h-full left-0 top-[30%] transition-opacity duration-1000", isWaveMode ? "opacity-30" : "opacity-0")} preserveAspectRatio="none" viewBox="0 0 1000 100">
           <path fill="none" stroke="currentColor" strokeWidth="2" className="text-neon"
                 d="M0,50 Q125,20 250,50 T500,50 T750,50 T1000,50">
             {isWaveMode && <animate attributeName="d" dur="3s" repeatCount="indefinite"
               values="M0,50 Q125,20 250,50 T500,50 T750,50 T1000,50; M0,50 Q125,80 250,50 T500,50 T750,50 T1000,50; M0,50 Q125,20 250,50 T500,50 T750,50 T1000,50" />}
           </path>
           <path fill="none" stroke="currentColor" strokeWidth="1" className="text-blue-500 opacity-50"
                 d="M0,50 Q125,80 250,50 T500,50 T750,50 T1000,50">
             {isWaveMode && <animate attributeName="d" dur="4s" repeatCount="indefinite"
               values="M0,50 Q125,80 250,50 T500,50 T750,50 T1000,50; M0,50 Q125,20 250,50 T500,50 T750,50 T1000,50; M0,50 Q125,80 250,50 T500,50 T750,50 T1000,50" />}
           </path>
           <path fill="none" stroke="currentColor" strokeWidth="3" className="text-neon opacity-20"
                 d="M0,50 Q125,50 250,50 T500,50 T750,50 T1000,50">
             {isWaveMode && <animate attributeName="d" dur="2s" repeatCount="indefinite"
               values="M0,50 Q125,50 250,50 T500,50 T750,50 T1000,50; M0,50 Q125,5 250,50 T500,50 T750,50 T1000,50; M0,50 Q125,50 250,50 T500,50 T750,50 T1000,50" />}
           </path>
         </svg>
      </div>
  
      {/* Content */}
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
          <div className="flex items-center gap-5">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 relative shrink-0", 
              isWaveMode ? "bg-black border-neon text-neon shadow-[0_0_20px_rgba(0,255,170,0.3)]" : "bg-white/5 border-white/10 text-neutral-500")}>
              {isWaveMode && <div className="absolute inset-0 bg-neon/20 rounded-2xl animate-ping" />}
              <Activity className={cn("w-7 h-7 relative z-10", isWaveMode && "animate-pulse")} />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter text-white drop-shadow-md">Бизнес-Волна</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("w-2 h-2 rounded-full", isWaveMode ? "bg-neon animate-pulse shadow-[0_0_8px_#00ffaa]" : "bg-neutral-600")} />
                <p className="text-neutral-400 text-[10px] font-black uppercase tracking-widest">
                  {isWaveMode ? "Нейросеть активна" : "Адаптивный ИИ-эфир"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {isFetchingWave && (
               <span className="text-[10px] font-black uppercase tracking-widest text-neon animate-pulse border border-neon/30 px-4 py-1.5 rounded-full bg-neon/10 self-start sm:self-auto">
                 Синхронизация...
               </span>
            )}
            <Button 
              onClick={() => setWaveMode(!isWaveMode, businessId)}
              className={cn(
                "rounded-xl px-8 h-12 font-black uppercase text-xs tracking-widest transition-all",
                isWaveMode 
                  ? "bg-transparent border-2 border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500" 
                  : "bg-neon text-black hover:scale-105 shadow-[0_0_20px_rgba(0,255,170,0.3)]"
              )}
            >
              {isWaveMode ? "Остановить" : "Включить Волну"}
            </Button>
          </div>
        </div>
  
        <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 transition-all duration-700", !isWaveMode && "opacity-60 grayscale-[0.2]")}>
          
          <div className="space-y-6 bg-black/40 p-6 rounded-3xl border border-white/5 backdrop-blur-md relative overflow-hidden">
            {isWaveMode && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-20" />}
            <div className="flex justify-between items-center text-[10px] font-black tracking-widest uppercase">
              <span className="text-blue-400 drop-shadow-[0_0_3px_#60a5fa]">Спокойно</span>
              <span className="text-neon bg-neon/10 px-3 py-1 rounded-full border border-neon/20 tabular-nums">Энергия: {settings.energyPreference}</span>
              <span className="text-orange-500 drop-shadow-[0_0_3px_#f97316]">Драйв</span>
            </div>
            <Slider 
              value={[settings.energyPreference]} 
              min={1} max={10} step={1}
              onValueChange={([val]) => handleUpdate({ energyPreference: val })}
              className="w-full cursor-crosshair pb-2"
            />
          </div>
  
          <div className="space-y-4 bg-black/40 p-6 rounded-3xl border border-white/5 backdrop-blur-md relative overflow-hidden">
            {isWaveMode && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-20" />}
            <p className="text-[10px] font-black tracking-widest uppercase text-center text-neutral-400 mb-2">Голос. Параметры</p>
            <div className="grid grid-cols-3 gap-2">
              {(['instrumental', 'both', 'vocal'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => handleUpdate({ vocalPreference: mode })}
                  className={cn("rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center justify-center h-10",
                    settings.vocalPreference === mode 
                      ? "bg-neon/10 border-neon/40 text-neon shadow-[inset_0_0_10px_rgba(0,255,170,0.1)]" 
                      : "bg-white/5 border-transparent text-neutral-500 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {mode === 'instrumental' ? 'Без' : mode === 'vocal' ? 'Только' : 'Микс'}
                </button>
              ))}
            </div>
          </div>
  
          <div className="space-y-4 bg-black/40 p-6 rounded-3xl border border-white/5 backdrop-blur-md relative overflow-hidden">
            {isWaveMode && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon to-transparent opacity-20" />}
            <p className="text-[10px] font-black tracking-widest uppercase text-center text-neutral-400 mb-2">Нейро-Фокус</p>
            <div className="relative">
              <select 
                value={settings.focusProfile}
                onChange={(e) => handleUpdate({ focusProfile: e.target.value })}
                className="w-full bg-black/60 border border-white/10 text-white text-[11px] font-black uppercase tracking-widest h-10 rounded-xl px-4 appearance-none focus:outline-none focus:border-neon focus:shadow-[0_0_15px_rgba(0,255,170,0.2)] transition-all cursor-pointer"
              >
                <option value="none">Универсальный Поток</option>
                <option value="morning_coffee">Утренний Свет (Morning)</option>
                <option value="lunch_rush">Час-пик Драйв (Lunch)</option>
                <option value="evening_lounge">Глубокий Лаунж (Evening)</option>
              </select>
              <div className="absolute top-[45%] right-4 -translate-y-1/2 pointer-events-none w-2 h-2 border-r-2 border-b-2 border-neon/70 rotate-45 transform" />
            </div>
          </div>
  
        </div>
  
        {/* Subscription Lock Overlay */}
        {!isSubscribed && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 text-center animate-fade-in backdrop-blur-md bg-black/40 rounded-[2.5rem] border border-white/10 group-hover:bg-black/50 transition-all duration-500">
             <div className="max-w-xs space-y-6">
                <div className="w-20 h-20 bg-neon/10 rounded-3xl flex items-center justify-center border border-neon/20 text-neon mx-auto shadow-2xl shadow-neon/20 animate-pulse">
                   <Lock className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                   <h4 className="text-xl font-black uppercase tracking-tighter text-white">Функция Ограничена</h4>
                   <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 leading-relaxed">
                      Бизнес-Волна доступна только <br /> для владельцев активной подписки
                   </p>
                </div>
                <Button asChild className="w-full bg-neon text-black rounded-2xl h-14 font-black uppercase text-xs tracking-widest shadow-xl shadow-neon/20 hover:scale-105 transition-all gap-2">
                   <Link href="/dashboard/subscription">
                      <Crown className="w-4 h-4" /> Активировать доступ
                   </Link>
                </Button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
