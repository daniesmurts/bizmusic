import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { referralAgents, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { becomeAffiliateAction } from "./actions";

export const metadata = { title: "Стать партнёром — Бизмюзик" };

export default async function BecomeAffiliatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Not logged in → partner registration (creates a PARTNER-role account)
  if (!user) {
    redirect("/partner/register");
  }

  const userRow = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { role: true },
  });

  // PARTNER users already have their agent account — send them to the dashboard
  if (userRow?.role === "PARTNER") {
    redirect("/dashboard/affiliate");
  }

  // Any role: if an agent record already exists, nothing more to do
  const existing = await db.query.referralAgents.findFirst({
    where: eq(referralAgents.userId, user.id),
    columns: { id: true },
  });
  if (existing) {
    redirect("/dashboard/affiliate");
  }

  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#5cf387]/30 bg-[#5cf387]/5 text-[#5cf387] text-xs font-black uppercase tracking-widest mb-6">
            Партнёрская программа
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Стать партнёром</h1>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Рекомендуйте Бизмюзик и получайте{" "}
            <span className="text-[#5cf387] font-bold">30% ежемесячно</span>{" "}
            от оплат каждого привлечённого клиента.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-neutral-900/80 border border-white/10 rounded-3xl p-8 backdrop-blur">
          {error === "missing_fields" && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              Пожалуйста, заполните все обязательные поля.
            </div>
          )}

          <form action={becomeAffiliateAction} className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">
                Полное имя <span className="text-[#5cf387]">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                required
                placeholder="Иванова Анна Петровна"
                className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#5cf387]/50 focus:ring-1 focus:ring-[#5cf387]/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">
                Телефон <span className="text-[#5cf387]">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                placeholder="+7 (900) 000-00-00"
                className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#5cf387]/50 focus:ring-1 focus:ring-[#5cf387]/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">
                Город <span className="text-[#5cf387]">*</span>
              </label>
              <input
                type="text"
                name="city"
                required
                placeholder="Москва"
                className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#5cf387]/50 focus:ring-1 focus:ring-[#5cf387]/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">
                Откуда узнали о программе
              </label>
              <select
                name="source"
                className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[#5cf387]/50 focus:ring-1 focus:ring-[#5cf387]/20 transition appearance-none"
              >
                <option value="vk">ВКонтакте</option>
                <option value="telegram">Telegram</option>
                <option value="friend">От знакомого</option>
                <option value="other">Другое</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-[#5cf387] text-black font-black uppercase tracking-widest text-sm py-4 rounded-2xl hover:bg-[#5cf387]/90 transition mt-2"
            >
              Стать партнёром
            </button>
          </form>

          {/* Info block */}
          <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
            {[
              "30% комиссии каждый месяц, пока клиент платит",
              "Уникальная реферальная ссылка — делитесь в соцсетях",
              "Прозрачная статистика в личном кабинете",
            ].map((text) => (
              <div key={text} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#5cf387]/10 border border-[#5cf387]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#5cf387]" />
                </div>
                <p className="text-neutral-400 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
