"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={cn(
      "glass-dark border rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors",
      isOnline ? "border-white/10" : "border-red-500/50 bg-red-500/5"
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center border",
          isOnline ? "bg-neon/10 border-neon/20 text-neon" : "bg-red-500/10 border-red-500/20 text-red-500"
        )}>
          {isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
        </div>
        <div>
          <h4 className="text-lg font-black uppercase tracking-tight text-white m-0">
            {isOnline ? "Связь стабильна" : "Режим офлайн"}
          </h4>
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">
            {isOnline ? "Все системы работают нормально" : "Воспроизведение из кэша. Облачная синхронизация приостановлена."}
          </p>
        </div>
      </div>

      {!isOnline && (
        <Button variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-2xl uppercase tracking-widest text-xs font-black">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Повторить попытку
        </Button>
      )}
    </div>
  );
}
