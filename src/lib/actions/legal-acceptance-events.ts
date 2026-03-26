"use server";

import { db } from "@/db";
import { legalAcceptanceEvents, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import type { AdminLegalAcceptanceEvent } from "@/types/admin";

export async function getLegalAcceptanceEventsAction(limit: number = 100) {
  try {
    const { createClient } = await import("@/utils/supabase/server");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { role: true },
    });

    if (!userRecord) {
      return { success: false, error: "Пользователь не найден" };
    }

    const safeLimit = Math.max(1, Math.min(Math.floor(limit), 500));

    const events = userRecord.role === "ADMIN"
      ? await db.query.legalAcceptanceEvents.findMany({
          orderBy: [desc(legalAcceptanceEvents.acceptedAt)],
          limit: safeLimit,
          with: { user: { columns: { email: true } } },
        })
      : await db.query.legalAcceptanceEvents.findMany({
          where: eq(legalAcceptanceEvents.userId, user.id),
          orderBy: [desc(legalAcceptanceEvents.acceptedAt)],
          limit: safeLimit,
          with: { user: { columns: { email: true } } },
        });

    return { success: true, data: events as unknown as AdminLegalAcceptanceEvent[] };
  } catch (error: unknown) {
    console.error("Error fetching legal acceptance events:", error);
    return { success: false, error: "Не удалось загрузить события акцепта" };
  }
}
