"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAnnouncementScheduleAction,
  updateAnnouncementScheduleAction,
  getSchedulableAnnouncementsAction,
} from "@/lib/actions/announcement-scheduling";
import type { AnnouncementScheduleConfig } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CalendarClock,
  Volume2,
  Shuffle,
  ListOrdered,
  BarChart3,
  Play,
  ArrowLeft,
  Save,
  Loader2,
  Power,
  Trash2,
  Plus,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { usePlayerStore } from "@/store/usePlayerStore";

const DAYS_OF_WEEK = [
  { key: "mon" as const, label: "Пн" },
  { key: "tue" as const, label: "Вт" },
  { key: "wed" as const, label: "Ср" },
  { key: "thu" as const, label: "Чт" },
  { key: "fri" as const, label: "Пт" },
  { key: "sat" as const, label: "Сб" },
  { key: "sun" as const, label: "Вс" },
];

const MODE_OPTIONS = [
  { id: "sequential" as const, label: "По порядку", icon: ListOrdered, description: "Анонсы воспроизводятся последовательно" },
  { id: "random" as const, label: "Случайный", icon: Shuffle, description: "Случайный анонс каждый раз" },
  { id: "weighted" as const, label: "По весу", icon: BarChart3, description: "Чаще играют анонсы с большим весом" },
];

interface ScheduleAnnouncementItem {
  id: string;
  trackId: string;
  title: string;
  text: string;
  provider: string;
  voiceName: string;
  duration: number;
  fileUrl: string;
  streamUrl: string;
}

export default function AnnouncementSchedulePage() {
  const { role } = useAuth();
  const isBranchManager = role === "STAFF";
  const queryClient = useQueryClient();
  const loadAnnouncementQueue = usePlayerStore((s) => s.loadAnnouncementQueue);
  const disableAnnouncementSchedule = usePlayerStore((s) => s.disableAnnouncementSchedule);

  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState(5);
  const [mode, setMode] = useState<"sequential" | "random" | "weighted">("sequential");
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [timeRules, setTimeRules] = useState<{ time: string; announcementId: string; days: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[] }[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Load current schedule config
  const { data: scheduleData, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ["announcement-schedule"],
    queryFn: async () => {
      const result = await getAnnouncementScheduleAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  // Load available announcements
  const { data: announcements, isLoading: isLoadingAnnouncements } = useQuery({
    queryKey: ["schedulable-announcements"],
    queryFn: async () => {
      const result = await getSchedulableAnnouncementsAction();
      if (!result.success) throw new Error(result.error);
      return result.data as ScheduleAnnouncementItem[];
    },
  });

  // Initialize form from loaded data
  useEffect(() => {
    if (scheduleData) {
      setEnabled(scheduleData.enabled);
      setFrequency(scheduleData.config.frequency || 5);
      setMode(scheduleData.config.mode || "sequential");
      setWeights(scheduleData.config.weights || {});
      setTimeRules(scheduleData.config.timeRules || []);
    }
  }, [scheduleData]);

  const markChanged = useCallback(() => setHasChanges(true), []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const config: AnnouncementScheduleConfig = {
        frequency,
        mode,
        timeRules,
        weights,
      };
      return updateAnnouncementScheduleAction({ enabled, config });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Расписание анонсов сохранено");
        setHasChanges(false);
        queryClient.invalidateQueries({ queryKey: ["announcement-schedule"] });

        // Sync to player store
        if (enabled && announcements && frequency > 0) {
          loadAnnouncementQueue(
            announcements.map((a) => ({
              id: a.trackId,
              title: a.title,
              artist: "Анонс",
              fileUrl: a.fileUrl,
              streamUrl: a.streamUrl,
              duration: a.duration,
              isAnnouncement: true,
              announcementId: a.announcementId,
            })),
            { frequency, mode, weights }
          );
        } else {
          disableAnnouncementSchedule();
        }
      } else {
        toast.error(result.error);
      }
    },
    onError: () => {
      toast.error("Ошибка сохранения расписания");
    },
  });

  const addTimeRule = () => {
    setTimeRules([...timeRules, { time: "09:00", announcementId: "", days: ["mon", "tue", "wed", "thu", "fri"] }]);
    markChanged();
  };

  const removeTimeRule = (index: number) => {
    setTimeRules(timeRules.filter((_, i) => i !== index));
    markChanged();
  };

  const updateTimeRule = (index: number, update: Partial<typeof timeRules[number]>) => {
    setTimeRules(timeRules.map((r, i) => i === index ? { ...r, ...update } : r));
    markChanged();
  };

  const toggleDay = (ruleIndex: number, day: typeof DAYS_OF_WEEK[number]["key"]) => {
    const rule = timeRules[ruleIndex];
    const days = rule.days.includes(day)
      ? rule.days.filter((d) => d !== day)
      : [...rule.days, day];
    updateTimeRule(ruleIndex, { days });
  };

  if (isBranchManager) {
    return (
      <div className="space-y-8 pb-20 animate-fade-in">
        <div className="glass-dark border border-white/10 rounded-[2rem] p-8 text-neutral-400 text-sm">
          Менеджер филиала не может настраивать расписание анонсов.
        </div>
      </div>
    );
  }

  const isLoading = isLoadingSchedule || isLoadingAnnouncements;

  return (
    <div className="space-y-10 pb-20 animate-fade-in relative">
      {/* Decorative */}
      <div className="fixed top-[-10%] left-[-10%] w-[800px] h-[800px] bg-neon/10 rounded-full blur-[150px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="space-y-1">
          <Link href="/dashboard/announcements" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white text-[10px] font-black uppercase tracking-widest mb-4 transition-colors">
            <ArrowLeft className="w-3 h-3" /> Библиотека анонсов
          </Link>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white">
            Авто-<span className="text-neon">расписание</span>
          </h2>
          <p className="text-neutral-400 font-medium text-xs sm:text-sm italic">
            Настройте автоматическое воспроизведение анонсов между треками
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !hasChanges}
          className="bg-neon text-black hover:scale-105 transition-transform rounded-2xl px-8 h-14 font-black uppercase text-xs tracking-widest gap-2 shadow-lg shadow-neon/20 disabled:opacity-50"
        >
          {saveMutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Сохранение...</>
          ) : (
            <><Save className="w-4 h-4" /> Сохранить</>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 glass-dark rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Enable/Disable Toggle */}
          <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-neon/10 rounded-xl flex items-center justify-center border border-neon/20">
                  <CalendarClock className="w-6 h-6 text-neon" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">Авто-воспроизведение анонсов</h3>
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">
                    {enabled ? "Анонсы автоматически вставляются между треками" : "Отключено — анонсы воспроизводятся только вручную"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setEnabled(!enabled); markChanged(); }}
                className={`w-14 h-8 rounded-full relative transition-all ${
                  enabled ? "bg-neon" : "bg-white/10"
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white shadow-md absolute top-1 transition-all ${
                  enabled ? "left-7" : "left-1"
                }`} />
              </button>
            </div>
          </section>

          {enabled && (
            <>
              {/* No announcements warning */}
              {(!announcements || announcements.length === 0) && (
                <div className="glass-dark border border-amber-500/20 rounded-[2rem] p-6 flex items-center gap-4">
                  <Volume2 className="w-8 h-8 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-amber-300 font-bold text-sm uppercase tracking-tight">Нет анонсов для расписания</p>
                    <p className="text-neutral-500 text-xs mt-1">
                      <Link href="/dashboard/announcements" className="text-neon hover:underline">Создайте анонсы</Link> для использования в автоматическом расписании.
                    </p>
                  </div>
                </div>
              )}

              {/* Frequency */}
              <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">Частота</h3>
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">Как часто воспроизводить анонс</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Каждые N треков</Label>
                    <span className="text-lg text-neon font-black font-mono">{frequency}</span>
                  </div>
                  <Slider
                    value={[frequency]}
                    min={1}
                    max={20}
                    step={1}
                    onValueChange={(vals) => { setFrequency(vals[0]); markChanged(); }}
                    className="py-2"
                  />
                  <p className="text-[10px] text-neutral-600 font-medium">
                    Пример: при значении {frequency} — анонс прозвучит после каждых {frequency} треков
                  </p>
                </div>
              </section>

              {/* Mode */}
              <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">Режим</h3>
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">Порядок выбора анонса для воспроизведения</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {MODE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => { setMode(opt.id); markChanged(); }}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          mode === opt.id
                            ? "bg-neon/10 border-neon/40 text-white"
                            : "bg-white/5 border-white/10 text-neutral-400 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className={`w-5 h-5 ${mode === opt.id ? "text-neon" : "text-neutral-500"}`} />
                          <span className="text-xs font-black uppercase tracking-widest">{opt.label}</span>
                        </div>
                        <p className="text-[10px] text-neutral-500 font-medium">{opt.description}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Weights (only for weighted mode) */}
              {mode === "weighted" && announcements && announcements.length > 0 && (
                <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-6">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">Вес анонсов</h3>
                    <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">
                      Чем больше вес — тем чаще анонс будет воспроизводиться
                    </p>
                  </div>
                  <div className="space-y-4">
                    {announcements.map((a) => (
                      <div key={a.id} className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const audio = new Audio(a.streamUrl || a.fileUrl);
                            audio.play();
                          }}
                          className="w-10 h-10 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-neon hover:text-black shrink-0"
                        >
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </Button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white uppercase tracking-tight truncate">{a.title}</p>
                          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{a.duration} сек • {a.provider}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Slider
                            value={[weights[a.id] ?? 5]}
                            min={1}
                            max={10}
                            step={1}
                            onValueChange={(vals) => {
                              setWeights({ ...weights, [a.id]: vals[0] });
                              markChanged();
                            }}
                            className="w-24"
                          />
                          <span className="text-neon font-black text-sm font-mono w-6 text-right">{weights[a.id] ?? 5}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Time-Based Rules */}
              <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">Правила по времени</h3>
                    <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">
                      Воспроизведение конкретных анонсов в заданное время
                    </p>
                  </div>
                  <Button
                    onClick={addTimeRule}
                    disabled={!announcements || announcements.length === 0}
                    variant="outline"
                    className="rounded-xl border-white/15 text-white hover:bg-neon hover:text-black text-[10px] font-black uppercase tracking-widest gap-2"
                  >
                    <Plus className="w-3 h-3" /> Добавить правило
                  </Button>
                </div>

                {timeRules.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-500 text-sm font-medium">Нет правил по времени</p>
                    <p className="text-neutral-600 text-xs mt-1">Добавьте правило, чтобы воспроизводить конкретный анонс в определённое время</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {timeRules.map((rule, index) => (
                      <div key={index} className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Время</Label>
                              <input
                                type="time"
                                value={rule.time}
                                onChange={(e) => updateTimeRule(index, { time: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 text-white rounded-xl h-10 px-3 text-sm focus:border-neon/50 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Анонс</Label>
                              <select
                                value={rule.announcementId}
                                onChange={(e) => updateTimeRule(index, { announcementId: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 text-white rounded-xl h-10 px-3 text-sm focus:border-neon/50 focus:outline-none"
                              >
                                <option value="" className="bg-neutral-900">Выберите анонс...</option>
                                {announcements?.map((a) => (
                                  <option key={a.id} value={a.id} className="bg-neutral-900">{a.title}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTimeRule(index)}
                            className="w-10 h-10 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Дни недели</Label>
                          <div className="flex gap-2">
                            {DAYS_OF_WEEK.map((day) => (
                              <button
                                key={day.key}
                                onClick={() => toggleDay(index, day.key)}
                                className={`w-10 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                  rule.days.includes(day.key)
                                    ? "bg-neon text-black border-neon"
                                    : "bg-white/5 border-white/10 text-neutral-500 hover:border-white/20"
                                }`}
                              >
                                {day.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Preview */}
              {announcements && announcements.length > 0 && (
                <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-6">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">Анонсы в расписании</h3>
                    <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">
                      {announcements.length} анонсов будут чередоваться между треками
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {announcements.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-2xl">
                        <div className="w-10 h-10 bg-neon/10 rounded-xl flex items-center justify-center border border-neon/20 shrink-0">
                          <Volume2 className="w-4 h-4 text-neon" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-white uppercase tracking-tight truncate">{a.title}</p>
                          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">{a.duration} сек</p>
                        </div>
                        <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest px-2 py-0 border-white/10 shrink-0 ${
                          a.provider === "google" ? "text-indigo-400 bg-indigo-500/5" : "text-amber-400 bg-amber-500/5"
                        }`}>
                          {a.provider === "google" ? "Google" : "Salute"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* Info tip */}
          <div className="glass-dark p-8 rounded-[2rem] border border-white/5 space-y-4">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
              <Power className="text-indigo-400 w-5 h-5" />
            </div>
            <h4 className="text-lg font-black uppercase tracking-tight text-white">Как это работает?</h4>
            <p className="text-neutral-500 text-xs font-medium leading-relaxed uppercase tracking-tight">
              При включённом авто-воспроизведении плеер автоматически вставляет анонс между треками
              с выбранной частотой. Например, при частоте 5 — анонс прозвучит после каждого 5-го трека.
              Правила по времени позволяют запускать конкретные анонсы в определённые часы.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
