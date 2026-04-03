"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  createAnnouncementTemplateAction,
  deleteAnnouncementTemplateAction,
  getAdminAnnouncementTemplatesAction,
  updateAnnouncementTemplateAction,
  type AdminAnnouncementTemplateInput,
  type AnnouncementTemplateRow,
} from "@/lib/actions/announcement-templates-admin";
import { toast } from "sonner";
import { LayoutTemplate, Plus, Save, Trash2 } from "lucide-react";

const EMPTY_FORM: AdminAnnouncementTemplateInput = {
  name: "",
  title: "",
  text: "",
  pack: "base",
  packLabel: "Базовые",
  provider: "sberbank",
  isSeasonal: false,
  seasonCode: "",
  isPublished: true,
  sortOrder: 0,
};

function toForm(row: AnnouncementTemplateRow): AdminAnnouncementTemplateInput {
  return {
    name: row.name,
    title: row.title,
    text: row.text,
    pack: row.pack,
    packLabel: row.packLabel,
    provider: row.provider === "google" ? "google" : "sberbank",
    isSeasonal: row.isSeasonal,
    seasonCode: row.seasonCode ?? "",
    isPublished: row.isPublished,
    sortOrder: row.sortOrder,
  };
}

export function AnnouncementTemplateManager() {
  const queryClient = useQueryClient();
  const [createForm, setCreateForm] = useState<AdminAnnouncementTemplateInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AdminAnnouncementTemplateInput>(EMPTY_FORM);

  const { data } = useQuery({
    queryKey: ["admin-announcement-templates"],
    queryFn: async () => {
      const result = await getAdminAnnouncementTemplatesAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const templates = data ?? [];

  const stats = useMemo(() => ({
    total: templates.length,
    published: templates.filter((item) => item.isPublished).length,
    seasonal: templates.filter((item) => item.isSeasonal).length,
    packs: new Set(templates.map((item) => item.pack)).size,
  }), [templates]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-announcement-templates"] });
    queryClient.invalidateQueries({ queryKey: ["announcement-templates"] });
  };

  const createMutation = useMutation({
    mutationFn: () => createAnnouncementTemplateAction(createForm),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Шаблон создан");
      setCreateForm(EMPTY_FORM);
      invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingId) throw new Error("Template ID is missing");
      return updateAnnouncementTemplateAction(editingId, editForm);
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Шаблон обновлен");
      setEditingId(null);
      setEditForm(EMPTY_FORM);
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAnnouncementTemplateAction(id),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Шаблон удален");
      invalidate();
    },
  });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-dark border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Всего шаблонов</p>
          <p className="text-4xl font-black text-white">{stats.total}</p>
        </div>
        <div className="glass-dark border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Опубликовано</p>
          <p className="text-4xl font-black text-neon">{stats.published}</p>
        </div>
        <div className="glass-dark border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Сезонные</p>
          <p className="text-4xl font-black text-blue-300">{stats.seasonal}</p>
        </div>
        <div className="glass-dark border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Паков</p>
          <p className="text-4xl font-black text-white">{stats.packs}</p>
        </div>
      </div>

      <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <LayoutTemplate className="w-5 h-5 text-neon" />
          <h3 className="text-lg font-black uppercase tracking-widest text-white">Добавить шаблон</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            placeholder="Название шаблона"
            value={createForm.name}
            onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            className="bg-white/5 border-white/10 text-white"
          />
          <Input
            placeholder="Заголовок в библиотеке"
            value={createForm.title}
            onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
            className="bg-white/5 border-white/10 text-white"
          />
          <Input
            placeholder="Код пака (например retail)"
            value={createForm.pack}
            onChange={(e) => setCreateForm((p) => ({ ...p, pack: e.target.value }))}
            className="bg-white/5 border-white/10 text-white"
          />
          <Input
            placeholder="Название пака (например Ритейл)"
            value={createForm.packLabel}
            onChange={(e) => setCreateForm((p) => ({ ...p, packLabel: e.target.value }))}
            className="bg-white/5 border-white/10 text-white"
          />
          <Input
            placeholder="Сезонный код (например new-year)"
            value={createForm.seasonCode ?? ""}
            onChange={(e) => setCreateForm((p) => ({ ...p, seasonCode: e.target.value }))}
            className="bg-white/5 border-white/10 text-white"
          />
          <Input
            type="number"
            placeholder="Сортировка"
            value={String(createForm.sortOrder)}
            onChange={(e) => setCreateForm((p) => ({ ...p, sortOrder: Number(e.target.value || 0) }))}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        <Textarea
          placeholder="Текст шаблона"
          value={createForm.text}
          onChange={(e) => setCreateForm((p) => ({ ...p, text: e.target.value }))}
          className="min-h-[120px] bg-white/5 border-white/10 text-white"
        />

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-400 font-black uppercase tracking-widest">Google</label>
            <input
              type="radio"
              checked={createForm.provider === "google"}
              onChange={() => setCreateForm((p) => ({ ...p, provider: "google" }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-400 font-black uppercase tracking-widest">SaluteSpeech</label>
            <input
              type="radio"
              checked={createForm.provider === "sberbank"}
              onChange={() => setCreateForm((p) => ({ ...p, provider: "sberbank" }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={createForm.isSeasonal}
              onCheckedChange={(value) => setCreateForm((p) => ({ ...p, isSeasonal: value }))}
            />
            <span className="text-xs text-neutral-400 font-black uppercase tracking-widest">Сезонный</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={createForm.isPublished}
              onCheckedChange={(value) => setCreateForm((p) => ({ ...p, isPublished: value }))}
            />
            <span className="text-xs text-neutral-400 font-black uppercase tracking-widest">Опубликован</span>
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="ml-auto bg-neon text-black rounded-xl font-black uppercase text-xs tracking-widest gap-2"
          >
            <Plus className="w-4 h-4" /> Создать
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        {templates.map((item) => {
          const isEditing = editingId === item.id;
          const form = isEditing ? editForm : toForm(item);

          return (
            <div key={item.id} className="glass-dark border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <p className="text-white font-black uppercase tracking-tight">{item.name}</p>
                  <Badge variant="outline" className="text-[10px] border-white/10 text-neutral-300">{item.packLabel}</Badge>
                  {!item.isPublished && (
                    <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-300">Черновик</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditForm(toForm(item));
                      }}
                      className="border-white/15 text-white text-xs font-black uppercase tracking-widest"
                    >
                      Редактировать
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => updateMutation.mutate()}
                        disabled={updateMutation.isPending}
                        className="bg-neon text-black text-xs font-black uppercase tracking-widest gap-2"
                      >
                        <Save className="w-4 h-4" /> Сохранить
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setEditForm(EMPTY_FORM);
                        }}
                        className="border-white/15 text-white text-xs font-black uppercase tracking-widest"
                      >
                        Отмена
                      </Button>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(item.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {isEditing ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input value={form.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                    <Input value={form.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                    <Input value={form.pack} onChange={(e) => setEditForm((p) => ({ ...p, pack: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                    <Input value={form.packLabel} onChange={(e) => setEditForm((p) => ({ ...p, packLabel: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                    <Input value={form.seasonCode ?? ""} onChange={(e) => setEditForm((p) => ({ ...p, seasonCode: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                    <Input type="number" value={String(form.sortOrder)} onChange={(e) => setEditForm((p) => ({ ...p, sortOrder: Number(e.target.value || 0) }))} className="bg-white/5 border-white/10 text-white" />
                  </div>
                  <Textarea value={form.text} onChange={(e) => setEditForm((p) => ({ ...p, text: e.target.value }))} className="min-h-[110px] bg-white/5 border-white/10 text-white" />
                  <div className="flex items-center gap-4">
                    <label className="text-xs text-neutral-400 font-black uppercase tracking-widest flex items-center gap-2">
                      <input
                        type="radio"
                        checked={form.provider === "google"}
                        onChange={() => setEditForm((p) => ({ ...p, provider: "google" }))}
                      />
                      Google
                    </label>
                    <label className="text-xs text-neutral-400 font-black uppercase tracking-widest flex items-center gap-2">
                      <input
                        type="radio"
                        checked={form.provider === "sberbank"}
                        onChange={() => setEditForm((p) => ({ ...p, provider: "sberbank" }))}
                      />
                      SaluteSpeech
                    </label>
                    <label className="text-xs text-neutral-400 font-black uppercase tracking-widest flex items-center gap-2">
                      <Switch checked={form.isSeasonal} onCheckedChange={(value) => setEditForm((p) => ({ ...p, isSeasonal: value }))} /> Сезонный
                    </label>
                    <label className="text-xs text-neutral-400 font-black uppercase tracking-widest flex items-center gap-2">
                      <Switch checked={form.isPublished} onCheckedChange={(value) => setEditForm((p) => ({ ...p, isPublished: value }))} /> Опубликован
                    </label>
                  </div>
                </>
              ) : (
                <p className="text-sm text-neutral-400">{item.text}</p>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
