import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAdminSupportConversationAction } from "@/lib/actions/support";
import { AdminSupportReplyForm } from "@/components/admin/AdminSupportReplyForm";
import { AdminSupportControls } from "@/components/admin/AdminSupportControls";

export default async function AdminSupportConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const result = await getAdminSupportConversationAction(conversationId);

  if (!result.success || !result.data) {
    return (
      <div className="space-y-4">
        <Link href="/admin/support" className="text-neon text-xs uppercase tracking-[0.2em] font-black inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Назад к списку
        </Link>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-neutral-400">
          {result.error || "Диалог не найден"}
        </div>
      </div>
    );
  }

  const { conversation, messages } = result.data;

  return (
    <div className="space-y-6">
      <Link href="/admin/support" className="text-neon text-xs uppercase tracking-[0.2em] font-black inline-flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        Назад к списку
      </Link>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-2">
        <h1 className="text-2xl font-black uppercase tracking-tight text-white">Диалог поддержки</h1>
        <p className="text-sm text-neutral-400">Категория: {conversation.category} · Статус: {conversation.status}</p>
        <p className="text-xs text-neutral-500">Источник: {conversation.visitorEmail || conversation.userId || "Анонимный пользователь"}</p>
        {conversation.visitorName && (
          <p className="text-xs text-neutral-500">Имя: {conversation.visitorName}</p>
        )}
        {conversation.visitorPhone && (
          <p className="text-xs text-neutral-500">
            Телефон: <a href={`tel:${conversation.visitorPhone.replace(/[^\d+]/g, "")}`} className="text-neon hover:underline underline-offset-4">{conversation.visitorPhone}</a>
          </p>
        )}
        {conversation.visitorEmail && (
          <p className="text-xs text-neutral-500">Email: {conversation.visitorEmail}</p>
        )}
      </div>

      <AdminSupportControls
        conversationId={conversation.id}
        initialStatus={conversation.status}
        initialAssignedToUserId={conversation.assignedToUserId}
      />

      <div className="rounded-3xl border border-white/10 bg-black/40 p-4 space-y-3 max-h-[55vh] overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${message.direction === "USER" ? "bg-white/10 text-white" : "ml-auto bg-neon/20 text-white"}`}
          >
            <p>{message.body}</p>
            <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 mt-2">{new Date(message.createdAt).toLocaleString("ru-RU")}</p>
          </div>
        ))}
      </div>

      <AdminSupportReplyForm conversationId={conversation.id} />
    </div>
  );
}
