import { db } from "@/db";
import { businesses, tracks, playLogs, licenses, payments, users } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import {
  Users,
  Music,
  CreditCard,
  Activity,
  TrendingUp,
  Play,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function AdminOverviewPage() {
  const [
    [businessRow],
    [trackRow],
    [playLogRow],
    [revenueRow],
    recentPayments,
    recentClients,
  ] = await Promise.all([
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(businesses),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(tracks),
    db.select({ count: sql<number>`cast(count(*) as int)` }).from(playLogs),
    db.select({ total: sql<number>`cast(coalesce(sum("totalCost"), 0) as int)` }).from(licenses),
    db
      .select({
        id: payments.id,
        amount: payments.amount,
        status: payments.status,
        paymentType: payments.paymentType,
        createdAt: payments.createdAt,
        legalName: businesses.legalName,
      })
      .from(payments)
      .leftJoin(businesses, eq(payments.businessId, businesses.id))
      .orderBy(desc(payments.createdAt))
      .limit(5),
    db
      .select({
        id: businesses.id,
        legalName: businesses.legalName,
        subscriptionStatus: businesses.subscriptionStatus,
        createdAt: businesses.createdAt,
        email: users.email,
      })
      .from(businesses)
      .leftJoin(users, eq(businesses.userId, users.id))
      .orderBy(desc(businesses.createdAt))
      .limit(5),
  ]);

  const businessesCount = businessRow?.count ?? 0;
  const tracksCount     = trackRow?.count ?? 0;
  const playLogsCount   = playLogRow?.count ?? 0;
  const totalRevenue    = revenueRow?.total ?? 0;

  const stats = [
    {
      name: "Общая выручка",
      value: `${totalRevenue.toLocaleString('ru-RU')} ₽`,
      change: "+12.5%",
      trend: "up",
      icon: CreditCard,
      color: "text-neon",
      bg: "bg-neon/10"
    },
    {
      name: "Активные бизнесы",
      value: businessesCount || 0,
      change: "+4",
      trend: "up",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-400/10"
    },
    {
      name: "Всего треков",
      value: tracksCount || 0,
      change: "+12",
      trend: "up",
      icon: Music,
      color: "text-purple-400",
      bg: "bg-purple-400/10"
    },
    {
      name: "Проигрываний (всего)",
      value: playLogsCount?.toLocaleString('ru-RU') || 0,
      change: "+1.2k",
      trend: "up",
      icon: Play,
      color: "text-orange-400",
      bg: "bg-orange-400/10"
    },
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 text-neutral-500">
           <Activity className="w-4 h-4 text-neon" />
           <span className="text-[10px] font-black uppercase tracking-widest">Рабочий стол • Прямой эфир</span>
        </div>
        <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none">
          Панель <br /><span className="text-neon underline decoration-neon/20 underline-offset-8">Управления</span>
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="group relative p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-white/10 transition-all duration-500"
          >
            <div className={cn("absolute top-0 right-0 p-12 blur-[80px] rounded-full opacity-0 group-hover:opacity-10 transition-opacity duration-700", stat.bg)} />

            <div className="relative z-10 flex flex-col gap-6">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{stat.name}</p>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-black tracking-tighter leading-none text-white">{stat.value}</span>
                  <div className="flex items-center gap-1 text-[10px] font-black text-neon bg-neon/10 px-2 py-1 rounded-full mb-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.change}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Transactions + New Clients */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-24 bg-blue-500/5 blur-[100px] rounded-full" />
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-xl font-black uppercase tracking-normal">Последние транзакции</h3>
            <Link href="/admin/clients" className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">
              Смотреть всё
            </Link>
          </div>
          <div className="relative z-10 space-y-3">
            {recentPayments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center space-y-4 opacity-30">
                <CreditCard className="w-12 h-12" />
                <p className="text-xs font-black uppercase tracking-widest">История платежей пуста</p>
              </div>
            ) : (
              recentPayments.map((p) => {
                const isSuccess = p.status === "CONFIRMED";
                const isFailed = p.status === "REJECTED";
                return (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      {isSuccess ? (
                        <CheckCircle className="w-4 h-4 text-neon shrink-0" />
                      ) : isFailed ? (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-bold text-white truncate max-w-[160px]">{p.legalName ?? "—"}</p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest">{p.paymentType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-white">{(p.amount / 100).toLocaleString("ru-RU")} ₽</p>
                      <p className="text-[10px] text-neutral-500">
                        {new Date(p.createdAt).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* New Clients */}
        <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] space-y-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-24 bg-neon/5 blur-[100px] rounded-full" />
          <div className="flex items-center justify-between relative z-10">
            <h3 className="text-xl font-black uppercase tracking-normal">Новые клиенты</h3>
            <Link href="/admin/clients" className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">
              Верификация
            </Link>
          </div>
          <div className="relative z-10 space-y-3">
            {recentClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center space-y-4 opacity-30">
                <Users className="w-12 h-12" />
                <p className="text-xs font-black uppercase tracking-widest">Нет новых клиентов</p>
              </div>
            ) : (
              recentClients.map((c) => {
                const statusColor =
                  c.subscriptionStatus === "ACTIVE" ? "text-neon" :
                  c.subscriptionStatus === "EXPIRED" ? "text-red-400" :
                  "text-yellow-400";
                const statusLabel =
                  c.subscriptionStatus === "ACTIVE" ? "Активен" :
                  c.subscriptionStatus === "EXPIRED" ? "Истёк" :
                  "Неактивен";
                return (
                  <div key={c.id} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-neutral-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white truncate max-w-[160px]">{c.legalName}</p>
                        <p className="text-[10px] text-neutral-500 truncate max-w-[160px]">{c.email ?? "—"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-[10px] font-black uppercase tracking-widest", statusColor)}>{statusLabel}</p>
                      <p className="text-[10px] text-neutral-500">
                        {new Date(c.createdAt).toLocaleDateString("ru-RU")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
