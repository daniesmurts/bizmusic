import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { getAdminSupportAssigneesAction, getAdminSupportInboxAction } from "@/lib/actions/support";

function statusLabel(status: "OPEN" | "PENDING" | "CLOSED") {
  if (status === "OPEN") return "Новый";
  if (status === "PENDING") return "В работе";
  return "Закрыт";
}

function statusClass(status: "OPEN" | "PENDING" | "CLOSED") {
  if (status === "OPEN") return "bg-red-500/20 text-red-300 border-red-500/20";
  if (status === "PENDING") return "bg-amber-500/20 text-amber-300 border-amber-500/20";
  return "bg-emerald-500/20 text-emerald-300 border-emerald-500/20";
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    category?: string;
    assignedToUserId?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const status = params.status === "OPEN" || params.status === "PENDING" || params.status === "CLOSED"
    ? params.status
    : undefined;
  const category = params.category === "GENERAL" || params.category === "TECHNICAL" || params.category === "BILLING" || params.category === "LEGAL"
    ? params.category
    : undefined;
  const assignedToUserId = params.assignedToUserId || undefined;
  const q = params.q?.trim() || undefined;
  const page = params.page ? Number(params.page) : 1;

  const [result, assigneesResult] = await Promise.all([
    getAdminSupportInboxAction({ status, category, assignedToUserId, q, page }),
    getAdminSupportAssigneesAction(),
  ]);

  const assignees = assigneesResult.success && assigneesResult.data ? assigneesResult.data : [];
  const conversations = result.success && result.data ? result.data.items : [];
  const pages = result.success && result.data ? result.data.pages : 1;
  const currentPage = result.success && result.data ? result.data.page : 1;
  const counters = result.success && result.data
    ? result.data.counters
    : { open: 0, pending: 0, closed: 0 };

  const buildPageHref = (nextPage: number) => {
    const next = new URLSearchParams();
    if (status) next.set("status", status);
    if (category) next.set("category", category);
    if (assignedToUserId) next.set("assignedToUserId", assignedToUserId);
    if (q) next.set("q", q);
    next.set("page", String(nextPage));
    return `/admin/support?${next.toString()}`;
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Омниканальная поддержка</p>
        <h1 className="text-4xl lg:text-6xl font-black uppercase tracking-tight">Центр <span className="text-neon">Поддержки</span></h1>
        <p className="text-neutral-400 max-w-2xl">Здесь отображаются обращения с публичных страниц и из личного кабинета, включая доставку в Telegram и Bitrix24.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-red-300 font-black">Новые</p>
          <p className="text-2xl font-black text-white">{counters.open}</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-300 font-black">В работе</p>
          <p className="text-2xl font-black text-white">{counters.pending}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-300 font-black">Закрытые</p>
          <p className="text-2xl font-black text-white">{counters.closed}</p>
        </div>
      </div>

      <form className="rounded-3xl border border-white/10 bg-white/5 p-4 grid grid-cols-1 lg:grid-cols-4 gap-3" method="GET">
        <input
          name="q"
          defaultValue={q || ""}
          placeholder="Поиск: email, id, тема"
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
        />
        <select name="status" defaultValue={status || ""} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white">
          <option value="" className="bg-black">Все статусы</option>
          <option value="OPEN" className="bg-black">Новый</option>
          <option value="PENDING" className="bg-black">В работе</option>
          <option value="CLOSED" className="bg-black">Закрыт</option>
        </select>

        <select name="category" defaultValue={category || ""} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white">
          <option value="" className="bg-black">Все категории</option>
          <option value="GENERAL" className="bg-black">Общий</option>
          <option value="TECHNICAL" className="bg-black">Технический</option>
          <option value="BILLING" className="bg-black">Биллинг</option>
          <option value="LEGAL" className="bg-black">Юридический</option>
        </select>

        <select name="assignedToUserId" defaultValue={assignedToUserId || ""} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white">
          <option value="" className="bg-black">Все ответственные</option>
          {assignees.map((assignee) => (
            <option key={assignee.id} value={assignee.id} className="bg-black">
              {assignee.email}
            </option>
          ))}
        </select>

        <button type="submit" className="h-10 rounded-xl bg-neon text-black text-xs font-black uppercase tracking-[0.2em]">
          Применить фильтры
        </button>
      </form>

      <div className="rounded-3xl border border-white/10 bg-black/40 overflow-hidden">
        <div className="grid grid-cols-[1.6fr,0.8fr,0.8fr,0.8fr] px-5 py-3 border-b border-white/10 text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-black">
          <div>Диалог</div>
          <div>Категория</div>
          <div>Статус</div>
          <div>Последнее сообщение</div>
        </div>

        {conversations.length === 0 && (
          <div className="p-8 text-sm text-neutral-500">Пока нет обращений.</div>
        )}

        {conversations.map((conversation) => (
          <Link
            key={conversation.id}
            href={`/admin/support/${conversation.id}`}
            className="grid grid-cols-[1.6fr,0.8fr,0.8fr,0.8fr] px-5 py-4 border-b border-white/5 hover:bg-white/5 transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-neon" />
                <p className="text-sm font-bold text-white">{conversation.subject || `Диалог ${conversation.id.slice(0, 8)}`}</p>
              </div>
              <p className="text-xs text-neutral-500">{conversation.visitorEmail || conversation.userId || "Анонимный пользователь"}</p>
            </div>
            <div className="text-xs text-neutral-200 font-semibold self-center">{conversation.category}</div>
            <div className="self-center">
              <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.15em] ${statusClass(conversation.status)}`}>
                {statusLabel(conversation.status)}
              </span>
            </div>
            <div className="text-xs text-neutral-400 self-center">{new Date(conversation.lastMessageAt).toLocaleString("ru-RU")}</div>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">Страница {currentPage} из {pages}</p>
        <div className="flex items-center gap-2">
          {currentPage > 1 ? (
            <Link href={buildPageHref(currentPage - 1)} className="h-9 px-4 rounded-xl border border-white/10 text-white text-xs font-black uppercase tracking-[0.15em] inline-flex items-center">
              Назад
            </Link>
          ) : (
            <span className="h-9 px-4 rounded-xl border border-white/10 text-neutral-600 text-xs font-black uppercase tracking-[0.15em] inline-flex items-center">Назад</span>
          )}
          {currentPage < pages ? (
            <Link href={buildPageHref(currentPage + 1)} className="h-9 px-4 rounded-xl bg-neon text-black text-xs font-black uppercase tracking-[0.15em] inline-flex items-center">
              Далее
            </Link>
          ) : (
            <span className="h-9 px-4 rounded-xl border border-white/10 text-neutral-600 text-xs font-black uppercase tracking-[0.15em] inline-flex items-center">Далее</span>
          )}
        </div>
      </div>
    </div>
  );
}
