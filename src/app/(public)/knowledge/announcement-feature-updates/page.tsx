"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  Headphones,
  LayoutTemplate,
  Music2,
  Code2,
  BarChart3,
  Layers,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function AnnouncementFeatureUpdatesPage() {
  const features = [
    {
      icon: CalendarClock,
      title: "Авто-расписание анонсов",
      description:
        "Позволяет автоматически вставлять анонсы между треками: по частоте, по режиму выбора (последовательно/случайно/по весу) и по правилам времени.",
      howItWorks: [
        "Вы включаете расписание и задаете частоту, например каждые 5 треков.",
        "Система поддерживает режимы выбора анонсов: sequential, random, weighted.",
        "Опционально добавляются time-rules: конкретный анонс в конкретное время и дни недели.",
      ],
    },
    {
      icon: Headphones,
      title: "Превью без списания токена",
      description:
        "Перед публикацией можно прослушать синтез речи без сохранения файла и без расхода генерации/кредита.",
      howItWorks: [
        "Нажимаете кнопку превью в форме анонса.",
        "Система синтезирует временное аудио и возвращает его в интерфейс.",
        "Для защиты от злоупотреблений действует rate-limit (ограничение частоты превью).",
      ],
    },
    {
      icon: LayoutTemplate,
      title: "Шаблоны и сезонные паки",
      description:
        "Добавлены публичные шаблоны текста и административное управление каталогом шаблонов.",
      howItWorks: [
        "В форме генерации выбираете пакет и готовый шаблон.",
        "Шаблон подставляет заголовок и текст в форму.",
        "Админ может создавать/публиковать/сортировать шаблоны в панели контента.",
      ],
    },
    {
      icon: Music2,
      title: "Джинглы (intro/outro) и микширование",
      description:
        "К анонсу можно добавить музыкальный джингл в начало или конец с контролем громкости.",
      howItWorks: [
        "Админ загружает джинглы и публикует их в каталоге.",
        "Пользователь выбирает джингл при создании анонса.",
        "Сервер смешивает аудио через ffmpeg с fade/ducking и проверкой ограничений длительности.",
      ],
    },
    {
      icon: Code2,
      title: "SSML-режим",
      description:
        "Поддержка SSML для Google TTS: паузы, акценты, prosody и базовая валидация структуры.",
      howItWorks: [
        "Включаете SSML в форме, выбирается Google-провайдер.",
        "Используете сниппеты SSML или вводите разметку вручную.",
        "Перед генерацией выполняется базовая валидация тегов и вложенности.",
      ],
    },
    {
      icon: BarChart3,
      title: "Аналитика анонсов",
      description:
        "Добавлена статистика воспроизведений: plays, skips, skip-rate, средняя длительность прослушивания и распределение по часам.",
      howItWorks: [
        "Плеер отправляет события завершения/пропуска анонса.",
        "События пишутся в таблицу логов анонсов.",
        "На странице аналитики агрегируются метрики по периоду 7/30/90 дней.",
      ],
    },
    {
      icon: Layers,
      title: "Bulk-генерация и rollout",
      description:
        "Массовый запуск одного анонса на несколько плейлистов и филиалов с dry-run, режимами конфликтов и опциональным rollback.",
      howItWorks: [
        "Вы выбираете целевые плейлисты и/или филиалы.",
        "Для филиалов используется отдельный маппинг филиал → активный плейлист.",
        "Можно запускать dry-run, выбирать conflict mode (skip-existing/append) и rollback-on-failure.",
      ],
    },
  ];

  return (
    <div className="space-y-10 pb-20 animate-fade-in relative">
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] bg-neon/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="px-2 sm:px-4">
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-white transition-colors mb-8 font-bold text-[10px] uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Вернуться в базу знаний
        </Link>

        <div className="space-y-3 mb-8">
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter text-white">
            Что нового в <span className="text-neon">голосовых анонсах</span>
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base max-w-3xl">
            Краткий обзор ключевых функций, добавленных в последние итерации, и практический разбор,
            как каждая из них работает в продукте.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <section
                  key={feature.title}
                  className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-neon" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">{feature.title}</h2>
                  </div>

                  <p className="text-sm text-neutral-400 leading-relaxed">{feature.description}</p>

                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Как это работает</p>
                    <ul className="space-y-2">
                      {feature.howItWorks.map((step, index) => (
                        <li key={step} className="flex items-start gap-3 text-sm text-neutral-300">
                          <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-black text-neon shrink-0">
                            {index + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              );
            })}
          </div>

          <aside className="space-y-6">
            <div className="glass-dark border border-white/10 rounded-[2rem] p-6 sticky top-8 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Статус внедрения</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-xs text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-neon mt-0.5" />
                  <span>Функции доступны в интерфейсе дашборда и базе знаний.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-neutral-300">
                  <CheckCircle2 className="w-4 h-4 text-neon mt-0.5" />
                  <span>Основные unit-тесты проходят успешно.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-neutral-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5" />
                  <span>Применение миграций нужно подтверждать в доступной сети к БД.</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
