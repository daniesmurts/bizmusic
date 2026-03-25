"use client";

import { useState } from "react";
import { 
  Search, 
  History, 
  Music, 
  Building2, 
  MapPin, 
  Clock
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { AdminPlayLog } from "@/types/admin";

interface LogTableProps {
  logs: AdminPlayLog[];
}

export const LogTable = ({ logs }: LogTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedQuery = searchQuery.toLowerCase();

  const filteredLogs = logs.filter((log) =>
    (log.track?.title ?? "Удаленный трек").toLowerCase().includes(normalizedQuery) ||
    (log.track?.artist ?? "Неизвестный артист").toLowerCase().includes(normalizedQuery) ||
    (log.business?.legalName ?? "").toLowerCase().includes(normalizedQuery)
  );

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по треку, артисту или бизнесу..."
            className="pl-12 bg-white/[0.02] border-white/10 text-white rounded-2xl h-14"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-dark border border-white/5 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Время
                </th>
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Трек
                </th>
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Бизнес
                </th>
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Локация
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="group hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 text-white font-bold text-sm">
                        <Clock className="w-3 h-3 text-neon" />
                        {formatTime(log.playedAt)}
                      </div>
                      <span className="text-[10px] text-neutral-500 font-medium ml-5">
                        {formatDate(log.playedAt)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                       <Music className="w-4 h-4 text-neutral-500" />
                       <div>
                         <p className="font-bold text-white text-sm">
                           {log.track?.title || "Удаленный трек"}
                         </p>
                         <p className="text-xs text-neutral-500 font-medium">
                           {log.track?.artist || "Запись больше недоступна в каталоге"}
                         </p>
                       </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                       <Building2 className="w-4 h-4 text-neutral-600" />
                       <span className="text-sm font-bold text-neutral-400">
                         {log.business?.legalName || "Админ панель"}
                       </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                       <MapPin className="w-4 h-4 text-neutral-600" />
                       <span className="text-xs font-medium text-neutral-500">
                         {log.location?.name || "Основной"}
                       </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLogs.length === 0 && (
            <div className="py-20 text-center">
              <History className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">
                События не найдены
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
