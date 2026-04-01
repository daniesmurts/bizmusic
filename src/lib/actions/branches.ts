"use server";

import { db } from "@/db";
import { businesses, locations, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-storage";

// ---------------------------------------------------------------------------
// Internal helper — resolve calling user's businessId, enforcing BUSINESS_OWNER
// ---------------------------------------------------------------------------
async function getOwnerBusinessId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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

// ---------------------------------------------------------------------------
// READ — fetch all locations with their assigned branch managers
// ---------------------------------------------------------------------------
export async function getLocationsWithManagersAction() {
  try {
    const businessId = await getOwnerBusinessId();

    const locs = await db.query.locations.findMany({
      where: eq(locations.businessId, businessId),
      with: {
        assignedUsers: {
          columns: { id: true, email: true, role: true, createdAt: true },
        },
      },
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });

    return { success: true as const, data: locs };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка загрузки";
    return { success: false as const, error: message };
  }
}

// ---------------------------------------------------------------------------
// CREATE location
// ---------------------------------------------------------------------------
export async function createLocationAction(name: string, address: string) {
  try {
    const trimmed = { name: name.trim(), address: address.trim() };
    if (!trimmed.name || !trimmed.address) {
      return { success: false as const, error: "Название и адрес обязательны" };
    }

    const businessId = await getOwnerBusinessId();

    const [loc] = await db
      .insert(locations)
      .values({ businessId, name: trimmed.name, address: trimmed.address })
      .returning({ id: locations.id, name: locations.name });

    revalidatePath("/dashboard/branches");
    return { success: true as const, data: loc };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Ошибка создания филиала";
    return { success: false as const, error: message };
  }
}

// ---------------------------------------------------------------------------
// UPDATE location
// ---------------------------------------------------------------------------
export async function updateLocationAction(
  locationId: string,
  name: string,
  address: string
) {
  try {
    const trimmed = { name: name.trim(), address: address.trim() };
    if (!trimmed.name || !trimmed.address) {
      return { success: false as const, error: "Название и адрес обязательны" };
    }

    const businessId = await getOwnerBusinessId();

    const loc = await db.query.locations.findFirst({
      where: and(
        eq(locations.id, locationId),
        eq(locations.businessId, businessId)
      ),
      columns: { id: true },
    });
    if (!loc) return { success: false as const, error: "Филиал не найден" };

    await db
      .update(locations)
      .set({ name: trimmed.name, address: trimmed.address })
      .where(eq(locations.id, locationId));

    revalidatePath("/dashboard/branches");
    return { success: true as const };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Ошибка обновления";
    return { success: false as const, error: message };
  }
}

// ---------------------------------------------------------------------------
// DELETE location (only if no assigned managers)
// ---------------------------------------------------------------------------
export async function deleteLocationAction(locationId: string) {
  try {
    const businessId = await getOwnerBusinessId();

    const loc = await db.query.locations.findFirst({
      where: and(
        eq(locations.id, locationId),
        eq(locations.businessId, businessId)
      ),
      with: { assignedUsers: { columns: { id: true } } },
    });
    if (!loc) return { success: false as const, error: "Филиал не найден" };

    if (loc.assignedUsers.length > 0) {
      return {
        success: false as const,
        error: "Сначала отзовите доступ у менеджера",
      };
    }

    await db.delete(locations).where(eq(locations.id, locationId));

    revalidatePath("/dashboard/branches");
    return { success: true as const };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ошибка удаления";
    return { success: false as const, error: message };
  }
}

// ---------------------------------------------------------------------------
// INVITE branch manager — sends Supabase invite email + pre-creates DB record
// ---------------------------------------------------------------------------
export async function inviteBranchManagerAction(
  locationId: string,
  email: string
) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return { success: false as const, error: "Некорректный email" };
    }

    const businessId = await getOwnerBusinessId();

    // Verify location belongs to this business
    const loc = await db.query.locations.findFirst({
      where: and(
        eq(locations.id, locationId),
        eq(locations.businessId, businessId)
      ),
      columns: { id: true, name: true },
    });
    if (!loc) return { success: false as const, error: "Филиал не найден" };

    // Reject if user already exists in our DB (prevents account hijack)
    const existing = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
      columns: { id: true },
    });
    if (existing) {
      return {
        success: false as const,
        error: "Пользователь с таким email уже зарегистрирован в системе",
      };
    }

    // Send Supabase invite (creates auth user + sends email link)
    const redirectTo = `${
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://bizmuzik.ru"
    }/auth/callback?next=/dashboard/player`;

    const { data: inviteData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
        redirectTo,
        data: { is_branch_staff: true, assigned_location_id: locationId },
      });

    if (inviteError || !inviteData?.user) {
      console.error("Supabase invite error:", inviteError);
      return {
        success: false as const,
        error: "Не удалось отправить приглашение",
      };
    }

    // Pre-create our DB record with STAFF role + location assignment
    // syncUserAndLegalAcceptance will find this record on first login and skip insert
    await db.insert(users).values({
      id: inviteData.user.id,
      email: normalizedEmail,
      passwordHash: "SUPABASE_AUTH",
      role: "STAFF",
      assignedLocationId: locationId,
    });

    revalidatePath("/dashboard/branches");
    return {
      success: true as const,
      message: `Приглашение отправлено на ${normalizedEmail}`,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Ошибка отправки приглашения";
    return { success: false as const, error: message };
  }
}

// ---------------------------------------------------------------------------
// REASSIGN manager to a different location
// ---------------------------------------------------------------------------
export async function reassignManagerLocationAction(
  managerId: string,
  newLocationId: string
) {
  try {
    const businessId = await getOwnerBusinessId();

    // Validate new location belongs to this business
    const newLoc = await db.query.locations.findFirst({
      where: and(
        eq(locations.id, newLocationId),
        eq(locations.businessId, businessId)
      ),
      columns: { id: true },
    });
    if (!newLoc) return { success: false as const, error: "Филиал не найден" };

    // Validate manager exists and is STAFF
    const manager = await db.query.users.findFirst({
      where: and(eq(users.id, managerId), eq(users.role, "STAFF")),
      columns: { id: true, assignedLocationId: true },
    });
    if (!manager) return { success: false as const, error: "Менеджер не найден" };

    // Verify manager's current location belongs to this business (ownership check)
    if (manager.assignedLocationId) {
      const currentLoc = await db.query.locations.findFirst({
        where: and(
          eq(locations.id, manager.assignedLocationId),
          eq(locations.businessId, businessId)
        ),
        columns: { id: true },
      });
      if (!currentLoc) {
        return {
          success: false as const,
          error: "Нет доступа к этому менеджеру",
        };
      }
    }

    await db
      .update(users)
      .set({ assignedLocationId: newLocationId })
      .where(eq(users.id, managerId));

    revalidatePath("/dashboard/branches");
    return { success: true as const };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Ошибка переназначения";
    return { success: false as const, error: message };
  }
}

// ---------------------------------------------------------------------------
// DEACTIVATE manager — ban in Supabase and clear location assignment
// ---------------------------------------------------------------------------
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

    // Verify manager belongs to this business
    const loc = await db.query.locations.findFirst({
      where: and(
        eq(locations.id, manager.assignedLocationId),
        eq(locations.businessId, businessId)
      ),
      columns: { id: true },
    });
    if (!loc) {
      return {
        success: false as const,
        error: "Нет доступа к этому менеджеру",
      };
    }

    // Ban user in Supabase Auth (~100 years)
    const { error: banError } =
      await supabaseAdmin.auth.admin.updateUserById(managerId, {
        ban_duration: "876600h",
      });
    if (banError) {
      console.error("Ban error:", banError);
      return {
        success: false as const,
        error: "Не удалось заблокировать пользователя",
      };
    }

    // Clear location assignment in our DB
    await db
      .update(users)
      .set({ assignedLocationId: null })
      .where(eq(users.id, managerId));

    revalidatePath("/dashboard/branches");
    return { success: true as const };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Ошибка деактивации";
    return { success: false as const, error: message };
  }
}
