"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TrackUploader } from "@/components/admin/TrackUploader";
import {
  createAnnouncementJingleAction,
  deleteAnnouncementJingleAction,
  getAdminAnnouncementJinglesAction,
  updateAnnouncementJingleAction,
  type AnnouncementJingleInput,
} from "@/lib/actions/announcement-jingles";
import { toast } from "sonner";
import { Music, Save, Trash2 } from "lucide-react";

const EMPTY_FORM: AnnouncementJingleInput = {
  name: "",
  fileUrl: "",
  duration: 0,
  position: "intro",
  volumeDb: -6,
  isPublished: true,
  sortOrder: 0,
};

type JingleRow = Awaited<ReturnType<typeof getAdminAnnouncementJinglesAction>> extends {
  success: true;
  data: infer T;
}
  ? T extends Array<infer U>
    ? U
    : never
  : never;

function toForm(row: JingleRow): AnnouncementJingleInput {
  return {
    name: row.name,
    fileUrl: row.fileUrl,
    duration: row.duration,
    position: row.position === "outro" ? "outro" : "intro",
    volumeDb: row.volumeDb,
    isPublished: row.isPublished,
    sortOrder: row.sortOrder,
  };
}

export function AnnouncementJingleManager() {
  const queryClient = useQueryClient();
  const [createForm, setCreateForm] = useState<AnnouncementJingleInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AnnouncementJingleInput>(EMPTY_FORM);

  const { data } = useQuery({
    queryKey: ["admin-announcement-jingles"],
    queryFn: async () => {
      const result = await getAdminAnnouncementJinglesAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  const jingles = data ?? [];

  const stats = useMemo(() => ({
    total: jingles.length,
    published: jingles.filter((item) => item.isPublished).length,
    intro: jingles.filter((item) => item.position === "intro").length,
    outro: jingles.filter((item) => item.position === "outro").length,
  }), [jingles]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-announcement-jingles"] });
    queryClient.invalidateQueries({ queryKey: ["announcement-jingles"] });
  };

  const createMutation = useMutation({
    mutationFn: () => createAnnouncementJingleAction(createForm),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Джингл создан");
      setCreateForm(EMPTY_FORM);
      invalidate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingId) throw new Error("Jingle ID is missing");
      return updateAnnouncementJingleAction(editingId, editForm);
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Джингл обновлен");
      setEditingId(null);
      setEditForm(EMPTY_FORM);
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAnnouncementJingleAction(id),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Джингл удален");
      invalidate();
    },
  });

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-dark border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Всего джинглов</p>
          <p className="text-4xl font-black text-white">{stats.total}</p>
        </div>
        <div className="glass-dark border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Опубликовано</p>
          <p className="text-4xl font-black text-neon">{stats.published}</p>
        </div>
        <div className="glass-dark border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Intro</p>
          <p className="text-4xl font-black text-blue-300">{stats.intro}</p>
        </div>
        <div className="glass-dark border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Outro</p>
          <p className="text-4xl font-black text-white">{stats.outro}</p>
        </div>
      </div>

      <section className="glass-dark border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <Music className="w-5 h-5 text-neon" />
          <h3 className="text-lg font-black uppercase tracking-widest text-white">Добавить джингл</h3>
        </div>

        <TrackUploader
          uploadType="announcement"
          onUploadComplete={(fileName, publicUrl, duration) => {
            setCreateForm((p) => ({
              ...p,
              name: p.name || fileName.replace(/\.[^.]+$/, ""),
              fileUrl: publicUrl,
              duration: Math.round(duration),
            }));
            toast.success("Файл джингла загружен");
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            placeholder="Название джингла"
            value={createForm.name}
            onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            className="bg-white/5 border-white/10 text-white"
          />
          <Input
            type="number"
            placeholder="Громкость dB"
            value={String(createForm.volumeDb)}
            onChange={(e) => setCreateForm((p) => ({ ...p, volumeDb: Number(e.target.value || -6) }))}
            className="bg-white/5 border-white/10 text-white"
          />
          <Input
            type="number"
            placeholder="Сортировка"
            value={String(createForm.sortOrder)}
            onChange={(e) => setCreateForm((p) => ({ ...p, sortOrder: Number(e.target.value || 0) }))}
            className="bg-white/5 border-white/10 text-white"
          />
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3">
            <button
              type="button"
              onClick={() => setCreateForm((p) => ({ ...p, position: "intro" }))}
              className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest ${
                createForm.position === "intro" ? "bg-neon text-black" : "text-neutral-400"
              }`}
            >
              Intro
            </button>
            <button
              type="button"
              onClick={() => setCreateForm((p) => ({ ...p, position: "outro" }))}
              className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest ${
                createForm.position === "outro" ? "bg-neon text-black" : "text-neutral-400"
              }`}
            >
              Outro
            </button>
            <div className="ml-auto flex items-center gap-2">
              <Switch
                checked={createForm.isPublished}
                onCheckedChange={(value) => setCreateForm((p) => ({ ...p, isPublished: value }))}
              />
              <span className="text-xs text-neutral-400 font-black uppercase tracking-widest">Опубликован</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !createForm.fileUrl}
            className="bg-neon text-black rounded-xl font-black uppercase text-xs tracking-widest"
          >
            Создать джингл
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        {jingles.map((item) => {
          const isEditing = editingId === item.id;
          const form = isEditing ? editForm : toForm(item);

          return (
            <div key={item.id} className="glass-dark border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <p className="text-white font-black uppercase tracking-tight">{item.name}</p>
                  <Badge variant="outline" className="text-[10px] border-white/10 text-neutral-300">{item.position}</Badge>
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
                    <Input type="number" value={String(form.volumeDb)} onChange={(e) => setEditForm((p) => ({ ...p, volumeDb: Number(e.target.value || -6) }))} className="bg-white/5 border-white/10 text-white" />
                    <Input type="number" value={String(form.sortOrder)} onChange={(e) => setEditForm((p) => ({ ...p, sortOrder: Number(e.target.value || 0) }))} className="bg-white/5 border-white/10 text-white" />
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3">
                      <button
                        type="button"
                        onClick={() => setEditForm((p) => ({ ...p, position: "intro" }))}
                        className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest ${
                          form.position === "intro" ? "bg-neon text-black" : "text-neutral-400"
                        }`}
                      >
                        Intro
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditForm((p) => ({ ...p, position: "outro" }))}
                        className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest ${
                          form.position === "outro" ? "bg-neon text-black" : "text-neutral-400"
                        }`}
                      >
                        Outro
                      </button>
                      <div className="ml-auto flex items-center gap-2">
                        <Switch checked={form.isPublished} onCheckedChange={(value) => setEditForm((p) => ({ ...p, isPublished: value }))} />
                        <span className="text-xs text-neutral-400 font-black uppercase tracking-widest">Опубликован</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-neutral-500">Длительность: {form.duration}с · URL: {form.fileUrl}</p>
                </>
              ) : (
                <p className="text-sm text-neutral-400">{item.duration}с · {item.volumeDb} dB · {item.fileUrl}</p>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
