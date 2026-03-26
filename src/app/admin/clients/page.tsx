"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus, Users, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientTable } from "@/components/admin/ClientTable";
import { getClientsAction } from "@/lib/actions/clients";
import { retryFailedLicensesBatchAction } from "@/lib/actions/licenses";
import { AdminBusiness } from "@/types/admin";
import { toast } from "sonner";

export default function ClientsPage() {
  const [retryingFailed, setRetryingFailed] = useState(false);

  const { data: clients, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const result = await getClientsAction();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data as AdminBusiness[];
    },
  });

  useEffect(() => {
    if (error) {
      toast.error("Ошибка загрузки клиентов");
    }
  }, [error]);

  const failedDocsCount = clients?.filter((c) => c.licenses?.[0]?.documentStatus === "FAILED").length || 0;

  const handleRetryFailed = async () => {
    setRetryingFailed(true);
    try {
      const result = await retryFailedLicensesBatchAction(50);
      if (!result.success) {
        toast.error(result.error || "Не удалось повторно сформировать документы");
        return;
      }

      const data = result.data;
      toast.success(`Повторная генерация завершена: восстановлено ${data?.recovered ?? 0} из ${data?.scanned ?? 0}`);
      await refetch();
    } catch {
      toast.error("Ошибка при пакетной повторной генерации");
    } finally {
      setRetryingFailed(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-neutral-500">
            <Users className="w-4 h-4 text-neon" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Управление бизнесом
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">
            Каталог <span className="text-neon">Клиентов</span>
          </h1>
          <p className="text-neutral-500 max-w-xl font-medium">
            Управление юридическими лицами, проверка подписок и доступ к лицензиям.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-6 px-8 py-4 glass-dark border border-white/5 rounded-2xl mr-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Всего клиентов
              </span>
              <span className="text-2xl font-black text-white">{clients?.length || 0}</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                Активные
              </span>
              <span className="text-2xl font-black text-neon">
                {clients?.filter(c => c.subscriptionStatus === "ACTIVE").length || 0}
              </span>
            </div>
          </div>

          <Button
            onClick={handleRetryFailed}
            disabled={retryingFailed || failedDocsCount === 0}
            variant="outline"
            className="border-amber-500/30 text-amber-300 rounded-2xl h-14 px-6 font-black uppercase tracking-widest gap-2"
          >
            <RefreshCcw className={`w-4 h-4 ${retryingFailed ? "animate-spin" : ""}`} />
            Повторить Ошибки ({failedDocsCount})
          </Button>
          
          <Button
            onClick={async () => {
              const res = await fetch("/api/seed");
              if (res.ok) {
                 toast.success("Данные успешно засеяны");
                 window.location.reload();
              } else {
                 toast.error("Ошибка при сидинге");
              }
            }}
            variant="outline"
            className="border-white/10 text-white rounded-2xl h-14 px-6 font-black uppercase tracking-widest gap-2"
          >
            Сидинг
          </Button>

          <Button
            className="bg-neon text-black hover:scale-[1.02] transition-transform rounded-2xl h-14 px-8 font-black uppercase tracking-widest shadow-[0_0_20px_rgba(92,243,135,0.3)] gap-2"
          >
            <Plus className="w-5 h-5" />
            Добавить ИНН
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="grid place-items-center py-20">
          <div className="w-16 h-16 border-4 border-neon/30 border-t-neon rounded-full animate-spin" />
        </div>
      ) : (
        <ClientTable clients={clients || []} />
      )}
    </div>
  );
}
