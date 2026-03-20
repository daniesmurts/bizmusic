"use client";

import { useState } from "react";
import { 
  Search, 
  Building2, 
  MapPin, 
  Calendar, 
  ExternalLink,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LicenseButton } from "./LicenseButton";
import { cn } from "@/lib/utils";
import { AdminBusiness } from "@/types/admin";

interface ClientTableProps {
  clients: AdminBusiness[];
}

export const ClientTable = ({ clients }: ClientTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredClients = clients.filter((client) =>
    client.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.inn.includes(searchQuery)
  );

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
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
            placeholder="Поиск по названию или ИНН..."
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
                  Бизнес
                </th>
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Реквизиты
                </th>
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Статус
                </th>
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Локации
                </th>
                <th className="text-left py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Регистрация
                </th>
                <th className="text-right py-6 px-6 text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className="group hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-neon/10 flex items-center justify-center border border-neon/20">
                        <Building2 className="w-5 h-5 text-neon" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm group-hover:text-neon transition-colors">
                          {client.legalName}
                        </p>
                        <p className="text-xs text-neutral-500 font-medium">
                          {client.user?.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <p className="text-xs text-white font-bold">ИНН: {client.inn}</p>
                      {client.kpp && (
                        <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-widest">
                          КПП: {client.kpp}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <Badge
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        client.subscriptionStatus === "ACTIVE"
                          ? "bg-neon/10 border-neon/20 text-neon"
                          : "bg-red-500/10 border-red-500/20 text-red-500"
                      )}
                    >
                      {client.subscriptionStatus === "ACTIVE" ? (
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3 h-3" />
                          Активен
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <ShieldAlert className="w-3 h-3" />
                          Неактивен
                        </span>
                      )}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <MapPin className="w-4 h-4 text-neon" />
                      <span className="text-sm font-bold">
                        {client._count.locations}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-neutral-500">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-medium">
                        {formatDate(client.createdAt)}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-end items-center gap-2">
                      <LicenseButton 
                        businessId={client.id} 
                        hasLicense={!!client.licenses?.[0]} 
                        pdfUrl={client.licenses?.[0]?.pdfUrl}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-neutral-400 hover:text-white"
                        asChild
                      >
                        <a href={`/admin/clients/${client.id}`}>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredClients.length === 0 && (
            <div className="py-20 text-center">
              <Building2 className="w-12 h-12 text-neutral-700 mx-auto mb-4" />
              <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">
                Клиенты не найдены
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
