"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Search, Receipt, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getPaymentHistoryAction } from "@/lib/actions/history";
import { useAuth } from "@/components/AuthProvider";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  orderId: string;
  recurrent: boolean;
  createdAt: Date;
}

interface HistoryBusinessData {
  id: string;
}

export default function PaymentHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessData, setBusinessData] = useState<HistoryBusinessData | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      
      try {
        const response = await fetch('/api/user/business');
        if (response.ok) {
          const business = await response.json();
          setBusinessData(business);
          
          if (business?.id) {
            const hResult = await getPaymentHistoryAction(business.id);
            if (hResult.success && hResult.data) {
              setHistory(hResult.data);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  return (
    <div className="space-y-8 pb-20 relative z-0 min-h-screen">
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] bg-neon/15 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed top-[20%] right-[-5%] w-[600px] h-[600px] bg-purple-500/15 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] left-[10%] w-[800px] h-[800px] bg-blue-500/15 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex items-center gap-4 px-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.push('/dashboard/subscription')}
          className="rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </Button>
        <div className="space-y-1">
          <h2 className="text-3xl font-black uppercase tracking-tighter">История <span className="text-neon">платежей</span></h2>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Чеки и статусы оплат за подписку</p>
        </div>
      </div>

      <div className="glass-dark border border-white/10 rounded-[2rem] overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-neutral-500">
            <Clock className="w-10 h-10 animate-spin opacity-50 text-neon" />
            <span className="text-xs font-black uppercase tracking-widest">Загрузка данных...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="p-24 flex flex-col items-center justify-center gap-4 text-center">
             <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-neutral-600">
               <Search className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-bold text-white tracking-tight">Платежей не найдено</h3>
             <p className="text-sm text-neutral-500 max-w-sm">Мы не нашли транзакций по вашему аккаунту. Ваш пробный период или первая оплата еще не начаты.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {history.map((record, i) => (
              <div key={record.id} className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors">
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                       {record.status === 'CONFIRMED' || record.status === 'AUTHORIZED' ? (
                          <CheckCircle2 className="w-5 h-5 text-neon" />
                       ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                       )}
                    </div>
                    <div>
                       <div className="flex items-center gap-3">
                          <span className="font-bold text-lg">
                             {(record.amount / 100).toLocaleString('ru-RU')} ₽
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-white/5 text-neutral-400">
                             {record.recurrent ? "Автосписание" : "Инициализация"}
                          </span>
                       </div>
                       <div className="text-sm text-neutral-500 mt-1 uppercase tracking-wider text-[10px] font-bold">
                          {format(new Date(record.createdAt), 'dd MMMM yyyy, HH:mm', { locale: ru })} • ID: {record.orderId}
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-4">
                    <span className="text-xs font-black uppercase tracking-widest text-[#5cf387]">
                       {record.status === 'CONFIRMED' || record.status === 'AUTHORIZED' ? 'Успешно' : record.status}
                    </span>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
