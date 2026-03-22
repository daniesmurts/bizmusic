"use client";

import { Settings, Shield, Bell, User, ChevronRight } from "lucide-react";

export default function AdminSettingsPage() {
  const settingsGroups = [
    {
      title: "Профиль",
      icon: User,
      description: "Персональные данные и реквизиты компании",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20",
    },
    {
      title: "Безопасность",
      icon: Shield,
      description: "Пароли, двухфакторная аутентификация и сессии",
      color: "text-neon",
      bg: "bg-neon/10",
      border: "border-neon/20",
    },
    {
      title: "Уведомления",
      icon: Bell,
      description: "Настройка email и PWA пуш-уведомлений",
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      border: "border-purple-400/20",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-neutral-500">
            <Settings className="w-4 h-4 text-neon" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Настройки • Конфигурация системы
            </span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-none">
            Настройки <br />
            <span className="text-neon underline decoration-neon/20 underline-offset-8">
              Аккаунта
            </span>
          </h1>
        </div>
      </div>

      {/* Settings List */}
      <div className="space-y-4 max-w-3xl">
        {settingsGroups.map((group) => (
          <div
            key={group.title}
            className="glass-dark border border-white/5 rounded-[2rem] p-8 flex items-center gap-8 group cursor-pointer hover:border-white/20 transition-all"
          >
            <div className={`w-16 h-16 rounded-2xl ${group.bg} border ${group.border} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
              <group.icon className={`w-8 h-8 ${group.color}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black uppercase tracking-tight text-white mb-1 italic">
                {group.title}
              </h3>
              <p className="text-sm text-neutral-500 font-bold uppercase tracking-widest leading-none">
                {group.description}
              </p>
            </div>
            <ChevronRight className="w-6 h-6 text-neutral-700 group-hover:text-neon group-hover:translate-x-2 transition-all" />
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="glass-dark border border-white/5 rounded-[2rem] p-8 max-w-3xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-neon animate-pulse shadow-[0_0_10px_#5CF387]" />
          <p className="text-xs font-black uppercase tracking-widest text-neutral-400">
            Все системы работают в штатном режиме
          </p>
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600">
          Версия 1.0.4 - "Cosmos"
        </p>
      </div>
    </div>
  );
}
