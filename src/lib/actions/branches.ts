"use server";

import { db } from "@/db";
import { businesses, locations, users } from "@/db/schema";
import { clerkClient } from "@clerk/nextjs/server";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth/get-user";

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
      columns: { id: true },
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

    // Pre-create the DB record so the manager has access as soon as they sign in
    const [newDbUser] = await db.insert(users).values({
      email: normalizedEmail,
      passwordHash: "CLERK_AUTH",
      role: "STAFF",
      assignedLocationId: locationId,
      updatedAt: new Date(),
    }).returning({ id: users.id });

    // Send Clerk invitation — when user accepts, they sign up and the clerkId
    // gets linked via the getAuthUser() email-match flow on first login
    const client = await clerkClient();
    try {
      await client.invitations.createInvitation({
        emailAddress: normalizedEmail,
        publicMetadata: { role: "STAFF", assignedLocationId: locationId },
        redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://bizmuzik.ru"}/dashboard`,
        ignoreExisting: true,
      });
    } catch (inviteErr) {
      console.error("[inviteBranchManager] Clerk invite failed:", inviteErr);
      // Don't fail — the DB record is created, admin can resend later
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
      columns: { id: true, assignedLocationId: true, clerkId: true },
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

    // Ban the Clerk user so they cannot sign in
    if (manager.clerkId) {
      const client = await clerkClient();
      try {
        await client.users.banUser(manager.clerkId);
      } catch (err) {
        console.error("[deactivateManager] Clerk ban failed:", err);
        return { success: false as const, error: "Не удалось заблокировать пользователя" };
      }
    }

    await db.update(users).set({ assignedLocationId: null }).where(eq(users.id, managerId));

    revalidatePath("/dashboard/branches");
    return { success: true as const };
  } catch (error: unknown) {
    return { success: false as const, error: error instanceof Error ? error.message : "Ошибка деактивации" };
  }
}
