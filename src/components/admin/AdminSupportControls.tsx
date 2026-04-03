"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  assignSupportConversationAction,
  getAdminSupportAssigneesAction,
  updateSupportConversationStatusAction,
} from "@/lib/actions/support";

type AdminUser = { id: string; email: string };

type Status = "OPEN" | "PENDING" | "CLOSED";

export function AdminSupportControls({
  conversationId,
  initialStatus,
  initialAssignedToUserId,
}: {
  conversationId: string;
  initialStatus: Status;
  initialAssignedToUserId: string | null;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [assignedToUserId, setAssignedToUserId] = useState<string>(initialAssignedToUserId || "");
  const [assignees, setAssignees] = useState<AdminUser[]>([]);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [isSavingAssignee, setIsSavingAssignee] = useState(false);

  useEffect(() => {
    async function loadAssignees() {
      const result = await getAdminSupportAssigneesAction();
      if (!result.success || !result.data) {
        return;
      }
      setAssignees(result.data);
    }

    loadAssignees();
  }, []);

  async function saveStatus(nextStatus: Status) {
    setIsSavingStatus(true);
    const result = await updateSupportConversationStatusAction({
      conversationId,
      status: nextStatus,
    });

    if (!result.success) {
      toast.error(result.error || "Не удалось обновить статус");
      setIsSavingStatus(false);
      return;
    }

    toast.success("Статус обновлен");
    setIsSavingStatus(false);
    window.location.reload();
  }

  async function saveAssignee(nextAssignee: string) {
    setIsSavingAssignee(true);
    const result = await assignSupportConversationAction({
      conversationId,
      assignedToUserId: nextAssignee || null,
    });

    if (!result.success) {
      toast.error(result.error || "Не удалось назначить ответственного");
      setIsSavingAssignee(false);
      return;
    }

    toast.success("Ответственный обновлен");
    setIsSavingAssignee(false);
    window.location.reload();
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-black">Статус обращения</label>
        <select
          value={status}
          disabled={isSavingStatus}
          onChange={(e) => {
            const next = e.target.value as Status;
            setStatus(next);
            void saveStatus(next);
          }}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
        >
          <option value="OPEN" className="bg-black">Новый</option>
          <option value="PENDING" className="bg-black">В работе</option>
          <option value="CLOSED" className="bg-black">Закрыт</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-black">Ответственный админ</label>
        <select
          value={assignedToUserId}
          disabled={isSavingAssignee}
          onChange={(e) => {
            const next = e.target.value;
            setAssignedToUserId(next);
            void saveAssignee(next);
          }}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
        >
          <option value="" className="bg-black">Не назначен</option>
          {assignees.map((assignee) => (
            <option key={assignee.id} value={assignee.id} className="bg-black">
              {assignee.email}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
