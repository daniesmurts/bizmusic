"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  createDashboardSupportMessageAction,
  createPublicSupportMessageAction,
  getMySupportConversationAction,
} from "@/lib/actions/support";

type Category = "GENERAL" | "TECHNICAL" | "BILLING" | "LEGAL";

type ChatMessage = {
  id: string;
  direction: "USER" | "SUPPORT" | "SYSTEM";
  body: string;
  createdAt: Date;
};

const categoryOptions: Array<{ value: Category; label: string }> = [
  { value: "GENERAL", label: "Общий" },
  { value: "TECHNICAL", label: "Технический" },
  { value: "BILLING", label: "Биллинг" },
  { value: "LEGAL", label: "Юридический" },
];

const STORAGE_KEY = "support_public_session_key";

function formatMessageTime(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatRussianPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) {
    return "";
  }

  let normalizedDigits = digits;
  if (!normalizedDigits.startsWith("7") && !normalizedDigits.startsWith("8")) {
    normalizedDigits = `7${normalizedDigits}`;
  }
  if (normalizedDigits.startsWith("8")) {
    normalizedDigits = `7${normalizedDigits.slice(1)}`;
  }

  const areaCode = normalizedDigits.slice(1, 4);
  const firstPart = normalizedDigits.slice(4, 7);
  const secondPart = normalizedDigits.slice(7, 9);
  const thirdPart = normalizedDigits.slice(9, 11);

  let formatted = "+7";
  if (areaCode) {
    formatted += ` (${areaCode}`;
    if (areaCode.length === 3) {
      formatted += ")";
    }
  }
  if (firstPart) {
    formatted += ` ${firstPart}`;
  }
  if (secondPart) {
    formatted += `-${secondPart}`;
  }
  if (thirdPart) {
    formatted += `-${thirdPart}`;
  }

  return formatted;
}

function getOrCreateSessionKey(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const key = crypto.randomUUID();
  window.localStorage.setItem(STORAGE_KEY, key);
  return key;
}

export function SupportChatWidget() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAnonymous = !user;

  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<Category>("GENERAL");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionKey, setSessionKey] = useState("");
  const historyEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSessionKey(getOrCreateSessionKey());
  }, []);

  useEffect(() => {
    if (user?.email) {
      setEmail((current) => current || user.email || "");
    }
  }, [user]);

  const shouldHide = useMemo(() => {
    if (!pathname) {
      return false;
    }
    return pathname.startsWith("/admin") || pathname === "/login" || pathname === "/register" || pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password");
  }, [pathname]);

  useEffect(() => {
    async function loadHistory() {
      if (!isOpen || !user) {
        return;
      }

      setIsLoadingHistory(true);
      const response = await getMySupportConversationAction();
      if (response.success && response.data) {
        setMessages(
          response.data.messages.map((item) => ({
            id: item.id,
            direction: item.direction,
            body: item.body,
            createdAt: new Date(item.createdAt),
          })),
        );
      }
      setIsLoadingHistory(false);
    }

    loadHistory();
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    historyEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [isOpen, isLoadingHistory, messages]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (shouldHide) {
    return null;
  }

  async function submitMessage() {
    if (!message.trim()) {
      return;
    }

    setIsSending(true);
    const body = message.trim();

    try {
      if (user) {
        const result = await createDashboardSupportMessageAction({
          message: body,
          category,
        });

        if (!result.success) {
          toast.error(result.error || "Не удалось отправить сообщение");
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            direction: "USER",
            body,
            createdAt: new Date(),
          },
        ]);
      } else {
        const result = await createPublicSupportMessageAction({
          message: body,
          category,
          sessionKey,
          visitorName: name || undefined,
          visitorEmail: email || undefined,
          visitorPhone: phone,
        });

        if (!result.success) {
          toast.error(result.error || "Не удалось отправить сообщение");
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            direction: "USER",
            body,
            createdAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            direction: "SYSTEM",
            body: "Спасибо! Мы получили ваше сообщение и скоро ответим.",
            createdAt: new Date(),
          },
        ]);
      }

      setMessage("");
      toast.success("Сообщение отправлено");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex w-screen flex-col overflow-hidden rounded-none border-0 bg-[radial-gradient(circle_at_top_left,rgba(92,243,135,0.14),transparent_34%),linear-gradient(180deg,rgba(10,10,10,0.98),rgba(4,4,4,0.96))] shadow-[0_24px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:inset-x-auto sm:bottom-20 sm:right-4 sm:top-auto sm:z-[75] sm:h-auto sm:w-[420px] sm:max-h-[min(82vh,760px)] sm:rounded-[2rem] sm:border sm:border-white/10">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_28%,transparent_72%,rgba(92,243,135,0.06))]" />

          <div className="relative border-b border-white/10 px-5 pb-4 pt-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-neon/20 bg-neon/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-neon/90">
                  <span className="h-2 w-2 rounded-full bg-neon shadow-[0_0_12px_rgba(92,243,135,0.75)]" />
                  На связи
                </div>
                <div>
                  <p className="text-2xl font-black uppercase tracking-[0.08em] text-white">Поддержка</p>
                  <p className="mt-1 max-w-[260px] text-xs leading-relaxed text-neutral-400">
                    Отвечаем в Telegram и сохраняем переписку в личном кабинете.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-400 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-5 pb-5 pt-3 sm:pt-4">
            {!user && (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/85">Контакты</p>
                    <p className="mt-1 text-[11px] text-neutral-500">Оставьте номер, чтобы менеджер мог быстро связаться с вами.</p>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-neutral-400">
                    Телефон обязателен
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ваше имя"
                    className="h-12 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition focus:border-neon/50 focus:bg-black/40"
                  />
                  <input
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatRussianPhoneInput(e.target.value))}
                    placeholder="+7 (___) ___-__-__"
                    maxLength={18}
                    className="h-12 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition focus:border-neon/50 focus:bg-black/40"
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email для ответа"
                    className="h-12 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm text-white outline-none transition focus:border-neon/50 focus:bg-black/40"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/85">Категория обращения</p>
                <p className="mt-1 text-[11px] text-neutral-500">Выберите тему, чтобы сообщение быстрее попало к нужному специалисту.</p>
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="h-11 w-full min-w-0 rounded-2xl border border-white/10 bg-black/40 px-4 text-sm text-white outline-none transition focus:border-neon/50 sm:w-auto"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-black text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex min-h-0 shrink-0 flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/85">Диалог</p>
                  <p className="mt-1 text-[11px] text-neutral-500">Здесь будет вся история общения с поддержкой.</p>
                </div>
                <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-semibold text-neutral-400">
                  {user ? "Личный кабинет" : "Новый запрос"}
                </span>
              </div>

              <div className={`space-y-3 overflow-y-auto rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] p-3.5 ${isAnonymous ? "min-h-[150px] max-h-[22dvh] sm:min-h-[220px] sm:max-h-[30vh]" : "min-h-[180px] max-h-[28dvh] sm:min-h-[220px] sm:max-h-[38vh]"}`}>
                {isLoadingHistory && user && (
                  <p className="text-sm text-neutral-500">Загрузка истории...</p>
                )}

                {!isLoadingHistory && messages.length === 0 && (
                  <div className="rounded-[1.3rem] border border-dashed border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-neutral-500">
                    Напишите первое сообщение ниже. После отправки здесь появится история диалога с поддержкой.
                  </div>
                )}

                {messages.map((item) => {
                  const isUserMessage = item.direction === "USER";

                  return (
                    <div
                      key={item.id}
                      className={`max-w-[88%] rounded-[1.25rem] border px-3.5 py-3 text-sm leading-relaxed shadow-[0_10px_24px_rgba(0,0,0,0.18)] ${
                        isUserMessage
                          ? "ml-auto border-neon/20 bg-neon/12 text-white"
                          : "border-white/10 bg-white/8 text-neutral-100"
                      }`}
                    >
                      <p>{item.body}</p>
                      <p className={`mt-2 text-[10px] font-medium ${isUserMessage ? "text-neon/75" : "text-neutral-500"}`}>
                        {formatMessageTime(item.createdAt)}
                      </p>
                    </div>
                  );
                })}
                <div ref={historyEndRef} />
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-3 shrink-0">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/85">Ваше сообщение</p>
                  <p className="mt-1 text-[11px] text-neutral-500">Опишите вопрос коротко и по делу. Мы увидим его сразу в Telegram.</p>
                </div>
              </div>

              <div className="flex items-end gap-2 rounded-[1.35rem] border border-white/10 bg-black/30 p-2">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Напишите сообщение..."
                  className="min-h-[72px] w-full resize-none bg-transparent px-3 py-2 text-sm leading-relaxed text-white outline-none placeholder:text-neutral-500 sm:min-h-[88px]"
                />
                <button
                  type="button"
                  disabled={isSending}
                  onClick={submitMessage}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neon text-black shadow-[0_12px_24px_rgba(92,243,135,0.28)] transition hover:scale-[1.03] disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="sticky bottom-0 z-10 -mx-5 mt-1 border-t border-white/10 bg-black/80 px-5 py-3 backdrop-blur sm:hidden">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-11 w-full rounded-2xl border border-white/15 bg-white/5 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:border-white/30"
              >
                Закрыть чат
              </button>
            </div>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-36 right-6 lg:bottom-6 lg:right-6 z-[75] flex h-14 w-14 lg:w-auto items-center justify-center lg:justify-start gap-2 rounded-full border border-neon/30 bg-neon lg:px-5 text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_14px_36px_rgba(92,243,135,0.4)] transition hover:scale-[1.02]"
        >
          <MessageCircle className="w-6 h-6 lg:w-4 lg:h-4" />
          <span className="hidden lg:inline">Поддержка</span>
        </button>
      )}
    </>
  );
}
