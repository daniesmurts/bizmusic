"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { createAdminSupportReplyAction } from "@/lib/actions/support";

export function AdminSupportReplyForm({ conversationId }: { conversationId: string }) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      return;
    }

    setIsSending(true);
    const result = await createAdminSupportReplyAction({
      conversationId,
      message: message.trim(),
    });

    if (!result.success) {
      toast.error(result.error || "Не удалось отправить ответ");
      setIsSending(false);
      return;
    }

    toast.success("Ответ отправлен");
    setMessage("");
    window.location.reload();
    setIsSending(false);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 space-y-3">
      <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-black">Ответ клиенту</label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Введите ответ"
        className="w-full min-h-[110px] rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-neon/40"
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={isSending}
        className="h-11 px-5 rounded-xl bg-neon text-black text-xs font-black uppercase tracking-[0.2em] inline-flex items-center gap-2 disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        Отправить
      </button>
    </div>
  );
}
