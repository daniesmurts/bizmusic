import { db } from "@/db";
import { businesses, ttsCreditLots, ttsUsageEvents, payments } from "@/db/schema";
import { and, desc, eq, gt, gte, ilike, lt, sql, type SQL } from "drizzle-orm";
import { CreditCard, History, Wallet, Mic2 } from "lucide-react";
import Link from "next/link";

function formatRub(amountKopeks: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amountKopeks / 100);
}

function formatRuDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function escapeLike(value: string) {
  return value.replace(/[%_\\]/g, "\\$&");
}

export default async function AdminBillingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const now = new Date();
  const businessQuery = typeof resolvedSearchParams.business === "string"
    ? resolvedSearchParams.business.trim()
    : "";
  const fromQuery = typeof resolvedSearchParams.from === "string"
    ? resolvedSearchParams.from
    : "";
  const toQuery = typeof resolvedSearchParams.to === "string"
    ? resolvedSearchParams.to
    : "";

  const usageFilters: SQL[] = [];
  const balanceFilters: SQL[] = [];

  if (businessQuery) {
    const safeBusiness = escapeLike(businessQuery);
    usageFilters.push(ilike(businesses.legalName, `%${safeBusiness}%`));
    balanceFilters.push(ilike(businesses.legalName, `%${safeBusiness}%`));
  }

  if (fromQuery) {
    const fromDate = new Date(`${fromQuery}T00:00:00.000Z`);
    if (!Number.isNaN(fromDate.getTime())) {
      usageFilters.push(gte(ttsUsageEvents.createdAt, fromDate));
    }
  }

  if (toQuery) {
    const toDateExclusive = new Date(`${toQuery}T00:00:00.000Z`);
    if (!Number.isNaN(toDateExclusive.getTime())) {
      toDateExclusive.setUTCDate(toDateExclusive.getUTCDate() + 1);
      usageFilters.push(lt(ttsUsageEvents.createdAt, toDateExclusive));
    }
  }

  const [summary] = await db
    .select({
      totalPaidCredits: sql<number>`coalesce(sum(${ttsCreditLots.creditsRemaining}), 0)`,
      expiringIn30Days: sql<number>`coalesce(sum(case when ${ttsCreditLots.expiresAt} <= ${new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)} then ${ttsCreditLots.creditsRemaining} else 0 end), 0)`,
      totalPackPaymentsAmount: sql<number>`coalesce(sum(case when ${payments.paymentType} = 'credit_pack' and (${payments.status} = 'CONFIRMED' or ${payments.status} = 'AUTHORIZED') then ${payments.amount} else 0 end), 0)`,
    })
    .from(ttsCreditLots)
    .leftJoin(payments, eq(payments.id, ttsCreditLots.paymentId));

  const topBalances = await db
    .select({
      businessId: businesses.id,
      legalName: businesses.legalName,
      credits: sql<number>`coalesce(sum(${ttsCreditLots.creditsRemaining}), 0)`,
      nearestExpiry: sql<Date | null>`min(${ttsCreditLots.expiresAt})`,
    })
    .from(businesses)
    .leftJoin(
      ttsCreditLots,
      and(
        eq(ttsCreditLots.businessId, businesses.id),
        gt(ttsCreditLots.creditsRemaining, 0),
        gt(ttsCreditLots.expiresAt, now)
      )
    )
    .where(balanceFilters.length > 0 ? and(...balanceFilters) : undefined)
    .groupBy(businesses.id, businesses.legalName)
    .orderBy(desc(sql<number>`coalesce(sum(${ttsCreditLots.creditsRemaining}), 0)`))
    .limit(10);

  const recentUsage = await db
    .select({
      id: ttsUsageEvents.id,
      businessName: businesses.legalName,
      sourceType: ttsUsageEvents.sourceType,
      provider: ttsUsageEvents.provider,
      consumedCredits: ttsUsageEvents.consumedCredits,
      charsCount: ttsUsageEvents.charsCount,
      createdAt: ttsUsageEvents.createdAt,
    })
    .from(ttsUsageEvents)
    .leftJoin(businesses, eq(businesses.id, ttsUsageEvents.businessId))
    .where(usageFilters.length > 0 ? and(...usageFilters) : undefined)
    .orderBy(desc(ttsUsageEvents.createdAt))
    .limit(25);

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-neutral-500">
            <CreditCard className="w-4 h-4 text-neon" />
            <span className="text-[10px] font-black uppercase tracking-widest">Финансы • TTS отчеты</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none">
            TTS кредиты и <br />
            <span className="text-neon underline decoration-neon/20 underline-offset-8">генерации</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-neon/10 border border-neon/20 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-neon" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Активные пакетные кредиты</p>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white">{summary?.totalPaidCredits ?? 0}</h3>
          </div>
          <p className="text-sm text-neutral-400 font-medium">Доступный остаток по всем бизнесам.</p>
        </div>

        <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <History className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Истекают в 30 дней</p>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white">{summary?.expiringIn30Days ?? 0}</h3>
          </div>
          <p className="text-sm text-neutral-400 font-medium">Кредиты, требующие внимания и уведомлений.</p>
        </div>

        <div className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Mic2 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Продажи пакетов</p>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white">{formatRub(summary?.totalPackPaymentsAmount ?? 0)}</h3>
          </div>
          <p className="text-sm text-neutral-400 font-medium">Сумма подтвержденных платежей за пакеты кредитов.</p>
        </div>
      </div>

      <section className="glass-dark border border-white/5 rounded-[2rem] p-8 space-y-6">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white">Фильтр использования TTS</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mt-1">Поиск по бизнесу и диапазону дат</p>
        </div>

        <form method="GET" className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_1fr_1fr_auto_auto] gap-3 items-end">
          <div className="space-y-2">
            <label htmlFor="business" className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Бизнес</label>
            <input
              id="business"
              name="business"
              defaultValue={businessQuery}
              placeholder="Название бизнеса"
              className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-neutral-600 outline-none focus:border-neon/50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="from" className="text-[10px] font-black uppercase tracking-widest text-neutral-500">С даты</label>
            <input
              id="from"
              name="from"
              type="date"
              defaultValue={fromQuery}
              className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-neon/50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="to" className="text-[10px] font-black uppercase tracking-widest text-neutral-500">По дату</label>
            <input
              id="to"
              name="to"
              type="date"
              defaultValue={toQuery}
              className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none focus:border-neon/50"
            />
          </div>

          <button
            type="submit"
            className="h-12 px-6 rounded-xl bg-neon text-black text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-transform"
          >
            Применить
          </button>

          <Link
            href="/admin/billing"
            className="h-12 px-6 rounded-xl border border-white/10 text-white text-xs font-black uppercase tracking-widest inline-flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            Сбросить
          </Link>
        </form>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="glass-dark border border-white/5 rounded-[2rem] p-8">
          <h2 className="text-xl font-black uppercase tracking-tight text-white mb-6">Топ остатков по бизнесам</h2>
          <div className="space-y-3">
            {topBalances.map((row) => (
              <div key={row.businessId} className="border border-white/10 rounded-xl p-4 bg-white/[0.03]">
                <p className="text-sm font-black uppercase tracking-widest text-white">{row.legalName}</p>
                <p className="text-xs text-neutral-400 mt-1">Кредиты: <span className="text-neon font-bold">{row.credits}</span></p>
                <p className="text-xs text-neutral-500 mt-1">Ближайшее истечение: {formatRuDate(row.nearestExpiry)}</p>
              </div>
            ))}
            {topBalances.length === 0 && (
              <div className="border border-white/10 rounded-xl p-4 bg-white/[0.03] text-sm text-neutral-400">
                Ничего не найдено по текущему фильтру.
              </div>
            )}
          </div>
        </section>

        <section className="glass-dark border border-white/5 rounded-[2rem] p-8">
          <h2 className="text-xl font-black uppercase tracking-tight text-white mb-6">Последние генерации</h2>
          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-2">
            {recentUsage.map((event) => (
              <div key={event.id} className="border border-white/10 rounded-xl p-4 bg-white/[0.03]">
                <p className="text-sm font-black uppercase tracking-widest text-white">{event.businessName}</p>
                <p className="text-xs text-neutral-400 mt-1">Источник: <span className="font-bold">{event.sourceType}</span> • Провайдер: <span className="font-bold">{event.provider}</span></p>
                <p className="text-xs text-neutral-500 mt-1">Списано: {event.consumedCredits} • Символов: {event.charsCount}</p>
                <p className="text-xs text-neutral-500 mt-1">{new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" }).format(event.createdAt)}</p>
              </div>
            ))}
            {recentUsage.length === 0 && (
              <div className="border border-white/10 rounded-xl p-4 bg-white/[0.03] text-sm text-neutral-400">
                Нет событий использования по выбранным параметрам.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
