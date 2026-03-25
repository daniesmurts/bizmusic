"use server";

import { db } from "@/db";
import { businesses, ttsCreditLots } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { asc, eq } from "drizzle-orm";

export interface AwardFreeTokensInput {
  businessId: string;
  credits: number;
  expiryDays: number;
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "ADMIN") return null;
  return user;
}

export async function getBusinessesForSelectAction(): Promise<{
  success: boolean;
  error?: string;
  data: { id: string; legalName: string }[];
}> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Доступ запрещён", data: [] };

  const rows = await db
    .select({ id: businesses.id, legalName: businesses.legalName })
    .from(businesses)
    .orderBy(asc(businesses.legalName));

  return { success: true, data: rows };
}

export async function awardFreeTokensAction(
  input: AwardFreeTokensInput
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();
  if (!admin) return { success: false, error: "Доступ запрещён" };

  const { businessId, credits, expiryDays } = input;

  if (
    typeof businessId !== "string" ||
    !businessId.trim() ||
    !Number.isInteger(credits) ||
    credits < 1 ||
    credits > 10000 ||
    !Number.isInteger(expiryDays) ||
    expiryDays < 1 ||
    expiryDays > 1095
  ) {
    return { success: false, error: "Некорректные данные" };
  }

  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { id: true },
  });

  if (!business) return { success: false, error: "Бизнес не найден" };

  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000);

  await db.insert(ttsCreditLots).values({
    businessId,
    creditsTotal: credits,
    creditsRemaining: credits,
    purchasedAt: now,
    expiresAt,
    paymentId: null,
  });

  return { success: true };
}