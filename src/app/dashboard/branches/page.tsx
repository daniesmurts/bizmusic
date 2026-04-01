"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Plus,
  Mail,
  Trash2,
  Pencil,
  X,
  Check,
  UserMinus,
  MapPin,
  Users,
  Send,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getLocationsWithManagersAction,
  createLocationAction,
  updateLocationAction,
  deleteLocationAction,
  inviteBranchManagerAction,
  deactivateManagerAction,
} from "@/lib/actions/branches";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Manager = {
  id: string;
  email: string;
  role: "ADMIN" | "BUSINESS_OWNER" | "STAFF";
  createdAt: Date | string;
};

type Location = {
  id: string;
  name: string;
  address: string;
  createdAt: Date | string;
  assignedUsers: Manager[];
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default function BranchesPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create-location form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit-location state (keyed by locationId)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Invite manager state (keyed by locationId)
  const [invitingFor, setInvitingFor] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSending, setInviteSending] = useState(false);

  // Delete confirming state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  const loadLocations = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getLocationsWithManagersAction();
    if (result.success) {
      setLocations(result.data ?? []);
    } else {
      setError(result.error ?? "Ошибка загрузки");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  // ---------------------------------------------------------------------------
  const handleCreate = async () => {
    setCreating(true);
    const result = await createLocationAction(createName, createAddress);
    setCreating(false);
    if (result.success) {
      toast.success("Филиал создан");
      setCreateName("");
      setCreateAddress("");
      setShowCreateForm(false);
      loadLocations();
    } else {
      toast.error(result.error);
    }
  };

  const handleEditSave = async (locationId: string) => {
    setEditSaving(true);
    const result = await updateLocationAction(locationId, editName, editAddress);
    setEditSaving(false);
    if (result.success) {
      toast.success("Филиал обновлён");
      setEditingId(null);
      loadLocations();
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async (locationId: string) => {
    if (deletingId !== locationId) {
      setDeletingId(locationId);
      return;
    }
    const result = await deleteLocationAction(locationId);
    setDeletingId(null);
    if (result.success) {
      toast.success("Филиал удалён");
      loadLocations();
    } else {
      toast.error(result.error);
    }
  };

  const handleInvite = async (locationId: string) => {
    setInviteSending(true);
    const result = await inviteBranchManagerAction(locationId, inviteEmail);
    setInviteSending(false);
    if (result.success) {
      toast.success(result.message ?? "Приглашение отправлено");
      setInvitingFor(null);
      setInviteEmail("");
      loadLocations();
    } else {
      toast.error(result.error);
    }
  };

  const handleDeactivate = async (managerId: string) => {
    if (deactivatingId !== managerId) {
      setDeactivatingId(managerId);
      return;
    }
    const result = await deactivateManagerAction(managerId);
    setDeactivatingId(null);
    if (result.success) {
      toast.success("Доступ менеджера отозван");
      loadLocations();
    } else {
      toast.error(result.error);
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const startEdit = (loc: Location) => {
    setEditingId(loc.id);
    setEditName(loc.name);
    setEditAddress(loc.address);
    setDeletingId(null);
    setInvitingFor(null);
  };

  const cancelEdit = () => setEditingId(null);

  const openInvite = (locationId: string) => {
    setInvitingFor(locationId);
    setInviteEmail("");
    setEditingId(null);
    setDeletingId(null);
  };

  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-white">
            Филиалы
          </h1>
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mt-1">
            Управление локациями и менеджерами
          </p>
        </div>
        <Button
          onClick={() => {
            setShowCreateForm(true);
            setEditingId(null);
            setInvitingFor(null);
          }}
          className="bg-neon text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-neon/90 gap-2"
        >
          <Plus className="w-4 h-4" />
          Добавить филиал
        </Button>
      </div>

      {/* Info badge */}
      <div className="flex items-start gap-3 glass-dark border border-neon/20 rounded-2xl p-4">
        <CheckCircle className="w-4 h-4 text-neon mt-0.5 shrink-0" />
        <p className="text-neutral-400 text-xs leading-relaxed">
          Каждому филиалу можно назначить одного менеджера — он получит доступ
          только к плееру и анонсам своей локации. Все воспроизведения
          фиксируются с указанием филиала для юридической отчётности.
        </p>
      </div>

      {/* Inline create form */}
      {showCreateForm && (
        <div className="glass-dark border border-neon/30 rounded-[2rem] p-6 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-neon">
            Новый филиал
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-neutral-400 text-xs font-black uppercase tracking-widest">
                Название
              </Label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Кафе на Арбате"
                className="bg-white/5 border-white/10 text-white placeholder:text-neutral-600 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-neutral-400 text-xs font-black uppercase tracking-widest">
                Адрес
              </Label>
              <Input
                value={createAddress}
                onChange={(e) => setCreateAddress(e.target.value)}
                placeholder="г. Москва, ул. Арбат, д. 1"
                className="bg-white/5 border-white/10 text-white placeholder:text-neutral-600 rounded-xl"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleCreate}
              disabled={creating || !createName.trim() || !createAddress.trim()}
              className="bg-neon text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-neon/90 gap-2"
            >
              {creating ? (
                "Создание..."
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Создать
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowCreateForm(false)}
              className="text-neutral-500 hover:text-white font-black uppercase tracking-widest text-xs rounded-xl gap-2"
            >
              <X className="w-4 h-4" />
              Отмена
            </Button>
          </div>
        </div>
      )}

      {/* Loading / Error */}
      {loading && (
        <div className="text-neutral-500 text-xs font-bold uppercase tracking-widest animate-pulse py-8 text-center">
          Загрузка...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 glass-dark border border-red-500/30 rounded-2xl p-4">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && locations.length === 0 && (
        <div className="glass-dark border border-white/10 rounded-[2.5rem] p-16 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-neutral-600" />
          </div>
          <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest">
            Нет филиалов
          </p>
          <p className="text-neutral-600 text-xs max-w-xs">
            Добавьте первый филиал, чтобы начать отслеживать воспроизведение
            по локациям.
          </p>
        </div>
      )}

      {/* Location cards */}
      {!loading && locations.length > 0 && (
        <div className="space-y-4">
          {locations.map((loc) => {
            const isEditing = editingId === loc.id;
            const isInviting = invitingFor === loc.id;
            const confirmDelete = deletingId === loc.id;
            const manager = loc.assignedUsers[0] ?? null;

            return (
              <div
                key={loc.id}
                className="glass-dark border border-white/10 rounded-[2rem] p-6 space-y-4 transition-all"
              >
                {/* Location header */}
                {isEditing ? (
                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-neon">
                      Редактирование
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-neutral-400 text-xs font-black uppercase tracking-widest">
                          Название
                        </Label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-white/5 border-white/10 text-white rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-neutral-400 text-xs font-black uppercase tracking-widest">
                          Адрес
                        </Label>
                        <Input
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          className="bg-white/5 border-white/10 text-white rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleEditSave(loc.id)}
                        disabled={
                          editSaving || !editName.trim() || !editAddress.trim()
                        }
                        className="bg-neon text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-neon/90 gap-2"
                      >
                        {editSaving ? (
                          "Сохранение..."
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Сохранить
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={cancelEdit}
                        className="text-neutral-500 hover:text-white font-black uppercase tracking-widest text-xs rounded-xl gap-2"
                      >
                        <X className="w-4 h-4" />
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-neon" />
                      </div>
                      <div>
                        <p className="text-white font-black tracking-widest text-sm uppercase">
                          {loc.name}
                        </p>
                        <p className="text-neutral-500 text-xs flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {loc.address}
                        </p>
                      </div>
                    </div>

                    {/* Location actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(loc)}
                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                        title="Редактировать"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(loc.id)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          confirmDelete
                            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            : "bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-red-400"
                        }`}
                        title={confirmDelete ? "Нажмите ещё раз для удаления" : "Удалить"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {confirmDelete && (
                        <button
                          onClick={() => setDeletingId(null)}
                          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                          title="Отмена"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Confirm delete notice */}
                {confirmDelete && (
                  <div className="flex items-center gap-2 text-xs text-red-400 font-bold uppercase tracking-widest">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Нажмите иконку ещё раз для подтверждения удаления
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-white/5" />

                {/* Manager section */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    Менеджер филиала
                  </p>

                  {manager ? (
                    <div className="flex items-center justify-between gap-4 bg-white/5 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-neon/10 flex items-center justify-center">
                          <Mail className="w-3.5 h-3.5 text-neon" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-bold">
                            {manager.email}
                          </p>
                          <p className="text-neutral-600 text-[10px] uppercase tracking-widest font-bold">
                            Активный менеджер
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeactivate(manager.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-colors ${
                          deactivatingId === manager.id
                            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            : "bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-red-400"
                        }`}
                        title="Отозвать доступ"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        {deactivatingId === manager.id
                          ? "Подтвердить?"
                          : "Отозвать"}
                      </button>
                    </div>
                  ) : isInviting ? (
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <Input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="manager@example.com"
                          className="bg-white/5 border-white/10 text-white placeholder:text-neutral-600 rounded-xl flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleInvite(loc.id);
                            if (e.key === "Escape") {
                              setInvitingFor(null);
                              setInviteEmail("");
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          onClick={() => handleInvite(loc.id)}
                          disabled={inviteSending || !inviteEmail.includes("@")}
                          className="bg-neon text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-neon/90 gap-2 shrink-0"
                        >
                          {inviteSending ? (
                            "Отправка..."
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              Отправить
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setInvitingFor(null);
                            setInviteEmail("");
                          }}
                          className="text-neutral-500 hover:text-white rounded-xl shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
                        Менеджер получит письмо с ссылкой для входа
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => openInvite(loc.id)}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-dashed border-white/10 hover:border-neon/30 hover:bg-neon/5 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-neon/10 flex items-center justify-center transition-colors">
                        <Plus className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neon transition-colors" />
                      </div>
                      <span className="text-neutral-500 group-hover:text-neon text-xs font-black uppercase tracking-widest transition-colors">
                        Пригласить менеджера
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
