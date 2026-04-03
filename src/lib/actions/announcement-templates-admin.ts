"use server";

import { and, asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { announcementTemplates, users } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";

export type AnnouncementTemplateRow = typeof announcementTemplates.$inferSelect;

async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { id: true, role: true },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  return dbUser;
}

export interface AdminAnnouncementTemplateInput {
  name: string;
  title: string;
  text: string;
  pack: string;
  packLabel: string;
  provider: "google" | "sberbank";
  isSeasonal: boolean;
  seasonCode?: string | null;
  isPublished: boolean;
  sortOrder: number;
}

function normalizeInput(input: AdminAnnouncementTemplateInput): AdminAnnouncementTemplateInput {
  return {
    ...input,
    name: input.name.trim(),
    title: input.title.trim(),
    text: input.text.trim(),
    pack: input.pack.trim().toLowerCase(),
    packLabel: input.packLabel.trim(),
    seasonCode: input.seasonCode?.trim() || null,
    sortOrder: Number.isFinite(input.sortOrder) ? Math.max(0, Math.floor(input.sortOrder)) : 0,
  };
}

function validateInput(input: AdminAnnouncementTemplateInput) {
  if (!input.name) throw new Error("Введите название шаблона");
  if (!input.title) throw new Error("Введите заголовок для библиотеки");
  if (!input.text) throw new Error("Введите текст шаблона");
  if (input.text.length > 500) throw new Error("Текст шаблона не должен превышать 500 символов");
  if (!input.pack) throw new Error("Укажите код пакета");
  if (!input.packLabel) throw new Error("Укажите название пакета");
  if (input.provider !== "google" && input.provider !== "sberbank") throw new Error("Некорректный провайдер");
}

export async function getAdminAnnouncementTemplatesAction() {
  try {
    await requireAdminUser();

    const rows = await db.query.announcementTemplates.findMany({
      orderBy: [asc(announcementTemplates.sortOrder), desc(announcementTemplates.createdAt)],
    });

    return { success: true, data: rows };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось загрузить шаблоны";
    return { success: false, error: message };
  }
}

export async function createAnnouncementTemplateAction(input: AdminAnnouncementTemplateInput) {
  try {
    const admin = await requireAdminUser();
    const normalized = normalizeInput(input);
    validateInput(normalized);

    const [row] = await db.insert(announcementTemplates).values({
      ...normalized,
      createdByUserId: admin.id,
    }).returning();

    revalidatePath("/admin/content");
    revalidatePath("/dashboard/announcements");

    return { success: true, data: row };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось создать шаблон";
    return { success: false, error: message };
  }
}

export async function updateAnnouncementTemplateAction(id: string, input: AdminAnnouncementTemplateInput) {
  try {
    await requireAdminUser();
    const normalized = normalizeInput(input);
    validateInput(normalized);

    const [row] = await db.update(announcementTemplates)
      .set({
        ...normalized,
        updatedAt: new Date(),
      })
      .where(eq(announcementTemplates.id, id))
      .returning();

    if (!row) {
      return { success: false, error: "Шаблон не найден" };
    }

    revalidatePath("/admin/content");
    revalidatePath("/dashboard/announcements");

    return { success: true, data: row };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось обновить шаблон";
    return { success: false, error: message };
  }
}

export async function deleteAnnouncementTemplateAction(id: string) {
  try {
    await requireAdminUser();

    const [row] = await db.delete(announcementTemplates)
      .where(eq(announcementTemplates.id, id))
      .returning({ id: announcementTemplates.id });

    if (!row) {
      return { success: false, error: "Шаблон не найден" };
    }

    revalidatePath("/admin/content");
    revalidatePath("/dashboard/announcements");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось удалить шаблон";
    return { success: false, error: message };
  }
}

export async function getPublishedAnnouncementTemplatesAction() {
  try {
    const rows = await db.query.announcementTemplates.findMany({
      where: eq(announcementTemplates.isPublished, true),
      orderBy: [asc(announcementTemplates.sortOrder), desc(announcementTemplates.createdAt)],
    });

    return { success: true, data: rows };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось загрузить опубликованные шаблоны";
    return { success: false, error: message };
  }
}
