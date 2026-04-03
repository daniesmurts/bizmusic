"use server";

import { asc, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { announcementJingles, users } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { MAX_JINGLE_DURATION_SEC } from "@/lib/audio-jingle-mixer";

export type AnnouncementJingleRow = typeof announcementJingles.$inferSelect;

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

async function requireAnyAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export interface AnnouncementJingleInput {
  name: string;
  fileUrl: string;
  duration: number;
  position: "intro" | "outro";
  volumeDb: number;
  isPublished: boolean;
  sortOrder: number;
}

function normalizeInput(input: AnnouncementJingleInput): AnnouncementJingleInput {
  return {
    ...input,
    name: input.name.trim(),
    fileUrl: input.fileUrl.trim(),
    duration: Number.isFinite(input.duration) ? Math.max(0, Math.round(input.duration)) : 0,
    volumeDb: Number.isFinite(input.volumeDb) ? Math.max(-24, Math.min(12, Math.round(input.volumeDb))) : -6,
    sortOrder: Number.isFinite(input.sortOrder) ? Math.max(0, Math.floor(input.sortOrder)) : 0,
  };
}

function validateInput(input: AnnouncementJingleInput) {
  if (!input.name) throw new Error("Введите название джингла");
  if (!input.fileUrl) throw new Error("Загрузите аудиофайл джингла");
  if (input.position !== "intro" && input.position !== "outro") throw new Error("Некорректная позиция джингла");
  if (input.duration <= 0) throw new Error("Не удалось определить длительность джингла");
  if (input.duration > MAX_JINGLE_DURATION_SEC) {
    throw new Error(`Джингл слишком длинный. Максимум: ${MAX_JINGLE_DURATION_SEC} сек.`);
  }
}

export async function getPublishedAnnouncementJinglesAction() {
  try {
    await requireAnyAuthenticatedUser();

    const rows = await db.query.announcementJingles.findMany({
      where: eq(announcementJingles.isPublished, true),
      orderBy: [asc(announcementJingles.sortOrder), desc(announcementJingles.createdAt)],
    });

    return { success: true, data: rows };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось загрузить джинглы";
    return { success: false, error: message };
  }
}

export async function getAdminAnnouncementJinglesAction() {
  try {
    await requireAdminUser();

    const rows = await db.query.announcementJingles.findMany({
      orderBy: [asc(announcementJingles.sortOrder), desc(announcementJingles.createdAt)],
    });

    return { success: true, data: rows };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось загрузить джинглы";
    return { success: false, error: message };
  }
}

export async function createAnnouncementJingleAction(input: AnnouncementJingleInput) {
  try {
    const admin = await requireAdminUser();
    const normalized = normalizeInput(input);
    validateInput(normalized);

    const [row] = await db.insert(announcementJingles).values({
      ...normalized,
      createdByUserId: admin.id,
    }).returning();

    revalidatePath("/admin/content");
    revalidatePath("/dashboard/announcements");

    return { success: true, data: row };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось создать джингл";
    return { success: false, error: message };
  }
}

export async function updateAnnouncementJingleAction(id: string, input: AnnouncementJingleInput) {
  try {
    await requireAdminUser();
    const normalized = normalizeInput(input);
    validateInput(normalized);

    const [row] = await db.update(announcementJingles)
      .set({
        ...normalized,
        updatedAt: new Date(),
      })
      .where(eq(announcementJingles.id, id))
      .returning();

    if (!row) {
      return { success: false, error: "Джингл не найден" };
    }

    revalidatePath("/admin/content");
    revalidatePath("/dashboard/announcements");

    return { success: true, data: row };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось обновить джингл";
    return { success: false, error: message };
  }
}

export async function deleteAnnouncementJingleAction(id: string) {
  try {
    await requireAdminUser();

    const [row] = await db.delete(announcementJingles)
      .where(eq(announcementJingles.id, id))
      .returning({ id: announcementJingles.id });

    if (!row) {
      return { success: false, error: "Джингл не найден" };
    }

    revalidatePath("/admin/content");
    revalidatePath("/dashboard/announcements");

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось удалить джингл";
    return { success: false, error: message };
  }
}
