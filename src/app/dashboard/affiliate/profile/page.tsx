"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPartnerProfileAction, updatePartnerProfileAction } from "@/lib/actions/crm-leads";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { User, Phone, MapPin, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AffiliateProfilePage() {
  const qc = useQueryClient();
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    city: "",
    telegramChatId: "",
  });

  const { data: res, isLoading } = useQuery({
    queryKey: ["partner-profile"],
    queryFn: () => getPartnerProfileAction(),
  });

  useEffect(() => {
    if (res?.success && res.data) {
      setFormData({
        fullName: res.data.fullName || "",
        phone: res.data.phone || "",
        city: res.data.city || "",
        telegramChatId: res.data.telegramChatId || "",
      });
    }
  }, [res]);

  const mutation = useMutation({
    mutationFn: () => updatePartnerProfileAction(formData),
    onSuccess: (r) => {
      if (r.success) {
        toast.success("Профиль обновлён");
        qc.invalidateQueries({ queryKey: ["partner-profile"] });
      } else {
        toast.error(r.error);
      }
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in relative z-0 pb-20">
      <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] bg-neon/5 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex items-center gap-4 px-2">
        <Link href="/dashboard/affiliate">
          <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter">
            Мой <span className="text-neon">профиль</span>
          </h2>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">
            Настройки аккаунта
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full bg-white/5 rounded-2xl" />
          <Skeleton className="h-16 w-full bg-white/5 rounded-2xl" />
          <Skeleton className="h-16 w-full bg-white/5 rounded-2xl" />
          <Skeleton className="h-16 w-full bg-white/5 rounded-2xl" />
        </div>
      ) : res?.success ? (
        <div className="glass-dark border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                <User className="w-3 h-3" /> ФИО
              </label>
              <input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Иванов Иван"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neon transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                <Phone className="w-3 h-3" /> Телефон
              </label>
              <input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+7 (999) 000-00-00"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neon transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Город
              </label>
              <input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Москва"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neon transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                <Send className="w-3 h-3" /> Telegram Chat ID
              </label>
              <input
                value={formData.telegramChatId}
                onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
                placeholder="Например: 123456789"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neon transition-colors"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Для получения уведомлений о новых назначенных лидах от бота.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <Button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="w-full bg-neon text-black rounded-xl font-black uppercase tracking-widest text-xs h-12 shadow-[0_0_20px_rgba(92,243,135,0.2)] hover:scale-[1.02] transition-transform"
            >
              Сохранить изменения
            </Button>
          </div>
        </div>
      ) : (
        <div className="glass-dark border border-white/10 p-12 rounded-[2rem] text-center text-neutral-500">
          Ошибка загрузки профиля
        </div>
      )}
    </div>
  );
}
