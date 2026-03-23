"use server";

import { db } from "@/db";
import { payments, businesses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";

export async function getPaymentHistoryAction(businessId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Авторизация обязательна" };
    }

    // Verify the user owns this business
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.id, businessId),
      columns: { userId: true },
    });

    if (!business || business.userId !== user.id) {
      return { success: false, error: "Отказано в доступе" };
    }

    const records = await db.query.payments.findMany({
      where: eq(payments.businessId, businessId),
      orderBy: [desc(payments.createdAt)],
    });

    return { success: true, data: records };
  } catch (error: unknown) {
    console.error("Failed to fetch payment history:", error);
    return { success: false, error: "Ошибка при загрузке истории платежей" };
  }
}
