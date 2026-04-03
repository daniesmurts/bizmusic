"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import {
  createDashboardSupportMessageAction,
  getMySupportConversationAction,
} from "@/lib/actions/support";

type Message = {
  id: string;
  direction: "USER" | "SUPPORT" | "SYSTEM";
  body: string;
  createdAt: string | Date;
};

export default function DashboardSupportPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [category, setCategory] = useState<"GENERAL" | "TECHNICAL" | "BILLING" | "LEGAL">("GENERAL");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    async function loadConversation() {
      const result = await getMySupportConversationAction();
      if (!result.success || !result.data) {
        toast.error(result.error || "Не удалось загрузить диалог");
        setIsLoading(false);
        return;
      }

      setMessages(result.data.messages);
      setIsLoading(false);
    }

    loadConversation();
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) {
      return;
    }

    setIsSending(true);
    const value = message.trim();

    const result = await createDashboardSupportMessageAction({
      message: value,
      category,
    });

    if (!result.success) {
      toast.error(result.error || "Ошибка отправки");
      setIsSending(false);
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        direction: "USER",
        body: value,
        createdAt: new Date(),
      },
    ]);
    setMessage("");
    setIsSending(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-black">Личный кабинет</p>
        <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-tight">Чат <span className="text-neon">Поддержки</span></h1>
        <p className="text-neutral-400">Вся переписка с поддержкой доступна в этом разделе.</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/40 p-4 space-y-3 max-h-[55vh] overflow-y-auto">
        {isLoading && <p className="text-sm text-neutral-500">Загрузка...</p>}
        {!isLoading && messages.length === 0 && (
          <p className="text-sm text-neutral-500">Пока нет сообщений. Напишите в поддержку, и мы подключимся.</p>
        )}

        {messages.map((item) => (
          <div
            key={item.id}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${item.direction === "USER" ? "ml-auto bg-neon/20 text-white" : "bg-white/10 text-white"}`}
          >
            <p>{item.body}</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 mt-2">{new Date(item.createdAt).toLocaleString("ru-RU")}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 space-y-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as "GENERAL" | "TECHNICAL" | "BILLING" | "LEGAL")}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
        >
          <option value="GENERAL" className="bg-black">Общий</option>
          <option value="TECHNICAL" className="bg-black">Технический</option>
          <option value="BILLING" className="bg-black">Биллинг</option>
          <option value="LEGAL" className="bg-black">Юридический</option>
        </select>
        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Опишите ваш вопрос"
            className="w-full min-h-[110px] rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-neon/40"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={isSending}
            className="h-11 w-11 rounded-xl bg-neon text-black disabled:opacity-50"
          >
            <Send className="w-4 h-4 mx-auto" />
          </button>
        </div>
      </div>
    </div>
  );
}
