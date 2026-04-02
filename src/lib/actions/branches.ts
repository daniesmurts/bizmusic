"use server";

import { db } from "@/db";
import { businesses, locations, users } from "@/db/schema";
import { supabaseAdmin } from "@/lib/supabase-storage";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

async function getOwnerBusinessId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Не авторизован");
  }

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

  if (!business) {
    throw new Error("Компания не найдена");
  }

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
          columns: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
            assignedLocationId: true,
          },
        })
      : [];

    const data = locationRows.map((location) => ({
      ...location,
      assignedUsers: managerRows
        .filter((manager) => manager.assignedLocationId === location.id)
        .map(({ assignedLocationId, ...manager }) => manager),
    }));

    return { success: true as const, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка загрузки";
    return { success: false as const, error: message };
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
    const message = error instanceof Error ? error.message : "Ошибка создания филиала";
    return { success: false as const, error: message };
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
        error:
          existingUser.role === "STAFF"
            ? "Менеджер с таким email уже существует"
            : "Пользователь с таким email уже зарегистрирован",
      };
    }

    const inviteNext = encodeURIComponent("/reset-password?mode=invite&next=/dashboard/player");
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || "https://bizmuzik.ru"}/auth/callback?next=${inviteNext}`;

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
      redirectTo,
      data: {
        is_branch_staff: true,
        assigned_location_id: locationId,
      },
    });

    if (error || !data.user) {
      return {
        success: false as const,
        error: error?.message || "Не удалось отправить приглашение",
      };
    }

    try {
      await db.insert(users).values({
        id: data.user.id,
        email: normalizedEmail,
        passwordHash: "SUPABASE_AUTH",
        role: "STAFF",
        assignedLocationId: locationId,
      });
    } catch (insertError: unknown) {
      // If user row already exists (e.g. retry/partial previous invite), recover by updating safely.
      const existingById = await db.query.users.findFirst({
        where: eq(users.id, data.user.id),
        columns: { id: true },
      });

      if (existingById) {
        await db
          .update(users)
          .set({
            email: normalizedEmail,
            passwordHash: "SUPABASE_AUTH",
            role: "STAFF",
            assignedLocationId: locationId,
          })
          .where(eq(users.id, data.user.id));
      } else {
        const message = insertError instanceof Error ? insertError.message : "";
        if (message.includes("assignedLocationId") && message.includes("does not exist")) {
          return {
            success: false as const,
            error:
              "В базе не применена миграция филиалов. Выполните миграции и повторите приглашение.",
          };
        }

        console.error("Invite manager DB insert error:", insertError);
        return {
          success: false as const,
          error: "Не удалось сохранить приглашение менеджера",
        };
      }
    }

    revalidatePath("/dashboard/branches");
    return {
      success: true as const,
      message: `Приглашение отправлено на ${normalizedEmail}`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка приглашения";
    if (message.includes("Failed query") || message.includes("insert into \"users\"")) {
      return {
        success: false as const,
        error: "Ошибка сохранения пользователя. Проверьте миграции базы данных.",
      };
    }
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
      where: and(
        eq(locations.id, manager.assignedLocationId),
        eq(locations.businessId, businessId)
      ),
      columns: { id: true },
    });

    if (!location) {
      return { success: false as const, error: "Нет доступа к этому менеджеру" };
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(managerId, {
      ban_duration: "876600h",
    });

    if (error) {
      return { success: false as const, error: "Не удалось заблокировать пользователя" };
    }

    await db.update(users).set({ assignedLocationId: null }).where(eq(users.id, managerId));

    revalidatePath("/dashboard/branches");
    return { success: true as const };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка деактивации";
    return { success: false as const, error: message };
  }
}