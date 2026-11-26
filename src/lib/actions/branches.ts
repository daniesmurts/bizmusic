"use server";

import { db } from "@/db";
import { businesses, locations, users } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth/get-user";
import { issueLinkToken } from "@/lib/auth/tokens";
import { sendInviteEmail } from "@/lib/auth/emails";

async function getOwnerBusinessId(): Promise<string> {
  const user = await getAuthUser();
  if (!user) throw new Error("Не авторизован");

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { role: true },
  });

  if (!dbUser || dbUser.role !== "BUSINESS_OWNER") {
    throw new Error("Доступ запрещён");
  }

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.userId, user.id),
    columns: { id: true },
  });

  if (!business) throw new Error("Компания не найдена");
  return business.id;
}

export async function getLocationsWithManagersAction() {
  try {
    const businessId = await getOwnerBusinessId();
    const locationRows = await db.query.locations.findMany({
      where: eq(locations.businessId, businessId),
      orderBy: (table, { asc }) => [asc(table.createdAt)],
    });

    const managerRows = locationRows.length
      ? await db.query.users.findMany({
          where: eq(users.role, "STAFF"),
          columns: { id: true, email: true, role: true, createdAt: true, assignedLocationId: true },
        })
      : [];

    const data = locationRows.map((location) => ({
      ...location,
      assignedUsers: managerRows
        .filter((m) => m.assignedLocationId === location.id)
        .map(({ assignedLocationId, ...manager }) => manager),
    }));

    return { success: true as const, data };
  } catch (error: unknown) {
    return { success: false as const, error: error instanceof Error ? error.message : "Ошибка загрузки" };
  }
}

export async function createLocationAction(name: string, address: string) {
  try {
    const businessId = await getOwnerBusinessId();
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();

    if (!trimmedName || !trimmedAddress) {
      return { success: false as const, error: "Название и адрес обязательны" };
    }

    const [location] = await db
      .insert(locations)
      .values({ businessId, name: trimmedName, address: trimmedAddress })
      .returning({ id: locations.id, name: locations.name, address: locations.address });

    revalidatePath("/dashboard/branches");
    return { success: true as const, data: location };
  } catch (error: unknown) {
    return { success: false as const, error: error instanceof Error ? error.message : "Ошибка создания филиала" };
  }
}

export async function inviteBranchManagerAction(locationId: string, email: string) {
  try {
    const businessId = await getOwnerBusinessId();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.includes("@")) {
      return { success: false as const, error: "Некорректный email" };
    }

    const location = await db.query.locations.findFirst({
      where: and(eq(locations.id, locationId), eq(locations.businessId, businessId)),
      columns: { id: true, name: true },
    });

    if (!location) {
      return { success: false as const, error: "Филиал не найден" };
    }

    const existingUser = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(sql`lower(${users.email}) = ${normalizedEmail}`)
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (existingUser) {
      return {
        success: false as const,
        error: existingUser.role === "STAFF"
          ? "Менеджер с таким email уже существует"
          : "Пользователь с таким email уже зарегистрирован",
      };
    }

    // No password yet — the manager sets one via the invite link.
    const [newDbUser] = await db.insert(users).values({
      email: normalizedEmail,
      passwordHash: null,
      role: "STAFF",
      assignedLocationId: locationId,
    }).returning({ id: users.id });

    const token = await issueLinkToken(newDbUser.id, "INVITE", 7 * 24 * 60 * 60 * 1000);
    const sent = await sendInviteEmail(normalizedEmail, token, location.name);
    if (!sent.success) {
      console.error("[inviteBranchManager] invite email failed:", sent.error);
      return {
        success: false as const,
        error: "Менеджер создан, но письмо с приглашением не отправилось. Попробуйте позже.",
      };
    }

    revalidatePath("/dashboard/branches");
    return {
      success: true as const,
      message: `Приглашение отправлено на ${normalizedEmail}`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка приглашения";
    return { success: false as const, error: message };
  }
}

export async function deactivateManagerAction(managerId: string) {
  try {
    const businessId = await getOwnerBusinessId();

    const manager = await db.query.users.findFirst({
      where: and(eq(users.id, managerId), eq(users.role, "STAFF")),
      columns: { id: true, assignedLocationId: true },
    });

    if (!manager?.assignedLocationId) {
      return { success: false as const, error: "Менеджер не найден" };
    }

    const location = await db.query.locations.findFirst({
      where: and(eq(locations.id, manager.assignedLocationId), eq(locations.businessId, businessId)),
      columns: { id: true },
    });

    if (!location) {
      return { success: false as const, error: "Нет доступа к этому менеджеру" };
    }

    // Disable login and revoke existing sessions.
    await db
      .update(users)
      .set({ assignedLocationId: null, disabledAt: new Date(), sessionVersion: sql`${users.sessionVersion} + 1` })
      .where(eq(users.id, managerId));

    revalidatePath("/dashboard/branches");
    return { success: true as const };
  } catch (error: unknown) {
    return { success: false as const, error: error instanceof Error ? error.message : "Ошибка деактивации" };
  }
}
