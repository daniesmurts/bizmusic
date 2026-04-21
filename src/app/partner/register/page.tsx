import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { partnerRegisterAction } from "./actions";

export const metadata = { title: "Регистрация партнёра — Бизмюзик" };

const ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Пожалуйста, заполните все обязательные поля.",
  password_too_short: "Пароль должен содержать не менее 8 символов.",
  email_exists: "Аккаунт с таким email уже зарегистрирован. Войдите или используйте другой email.",
  auth_failed: "Не удалось создать аккаунт. Попробуйте позже.",
};

export default async function PartnerRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Already logged in — send to the right place
  if (user) redirect("/dashboard/affiliate");

  const { error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? "Произошла ошибка. Попробуйте снова.") : null;

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-block mb-6">
            <span className="text-2xl font-black text-white tracking-tight">
              Биз<span className="text-[#5cf387]">мюзик</span>
            </span>
          </Link>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#5cf387]/30 bg-[#5cf387]/5 text-[#5cf387] text-xs font-black uppercase tracking-widest mb-5">
            Партнёрская программа
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Регистрация партнёра</h1>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Создайте партнёрский аккаунт и получайте{" "}
            <span className="text-[#5cf387] font-bold">30% комиссии</span>{" "}
            ежемесячно с каждого привлечённого клиента.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-neutral-900/80 border border-white/10 rounded-3xl p-8 backdrop-blur">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {errorMessage}
            </div>
          )}

          <form action={partnerRegisterAction} className="space-y-5">
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
                Email <span className="text-[#5cf387]">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="partner@example.com"
                className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#5cf387]/50 focus:ring-1 focus:ring-[#5cf387]/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-neutral-400 mb-2">
                Пароль <span className="text-[#5cf387]">*</span>
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                placeholder="Не менее 8 символов"
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
                className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-[#5cf387]/50 transition appearance-none"
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
              Зарегистрироваться
            </button>
          </form>

          <p className="mt-6 text-center text-neutral-600 text-sm">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-[#5cf387] hover:underline">
              Войти
            </Link>
          </p>
        </div>

        {/* Programme highlights */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          {[
            { value: "30%", label: "комиссия" },
            { value: "∞", label: "месяцев" },
            { value: "0 ₽", label: "взнос" },
          ].map((item) => (
            <div key={item.label} className="bg-neutral-900/40 border border-white/5 rounded-2xl p-4">
              <p className="text-[#5cf387] text-xl font-black">{item.value}</p>
              <p className="text-neutral-500 text-xs mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
