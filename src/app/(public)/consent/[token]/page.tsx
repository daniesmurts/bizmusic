import { getActorByConsentTokenAction } from "@/lib/actions/consent";
import { Metadata } from "next";
import { Clock, Music, ShieldAlert } from "lucide-react";
import Link from "next/link";
import ConsentForm from "./ConsentForm";

export const metadata: Metadata = {
  title: "Согласие на создание голосовой модели — Бизнес Музыка",
  description: "Подтвердите или отклоните согласие на создание персональной голосовой модели.",
};

// Страница не должна кешироваться — токен одноразовый
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ConsentPage({ params }: PageProps) {
  const { token } = await params;
  const result = await getActorByConsentTokenAction(token);

  const logo = (
    <div className="flex items-center justify-center gap-3 mb-8">
      <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center rotate-3">
        <Music className="w-6 h-6 text-white" />
      </div>
      <span className="text-2xl font-black uppercase tracking-tighter text-slate-900">
        Бизнес <span className="text-emerald-600">Музыка</span>
      </span>
    </div>
  );

  // Ошибка / недействительная ссылка
  if (!result.success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {logo}
          <div className="bg-white rounded-3xl p-10 shadow-xl border border-red-100 text-center space-y-6">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Ссылка недействительна
              </h1>
              <p className="mt-3 text-slate-500 leading-relaxed">
                {result.error}
              </p>
            </div>
            <p className="text-sm text-slate-400">
              Если вы считаете, что произошла ошибка, обратитесь в компанию,
              которая отправила вам это приглашение.
            </p>
            <Link
              href="/"
              className="block text-sm text-slate-500 hover:text-slate-700 underline"
            >
              На главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { fullName, companyName, alreadyConsented } = result.data;

  // Уже дал согласие ранее
  if (alreadyConsented) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          {logo}
          <div className="bg-white rounded-3xl p-10 shadow-xl border border-emerald-100 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Согласие уже подтверждено
              </h1>
              <p className="mt-3 text-slate-500 leading-relaxed">
                Вы, {fullName}, уже давали согласие на создание голосовой модели для компании «{companyName}».
              </p>
            </div>
            <p className="text-sm text-slate-400">
              Если вы хотите отозвать согласие, напишите на&nbsp;
              <a href="mailto:support@bizmuzik.ru" className="underline text-slate-500">
                support@bizmuzik.ru
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Основная форма согласия
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-lg mx-auto">
        {logo}

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-900/10 overflow-hidden border border-slate-100">
          {/* Заголовок */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-8 pt-8 pb-6">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-2">
              Запрос на согласие
            </p>
            <h1 className="text-2xl font-black text-white leading-tight">
              Создание голосовой модели
            </h1>
            <p className="mt-2 text-slate-400 text-sm">
              Компания <span className="text-white font-medium">«{companyName}»</span>
            </p>
          </div>

          {/* Приветствие */}
          <div className="px-8 py-6 border-b border-slate-100">
            <p className="text-slate-700 leading-relaxed">
              Здравствуйте, <strong className="text-slate-900">{fullName}</strong>!
            </p>
            <p className="mt-2 text-slate-600 text-sm leading-relaxed">
              Вас указали в качестве диктора для{" "}
              <strong className="text-slate-800">персональной голосовой модели</strong>.
              Ознакомьтесь с условиями и примите решение.
            </p>
          </div>

          {/* Форма */}
          <div className="px-8 py-8">
            <ConsentForm
              token={token}
              actorName={fullName}
              companyName={companyName}
            />
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          Данные обрабатываются в соответствии с&nbsp;
          <Link href="/legal/privacy" className="underline hover:text-slate-600">
            Политикой конфиденциальности
          </Link>{" "}
          и Федеральным законом № 152-ФЗ
        </p>
      </div>
    </div>
  );
}
