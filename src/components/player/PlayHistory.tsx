"use client";

import { getPlayLogsAction } from "@/lib/actions/play-logs";
import { Button } from "@/components/ui/button";
import { Clock, Download, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export function PlayHistory() {
  const { data: logsData, isLoading } = useQuery({
    queryKey: ["play-logs-preview"],
    queryFn: async () => {
      const result = await getPlayLogsAction(10);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const logs = logsData || [];

  return (
    <div className="glass-dark border border-white/10 rounded-[2.5rem] p-8 space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/5 p-2 rounded-xl text-neutral-300 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-black uppercase tracking-tighter text-white truncate sm:whitespace-normal">Последние треки</h3>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Журнал эфира</p>
          </div>
        </div>

        <Button 
          onClick={() => toast.info("Скачивание отчетов скоро будет доступно")}
          variant="outline" 
          size="sm" 
          className="border-white/10 text-white hover:bg-white/5 rounded-xl uppercase text-[10px] font-black tracking-widest h-8 px-3 w-full sm:w-auto shrink-0 justify-center sm:justify-start"
        >
          <Download className="w-3 h-3 mr-2" />
          Скачать отчет (PDF)
        </Button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px]">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
             <div key={i} className="flex justify-between items-center p-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 bg-white/5" />
                  <Skeleton className="h-3 w-20 bg-white/5" />
                </div>
                <Skeleton className="h-4 w-12 bg-white/5" />
             </div>
          ))
        ) : logs.length > 0 ? (
          logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between group p-3 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-neutral-900 border border-white/5 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-neutral-500" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white leading-tight">{log.track?.title || "Неизвестно"}</div>
                  <div className="text-xs text-neutral-500 truncate max-w-[150px]">{log.track?.artist || "Неизвестно"}</div>
                </div>
              </div>
              <div className="text-xs font-mono text-neutral-400">
                {new Date(log.playedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-sm text-neutral-500 font-medium tracking-wide">История воспроизведения пуста.</p>
          </div>
        )}
      </div>
    </div>
  );
}
