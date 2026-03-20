"use client";

import { useQuery } from "@tanstack/react-query";
import { History, FileText, Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogTable } from "@/components/admin/LogTable";
import { getPlayLogsAction } from "@/lib/actions/play-logs";
import { AdminPlayLog } from "@/types/admin";
import { toast } from "sonner";

export default function LogsPage() {
  const { data: logs, isLoading, error } = useQuery({
    queryKey: ["admin-logs"],
    queryFn: async () => {
      const result = await getPlayLogsAction(100);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as AdminPlayLog[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (error) {
    toast.error("Ошибка загрузки логов");
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-neutral-500">
            <History className="w-4 h-4 text-neon" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Спецотчетность и контроль
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">
            Логи <span className="text-neon">Вещания</span>
          </h1>
          <p className="text-neutral-500 max-w-xl font-medium">
            Юридическое подтверждение воспроизведения контента для проверок РАО/ВОИС.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-2xl h-14 px-8 font-black uppercase tracking-widest gap-2"
          >
            <Download className="w-5 h-5" />
            CSV Экспорт
          </Button>
          
          <Button
            className="bg-neon text-black hover:scale-[1.02] transition-transform rounded-2xl h-14 px-8 font-black uppercase tracking-widest shadow-[0_0_20px_rgba(92,243,135,0.3)] gap-2"
          >
            <FileText className="w-5 h-5" />
            Сформировать отчет
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-dark border border-white/5 p-8 rounded-[2rem] space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-neon/10 flex items-center justify-center border border-neon/20">
            <ShieldCheck className="w-6 h-6 text-neon" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
              Статус соблюдения
            </p>
            <p className="text-2xl font-black text-white">100% LEGAL</p>
          </div>
        </div>
        
        <div className="glass-dark border border-white/10 p-8 rounded-[2rem] space-y-4 bg-white/[0.02]">
           <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
            <History className="w-6 h-6 text-neutral-400" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
              Всего проигрываний
            </p>
            <p className="text-2xl font-black text-white">{logs?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="grid place-items-center py-20">
          <div className="w-16 h-16 border-4 border-neon/30 border-t-neon rounded-full animate-spin" />
        </div>
      ) : (
        <LogTable logs={logs || []} />
      )}
    </div>
  );
}
