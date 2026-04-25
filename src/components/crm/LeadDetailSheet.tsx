"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLeadDetailAction,
  updateLeadStatusAction,
  scheduleCallbackAction,
  addLeadNoteAction,
  updateLeadContactNameAction,
  setConvertedSubscriptionIdAction,
} from "@/lib/actions/crm-leads";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  X, Phone, Globe, MapPin, Copy, Check, ChevronDown, ChevronUp,
  Send, Calendar, MessageSquare, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  new: { label: "Новый", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
  no_answer: { label: "Нет ответа", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30" },
  in_progress: { label: "В работе", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/30" },
  trial_sent: { label: "Пробный", color: "text-neon", bg: "bg-neon/10", border: "border-neon/30" },
  converted: { label: "Оплата", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30" },
  rejected: { label: "Отказ", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" },
  invalid: { label: "Невалидный", color: "text-neutral-400", bg: "bg-neutral-400/10", border: "border-neutral-400/30" },
};

const SCRIPTS: Record<string, { title: string; text: string }> = {
  "Салоны красоты": {
    title: "Скрипт: Салон красоты",
    text: `Добрый день! [Имя клиента]? Меня зовут [Ваше имя], сервис BizMuzik.\nВы знаете, что РАО штрафует салоны красоты за музыку без лицензии — до 25 000₽ за трек?\nМы защищаем от этого за 990₽/месяц. Есть 2 минуты?`,
  },
  "Кафе и кофейни": {
    title: "Скрипт: Кафе",
    text: `Добрый день! Это [название кафе]? Меня зовут [Ваше имя], сервис BizMuzik.\nХочу предупредить — РАО активно проверяет кафе в вашем районе.\nШтраф за каждую песню без лицензии — до 25 000₽.\nМы решаем это за 990₽/месяц с полным пакетом документов. Есть минута?`,
  },
  "Рестораны и бары": {
    title: "Скрипт: Ресторан",
    text: `Добрый день! Это [название кафе]? Меня зовут [Ваше имя], сервис BizMuzik.\nХочу предупредить — РАО активно проверяет кафе в вашем районе.\nШтраф за каждую песню без лицензии — до 25 000₽.\nМы решаем это за 990₽/месяц с полным пакетом документов. Есть минута?`,
  },
};

const DEFAULT_SCRIPT = {
  title: "Скрипт: Универсальный",
  text: `Добрый день! Меня зовут [Ваше имя], сервис BizMuzik — легальная музыка для бизнеса.\nВы знаете о штрафах РАО за музыку без лицензии? До 25 000₽ за каждый трек.\nМы защищаем от этих штрафов за 990₽/месяц. Удобно говорить?`,
};

interface LeadDetailSheetProps {
  leadId: string;
  onClose: () => void;
}

export function LeadDetailSheet({ leadId, onClose }: LeadDetailSheetProps) {
  const qc = useQueryClient();
  const [noteText, setNoteText] = useState("");
  const [callbackDate, setCallbackDate] = useState("");
  const [callbackTime, setCallbackTime] = useState("10:00");
  const [scriptOpen, setScriptOpen] = useState(false);
  const [contactEdit, setContactEdit] = useState("");
  const [editingContact, setEditingContact] = useState(false);
  const [subId, setSubId] = useState("");
  const [copied, setCopied] = useState(false);

  const { data: res, isLoading } = useQuery({
    queryKey: ["lead-detail", leadId],
    queryFn: () => getLeadDetailAction(leadId),
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["lead-detail", leadId] });
    qc.invalidateQueries({ queryKey: ["agent-leads"] });
    qc.invalidateQueries({ queryKey: ["agent-callbacks"] });
  };

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => updateLeadStatusAction(leadId, newStatus),
    onSuccess: (res) => {
      if (res.success) { toast.success("Статус обновлён"); invalidateAll(); }
      else toast.error(res.error);
    },
  });

  const noteMutation = useMutation({
    mutationFn: () => addLeadNoteAction(leadId, noteText),
    onSuccess: (res) => {
      if (res.success) { toast.success("Заметка сохранена"); setNoteText(""); invalidateAll(); }
      else toast.error(res.error);
    },
  });

  const callbackMutation = useMutation({
    mutationFn: () => scheduleCallbackAction(leadId, `${callbackDate}T${callbackTime}:00`),
    onSuccess: (res) => {
      if (res.success) { toast.success("Напоминание создано"); setCallbackDate(""); invalidateAll(); }
      else toast.error(res.error);
    },
  });

  const contactMutation = useMutation({
    mutationFn: () => updateLeadContactNameAction(leadId, contactEdit),
    onSuccess: (res) => {
      if (res.success) { toast.success("Контакт обновлён"); setEditingContact(false); invalidateAll(); }
      else toast.error(res.error);
    },
  });

  const subIdMutation = useMutation({
    mutationFn: () => setConvertedSubscriptionIdAction(leadId, subId),
    onSuccess: (res) => {
      if (res.success) { toast.success("ID подписки сохранён"); invalidateAll(); }
      else toast.error(res.error);
    },
  });

  const lead = res?.success ? res.data : null;
  const script = lead?.niche?.name ? (SCRIPTS[lead.niche.name] || DEFAULT_SCRIPT) : DEFAULT_SCRIPT;
  const referralLink = lead?.referralCode ? `https://bizmuzik.ru/r/${lead.referralCode}` : null;

  const copyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Ссылка скопирована");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full md:max-w-lg max-h-[90vh] bg-[#0d0f1a] border border-white/10 rounded-t-[2rem] md:rounded-[2rem] overflow-y-auto custom-scrollbar">
        {/* Handle bar (mobile) */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              {isLoading ? (
                <Skeleton className="h-6 w-48 bg-white/5" />
              ) : (
                <>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">{lead?.business.name}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                    {lead?.niche?.icon} {lead?.niche?.name} · {lead?.city?.name}
                  </p>
                </>
              )}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 bg-white/5 rounded-xl" />)}</div>
          ) : lead ? (
            <>
              {/* Business Info */}
              <div className="space-y-2">
                {lead.business.address && (
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <MapPin className="w-4 h-4 shrink-0" /> {lead.business.address}
                  </div>
                )}
                {lead.business.phone && (
                  <a href={`https://wa.me/${lead.business.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-neon hover:underline">
                    <Phone className="w-4 h-4 shrink-0" /> {lead.business.phone}
                  </a>
                )}
                {lead.business.website && (
                  <a href={lead.business.website.startsWith("http") ? lead.business.website : `https://${lead.business.website}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-400 hover:underline">
                    <Globe className="w-4 h-4 shrink-0" /> {lead.business.website}
                  </a>
                )}
                {/* Editable contact */}
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-neutral-500 shrink-0" />
                  {editingContact ? (
                    <div className="flex gap-2 flex-1">
                      <input value={contactEdit} onChange={(e) => setContactEdit(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-neon" autoFocus />
                      <Button size="sm" className="bg-neon text-black text-xs h-8 rounded-lg" onClick={() => contactMutation.mutate()}>
                        <Check className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <button onClick={() => { setContactEdit(lead.business.contactName || ""); setEditingContact(true); }}
                      className="text-sm text-neutral-400 hover:text-white">
                      {lead.business.contactName || "Добавить контакт..."}
                    </button>
                  )}
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Статус</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button key={key} onClick={() => statusMutation.mutate(key)}
                      disabled={statusMutation.isPending}
                      className={cn(
                        "px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                        lead.status === key
                          ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-lg`
                          : "bg-white/5 text-neutral-500 border-transparent hover:bg-white/10"
                      )}>
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Referral link (when trial_sent) */}
              {lead.status === "trial_sent" && referralLink && (
                <div className="bg-neon/5 border border-neon/20 rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neon">Реферальная ссылка</p>
                  <div className="flex gap-2">
                    <input value={referralLink} readOnly className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white" />
                    <Button size="sm" onClick={copyLink} className="bg-neon text-black h-9 rounded-lg">
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* Subscription ID (when converted) */}
              {lead.status === "converted" && (
                <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">ID подписки</p>
                  <div className="flex gap-2">
                    <input value={subId || lead.convertedSubscriptionId || ""} onChange={(e) => setSubId(e.target.value)}
                      placeholder="Введите ID..."
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-400" />
                    <Button size="sm" onClick={() => subIdMutation.mutate()} disabled={!subId}
                      className="bg-emerald-400 text-black h-9 rounded-lg">
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Call Script */}
              <button onClick={() => setScriptOpen(!scriptOpen)}
                className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left hover:bg-white/10 transition-colors">
                <span className="text-xs font-black uppercase tracking-widest text-neutral-400">{script.title}</span>
                {scriptOpen ? <ChevronUp className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
              </button>
              {scriptOpen && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-sm text-neutral-300 whitespace-pre-line leading-relaxed">{script.text}</p>
                </div>
              )}

              {/* Schedule Callback */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Напоминание о звонке</p>
                <div className="flex gap-2">
                  <input type="date" value={callbackDate} onChange={(e) => setCallbackDate(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-neon [color-scheme:dark]" />
                  <input type="time" value={callbackTime} onChange={(e) => setCallbackTime(e.target.value)}
                    className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-neon [color-scheme:dark]" />
                  <Button size="sm" onClick={() => callbackMutation.mutate()} disabled={!callbackDate || callbackMutation.isPending}
                    className="bg-neon/10 border border-neon/20 text-neon h-9 rounded-lg hover:bg-neon hover:text-black">
                    <Calendar className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Add Note */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Заметка</p>
                <div className="flex gap-2">
                  <input value={noteText} onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Напишите заметку..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neon"
                    onKeyDown={(e) => { if (e.key === "Enter" && noteText.trim()) noteMutation.mutate(); }} />
                  <Button size="sm" onClick={() => noteMutation.mutate()} disabled={!noteText.trim() || noteMutation.isPending}
                    className="bg-neon/10 border border-neon/20 text-neon h-9 rounded-lg hover:bg-neon hover:text-black">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Activity Log */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  <MessageSquare className="w-3 h-3 inline mr-1" /> История ({lead.activities.length})
                </p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                  {lead.activities.length === 0 ? (
                    <p className="text-neutral-600 text-xs text-center py-4">Пока нет активности</p>
                  ) : (
                    lead.activities.map((a) => (
                      <div key={a.id} className="flex gap-3 text-xs p-3 rounded-lg bg-white/5">
                        <div className="text-neutral-600 font-mono text-[10px] shrink-0 w-12">
                          {new Date(a.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="min-w-0">
                          {a.type === "status_change" && (
                            <p className="text-neutral-300">
                              Статус: <span className="text-neutral-500">{STATUS_CONFIG[a.previousStatus ?? ""]?.label}</span>
                              {" → "}
                              <span className={STATUS_CONFIG[a.newStatus ?? ""]?.color}>{STATUS_CONFIG[a.newStatus ?? ""]?.label}</span>
                            </p>
                          )}
                          {a.type === "note" && <p className="text-neutral-300">📝 {a.note}</p>}
                          {a.type === "callback_scheduled" && (
                            <p className="text-neutral-300">
                              📅 Звонок назначен на {a.callbackAt ? new Date(a.callbackAt).toLocaleString("ru-RU") : "—"}
                            </p>
                          )}
                          {a.type === "trial_sent" && <p className="text-neon">🚀 Отправлен пробный период</p>}
                          {a.type === "converted" && <p className="text-emerald-400">✅ Конвертация в клиента</p>}
                          {(a.type === "call_attempt" || a.type === "call_connected") && (
                            <p className="text-neutral-300">📞 {a.type === "call_connected" ? "Дозвонились" : "Попытка звонка"}</p>
                          )}
                          <p className="text-neutral-600 text-[10px] mt-0.5">
                            {new Date(a.createdAt).toLocaleDateString("ru-RU")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-neutral-400 text-center py-8">Лид не найден</p>
          )}
        </div>
      </div>
    </div>
  );
}
