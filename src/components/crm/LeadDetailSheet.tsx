"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getLeadDetailAction,
  updateLeadStatusAction,
  scheduleCallbackAction,
  addLeadNoteAction,
  updateLeadContactNameAction,
  setConvertedSubscriptionIdAction,
  markLeadEmailsReadAction,
} from "@/lib/actions/crm-leads";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  X, Phone, Globe, MapPin, Copy, Check, ChevronDown, ChevronUp,
  Send, Calendar, MessageSquare, User, Mail, Loader2, ChevronRight, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getEmailTemplate } from "@/lib/email-templates";
import { getNicheFromBusinessNiche } from "@/lib/email-helpers";

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
  
  // Email states
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [emailCustomNote, setEmailCustomNote] = useState("");
  const [expandedEmailIds, setExpandedEmailIds] = useState<Set<string>>(new Set());

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

  const markReadMutation = useMutation({
    mutationFn: () => markLeadEmailsReadAction(leadId),
    onSuccess: (res) => {
      if (res.success) invalidateAll();
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: (data: { templateId: string; customNote?: string }) => {
      console.log("[CRM] Sending email request:", { leadId, ...data });
      return fetch("/api/email/send", {
        method: "POST",
        body: JSON.stringify({ leadId, ...data }),
      }).then(async r => {
        const json = await r.json();
        console.log("[CRM] Email response:", json);
        return json;
      });
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Письмо отправлено ✓");
        setEmailPreviewOpen(false);
        setEmailCustomNote("");
        invalidateAll();
      } else {
        console.error("[CRM] Email send failed:", res);
        toast.error(res.message || "Ошибка отправки");
      }
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

  const toggleEmailExpand = (id: string) => {
    setExpandedEmailIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [activeSubTab, setActiveSubTab] = useState<"history" | "emails">("emails");

  // Mark as read on open
  useEffect(() => {
    if (lead?.unreadEmailCount && lead.unreadEmailCount > 0) {
      markReadMutation.mutate();
    }
  }, [lead?.id, lead?.unreadEmailCount]);

  return (
    <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center md:pt-20">
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
                {lead.business.email && (
                  <a href={`mailto:${lead.business.email}`}
                    className="flex items-center gap-2 text-sm text-emerald-400 hover:underline">
                    <Mail className="w-4 h-4 shrink-0" /> {lead.business.email}
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
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    const isPending = statusMutation.isPending && statusMutation.variables === key;
                    return (
                      <button key={key} onClick={() => statusMutation.mutate(key)}
                        disabled={statusMutation.isPending}
                        className={cn(
                          "px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2",
                          lead.status === key
                            ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-lg`
                            : "bg-white/5 text-neutral-500 border-transparent hover:bg-white/10",
                          isPending && "opacity-70 cursor-not-allowed"
                        )}>
                        {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                        {cfg.label}
                      </button>
                    );
                  })}
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
                      disabled={subIdMutation.isPending}
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-400 disabled:opacity-50" />
                    <Button size="sm" onClick={() => subIdMutation.mutate()} disabled={!subId || subIdMutation.isPending}
                      className="bg-emerald-400 text-black h-9 rounded-lg">
                      {subIdMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
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
                    disabled={callbackMutation.isPending}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-neon [color-scheme:dark] disabled:opacity-50" />
                  <input type="time" value={callbackTime} onChange={(e) => setCallbackTime(e.target.value)}
                    disabled={callbackMutation.isPending}
                    className="w-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-neon [color-scheme:dark] disabled:opacity-50" />
                  <Button size="sm" onClick={() => callbackMutation.mutate()} disabled={!callbackDate || callbackMutation.isPending}
                    className="bg-neon/10 border border-neon/20 text-neon h-9 rounded-lg hover:bg-neon hover:text-black">
                    {callbackMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Add Note */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Заметка</p>
                <div className="flex gap-2">
                  <input value={noteText} onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Напишите заметку..."
                    disabled={noteMutation.isPending}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neon disabled:opacity-50"
                    onKeyDown={(e) => { if (e.key === "Enter" && noteText.trim() && !noteMutation.isPending) noteMutation.mutate(); }} />
                  <Button size="sm" onClick={() => noteMutation.mutate()} disabled={!noteText.trim() || noteMutation.isPending}
                    className="bg-neon/10 border border-neon/20 text-neon h-9 rounded-lg hover:bg-neon hover:text-black">
                    {noteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Activity & Email Thread */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setActiveSubTab("emails")}
                      className={cn(
                        "text-[10px] font-black uppercase tracking-widest transition-colors",
                        activeSubTab === "emails" ? "text-neon" : "text-neutral-500 hover:text-neutral-300"
                      )}
                    >
                      <Mail className="w-3 h-3 inline mr-1" /> Почта ({lead.activities.filter(a => a.type.startsWith('email')).length})
                    </button>
                    <button 
                      onClick={() => setActiveSubTab("history")}
                      className={cn(
                        "text-[10px] font-black uppercase tracking-widest transition-colors",
                        activeSubTab === "history" ? "text-neon" : "text-neutral-500 hover:text-neutral-300"
                      )}
                    >
                      <MessageSquare className="w-3 h-3 inline mr-1" /> История ({lead.activities.length})
                    </button>
                  </div>
                </div>

                <div className="space-y-3 min-h-[300px] max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                  {lead.activities.length === 0 ? (
                    <p className="text-neutral-600 text-xs text-center py-8">Пока нет активности</p>
                  ) : (
                    lead.activities
                      .filter(a => activeSubTab === "emails" ? a.type.startsWith('email') : true)
                      .map((a) => {
                      if (a.type === "email_sent" || a.type === "email_received") {
                        const isSent = a.type === "email_sent";
                        const isExpanded = expandedEmailIds.has(a.id);
                        return (
                          <div key={a.id} className={cn(
                            "flex flex-col gap-1 p-3 rounded-2xl border transition-all",
                            isSent 
                              ? "ml-8 bg-blue-500/5 border-blue-500/20" 
                              : "mr-8 bg-white/5 border-white/10",
                            !isSent && !a.isRead && "border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.1)]"
                          )}>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                                {isSent ? "📤 Вы отправили" : "📥 Ответ клиента"}
                              </span>
                              <span className="text-[9px] text-neutral-600">
                                {new Date(a.createdAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-white mb-1">{a.emailSubject}</p>
                            <p className={cn(
                              "text-xs text-neutral-400 whitespace-pre-line leading-relaxed",
                              !isExpanded && "line-clamp-2"
                            )}>
                              {a.emailBodyText}
                            </p>
                            <button 
                              onClick={() => toggleEmailExpand(a.id)}
                              className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white mt-1 w-fit"
                            >
                              {isExpanded ? "Свернуть" : "Показать полностью"}
                            </button>
                            <div className="text-[9px] text-neutral-600 mt-2 italic">
                              {isSent ? `на ${a.emailTo}` : `от ${a.emailFrom}`}
                            </div>
                          </div>
                        );
                      }

                      return (
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
                      );
                    })
                  )}
                </div>
              </div>

              {/* Email Template Selector */}
              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                  <Mail className="w-3 h-3 inline mr-1" /> Отправить шаблон
                </p>
                <div className="flex flex-col gap-2">
                  {['email_1', 'email_2', 'email_3'].map((tid) => {
                    const isSent = lead.activities.some(a => a.type === 'email_sent' && (
                      (tid === 'email_1' && a.note?.includes('первый')) ||
                      (tid === 'email_2' && a.note?.includes('follow-up')) ||
                      (tid === 'email_3' && a.note?.includes('финальный'))
                    ));

                    const isDisabled = 
                      (tid === 'email_2' && !lead.activities.some(a => a.note?.includes('первый'))) ||
                      (tid === 'email_3' && !lead.activities.some(a => a.note?.includes('follow-up')));

                    const labels: Record<string, string> = {
                      email_1: "Email 1: Первый контакт",
                      email_2: "Email 2: Follow-up (3 дня)",
                      email_3: "Email 3: Финальный (7 дней)",
                    };
                    
                    const descs: Record<string, string> = {
                      email_1: "Защита от штрафов РАО",
                      email_2: "Про сертификат соответствия",
                      email_3: "Последний вопрос",
                    };

                    return (
                      <button
                        key={tid}
                        disabled={isDisabled}
                        onClick={() => {
                          setSelectedTemplateId(tid);
                          setEmailPreviewOpen(true);
                        }}
                        className={cn(
                          "group flex items-center justify-between p-3 rounded-xl border transition-all text-left",
                          isSent 
                            ? "bg-white/2 border-white/5 opacity-60" 
                            : "bg-white/5 border-white/10 hover:bg-neon hover:border-neon",
                          isDisabled && "opacity-30 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                            isSent ? "bg-white/5" : "bg-white/5 group-hover:bg-black/10"
                          )}>
                            <Zap className={cn(
                              "w-4 h-4", 
                              isSent ? "text-neutral-600" : (tid === 'email_1' ? "text-blue-400" : tid === 'email_2' ? "text-purple-400" : "text-neon"),
                              !isSent && "group-hover:text-black"
                            )} />
                          </div>
                          <div>
                            <div className={cn("text-xs font-bold transition-colors", isSent ? "text-neutral-400" : "text-white group-hover:text-black")}>
                              {isSent ? `✓ ${labels[tid]} отправлен` : labels[tid]}
                            </div>
                            <div className={cn("text-[10px] transition-colors", isSent ? "text-neutral-600" : "text-neutral-500 group-hover:text-black/60")}>
                              {descs[tid]}
                            </div>
                          </div>
                        </div>
                        {!isSent && !isDisabled && <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-black" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Email Preview "Sheet" */}
              {emailPreviewOpen && selectedTemplateId && (
                <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setEmailPreviewOpen(false)} />
                  <div className="relative z-10 w-full max-w-lg bg-[#0d0f1a] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                      <h4 className="text-sm font-black uppercase tracking-tight text-white">Предпросмотр письма</h4>
                      <button onClick={() => setEmailPreviewOpen(false)} className="text-neutral-500 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white/5">
                      {(() => {
                        const t = getEmailTemplate(selectedTemplateId, {
                          clientName: lead.business?.contactName || "Добрый день",
                          businessName: lead.business?.name || "",
                          agentFirstName: lead.agentFullName?.split(' ')[0] || "Менеджер", 
                          referralCode: lead.referralCode || "PROMO",
                          niche: getNicheFromBusinessNiche(lead.niche?.name || ""),
                          customNote: emailCustomNote,
                        });
                        return (
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Тема</p>
                              <p className="text-sm text-white font-bold">{t.subject}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Текст письма</p>
                              <div className="bg-white p-4 rounded-xl text-sm text-black whitespace-pre-line leading-relaxed font-sans">
                                {t.text}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="p-6 border-t border-white/5 space-y-4 bg-[#0d0f1a]">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Добавить личный комментарий (опционально)</p>
                        <textarea 
                          value={emailCustomNote}
                          onChange={(e) => setEmailCustomNote(e.target.value)}
                          placeholder="Например: 'Был рад пообщаться сегодня!'"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neon h-20 resize-none"
                        />
                      </div>
                      <Button 
                        onClick={() => sendEmailMutation.mutate({ 
                          templateId: selectedTemplateId, 
                          customNote: emailCustomNote 
                        })}
                        disabled={sendEmailMutation.isPending}
                        className="w-full bg-neon text-black font-black uppercase tracking-widest py-6 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(92,243,135,0.2)]"
                      >
                        {sendEmailMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          "Отправить сейчас"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-neutral-400 text-center py-8">Лид не найден</p>
          )}
        </div>
      </div>
    </div>
  );
}
