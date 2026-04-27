"use client";

import { useState } from "react";
import { ChevronDown, BookOpen, Sparkles, ShieldCheck, Zap, Coffee, TrendingUp, Music, Info, Calendar, Clock, BarChart3, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { niches } from "@/lib/data/niches";
import { guides } from "@/lib/data/guides";

const ICON_MAP: Record<string, any> = {
  Sparkles,
  ShieldCheck,
  Zap,
  Coffee,
  TrendingUp,
  Music,
  Info
};

const DAY_META: Record<string, { label: string; dots: number; color: string; activity: number }> = {
  "Пн": { label: "Подготовка", dots: 2, color: "text-amber-500", activity: 30 },
  "Вт": { label: "Главный день", dots: 5, color: "text-neon", activity: 100 },
  "Ср": { label: "Follow-up день", dots: 5, color: "text-neon", activity: 95 },
  "Чт": { label: "Конверсия", dots: 5, color: "text-neon", activity: 90 },
  "Пт": { label: "Добивка", dots: 3, color: "text-amber-500", activity: 60 },
  "Сб": { label: "Почти выходной", dots: 2, color: "text-amber-500", activity: 20 },
  "Вс": { label: "Выходной", dots: 0, color: "text-neutral-500", activity: 0 }
};

const TAG_COLORS: Record<string, string> = {
  "Организация": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "Новые контакты": "bg-neon/10 text-neon border-neon/20",
  "Follow-up": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Пауза": "bg-white/5 text-neutral-400 border-white/10"
};

const DAY_NAMES: Record<string, string> = {
  "Пн": "Понедельник",
  "Вт": "Вторник",
  "Ср": "Среда",
  "Чт": "Четверг",
  "Пт": "Пятница",
  "Сб": "Суббота",
  "Вс": "Воскресенье"
};

export default function GuidesPage() {
  const [selectedNiche, setSelectedNiche] = useState<string>("salon");
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [isNicheDropdownOpen, setIsNicheDropdownOpen] = useState(false);

  const currentGuide = guides[selectedNiche];
  const nicheList = Object.values(niches);
  const currentNiche = niches[selectedNiche];

  return (
    <div className="space-y-8 md:space-y-12 animate-fade-in pb-10 md:pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
            База <span className="text-neon">Знаний</span>
          </h1>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] md:text-[12px] mt-1">
            Инструкции и лайфхаки по продажам
          </p>
        </div>

        {/* Niche Dropdown Filter */}
        <div className="relative z-50 w-full md:w-72">
          <button
            onClick={() => setIsNicheDropdownOpen(!isNicheDropdownOpen)}
            className={cn(
              "w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-black/40 border transition-all duration-300 group",
              isNicheDropdownOpen ? "border-neon shadow-[0_0_30px_rgba(92,243,135,0.1)]" : "border-white/10 hover:border-white/20"
            )}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-neutral-500 group-hover:text-neon transition-colors" />
              <span className="text-[12px] md:text-[13px] font-black uppercase tracking-widest text-white">
                {currentNiche?.name || "Выберите нишу"}
              </span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-neutral-500 transition-transform duration-300", isNicheDropdownOpen && "rotate-180")} />
          </button>

          {isNicheDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-2 p-2 rounded-2xl bg-[#0A0A0A] border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 origin-top">
              <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                {nicheList.map((n) => (
                  <button
                    key={n.slug}
                    onClick={() => {
                      setSelectedNiche(n.slug);
                      setIsNicheDropdownOpen(false);
                      setSelectedDayIdx(0);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group",
                      selectedNiche === n.slug 
                        ? "bg-neon/10 text-neon" 
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span className="text-[12px] font-black uppercase tracking-widest">{n.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {currentGuide ? (
        <div className="space-y-12 md:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Why they buy sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {currentGuide.sections.map((section, idx) => {
              const Icon = ICON_MAP[section.icon || "Info"] || Info;
              return (
                <div 
                  key={idx} 
                  className="glass-dark border border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 space-y-4 hover:border-white/20 transition-all group"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-neon/10 transition-colors">
                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-neutral-500 group-hover:text-neon transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-[11px] md:text-xs font-black uppercase tracking-widest text-white">{section.title}</h3>
                    <p className="text-neutral-400 text-[12px] md:text-[14px] leading-relaxed font-medium">
                      {section.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Weekly Strategy Section */}
          {currentGuide.weeklyStrategy && (
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-neon/10 flex items-center justify-center">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-neon" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-white">План недели</h2>
                  <p className="text-[10px] md:text-[12px] font-black uppercase tracking-widest text-neutral-500">Система активных продаж</p>
                </div>
              </div>

              {/* Day Selector - Scrollable on mobile */}
              <div className="flex md:grid md:grid-cols-7 gap-2 overflow-x-auto pb-4 md:pb-0 scrollbar-none">
                {currentGuide.weeklyStrategy.days.map((day, idx) => {
                  const meta = DAY_META[day.day];
                  const isActive = selectedDayIdx === idx;
                  return (
                    <button
                      key={day.day}
                      onClick={() => setSelectedDayIdx(idx)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1.5 md:gap-2 p-3 md:p-4 rounded-xl md:rounded-2xl border transition-all min-w-[70px] md:min-w-0",
                        isActive
                          ? "bg-white/10 border-white/30 md:bg-white/5 md:border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                          : "bg-black/20 border-white/5 hover:border-white/10 text-neutral-500"
                      )}
                    >
                      <div className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">{day.day}</div>
                      <div className="hidden md:block text-[8px] font-bold opacity-60 uppercase">{meta.label}</div>
                      <div className="flex gap-0.5 md:gap-1">
                        {[1, 2, 3, 4, 5].map((dot) => (
                          <div 
                            key={dot} 
                            className={cn(
                              "w-0.5 h-0.5 md:w-1 md:h-1 rounded-full",
                              dot <= meta.dots ? (meta.color === "text-neon" ? "bg-neon" : "bg-amber-500") : "bg-white/10"
                            )} 
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
                {/* Iron Rules */}
                <div className="lg:col-span-1 space-y-4 md:space-y-6">
                  <div className="glass-dark border border-white/10 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 space-y-6">
                    <div className="flex items-center gap-2 text-neon">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">Железные правила</span>
                    </div>
                    <ul className="space-y-3 md:space-y-4">
                      {currentGuide.weeklyStrategy.rules.map((rule, idx) => (
                        <li key={idx} className="flex gap-3 text-[12px] md:text-[14px] font-bold text-neutral-400 leading-relaxed">
                          <span className="text-neon/40 flex-shrink-0">0{idx + 1}</span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Day Details */}
                <div className="lg:col-span-3 space-y-6">
                  <div className="glass-dark border border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-10 space-y-8 md:space-y-12">
                    {/* Day Header with Activity Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6 md:pb-10">
                      <div className="space-y-1">
                        <h3 className="text-xl md:text-3xl font-black uppercase tracking-tighter text-white">
                          {DAY_NAMES[currentGuide.weeklyStrategy.days[selectedDayIdx].day]}
                        </h3>
                        <p className="text-neutral-500 text-[10px] md:text-[12px] font-bold uppercase tracking-[0.2em]">
                          {currentGuide.weeklyStrategy.days[selectedDayIdx].label}
                        </p>
                      </div>
                      
                      <div className="flex flex-col md:items-end gap-2 md:gap-3">
                        <div className="flex items-center gap-3 md:gap-4">
                          <span className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-neutral-500">Активность</span>
                          <div className="w-24 md:w-32 h-1 md:h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all duration-1000",
                                DAY_META[currentGuide.weeklyStrategy.days[selectedDayIdx].day].color === "text-neon" ? "bg-neon shadow-[0_0_10px_#5cf387]" : "bg-neutral-600"
                              )}
                              style={{ width: `${DAY_META[currentGuide.weeklyStrategy.days[selectedDayIdx].day].activity}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-6 md:space-y-8">
                      {currentGuide.weeklyStrategy.days[selectedDayIdx].tasks.map((task, i) => (
                        <div key={i} className="flex flex-col md:flex-row gap-2 md:gap-8 group">
                          <div className="w-full md:w-24 pt-1 flex-shrink-0">
                            <span className="text-[10px] md:text-[12px] font-black text-neutral-500 tracking-tighter">{task.time}</span>
                          </div>
                          <div className="relative pl-4 md:pl-8 pb-6 md:pb-8 border-l border-white/5 group-last:border-transparent group-last:pb-0">
                            <div className={cn(
                              "absolute -left-[1.5px] top-1 md:top-2.5 w-0.5 md:w-1 h-10 md:h-12 rounded-full",
                              task.tag ? (TAG_COLORS[task.tag]?.split(' ')[1]) : "bg-white/10"
                            )} />
                            <div className="space-y-2 md:space-y-3">
                              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                {task.tag && (
                                  <span className={cn(
                                    "px-1.5 py-0.5 md:px-2 md:py-1 rounded-md md:rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest border",
                                    TAG_COLORS[task.tag]
                                  )}>
                                    {task.tag}
                                  </span>
                                )}
                                <h4 className="text-[11px] md:text-xs font-black uppercase tracking-widest text-white">{task.title}</h4>
                              </div>
                              <p className="text-[12px] md:text-[15px] text-neutral-400 font-bold leading-relaxed max-w-2xl">
                                {task.desc}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Metrics Footer Boxes - Responsive columns */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 pt-4">
                      {currentGuide.weeklyStrategy.days[selectedDayIdx].metrics.map((m, i) => (
                        <div key={i} className={cn(
                          "bg-white/[0.02] border border-white/5 rounded-xl md:rounded-[1.5rem] p-4 md:p-6 text-center space-y-1",
                          i === 2 && "col-span-2 md:col-span-1" // Last metric spans full width on mobile grid if needed
                        )}>
                          <div className="text-xl md:text-3xl font-black text-white leading-none tracking-tighter">{m.value}</div>
                          <div className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-neutral-500 mt-1 md:mt-2">{m.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-dark border border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] p-10 md:p-16 text-center space-y-4">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-white/5 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-neutral-700" />
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-black uppercase tracking-widest text-base md:text-lg">Гайд готовится</h3>
            <p className="text-neutral-500 text-[12px] md:text-sm font-medium max-w-md mx-auto leading-relaxed">
              Наши эксперты по продажам в нише "{currentNiche?.name}" дорабатывают лучшие практики. Инструкция появится здесь совсем скоро.
            </p>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isNicheDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsNicheDropdownOpen(false)} 
        />
      )}
    </div>
  );
}
