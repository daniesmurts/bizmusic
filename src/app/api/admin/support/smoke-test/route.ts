import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import {
  supportConversations,
  supportMessageDeliveries,
  supportMessages,
  users,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/support/smoke-test
 *
 * Проверяет работоспособность системы поддержки:
 *  1. Возвращает статистику очереди (OPEN/PENDING/CLOSED)
 *  2. Показывает состояние доставки последних 5 сообщений (SENT/FAILED/PENDING)
 *  3. Проверяет наличие переменных окружения (без раскрытия значений)
 *
 * Требует роль ADMIN.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { role: true },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Статистика очереди
    const { sql } = await import("drizzle-orm");
    const [openRow, pendingRow, closedRow] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(supportConversations)
        .where(eq(supportConversations.status, "OPEN"))
        .then((r) => r[0]),
      db
        .select({ count: sql<number>`count(*)` })
        .from(supportConversations)
        .where(eq(supportConversations.status, "PENDING"))
        .then((r) => r[0]),
      db
        .select({ count: sql<number>`count(*)` })
        .from(supportConversations)
        .where(eq(supportConversations.status, "CLOSED"))
        .then((r) => r[0]),
    ]);

    // Последние 5 доставок
    const recentDeliveries = await db
      .select({
        id: supportMessageDeliveries.id,
        provider: supportMessageDeliveries.provider,
        status: supportMessageDeliveries.status,
        attemptCount: supportMessageDeliveries.attemptCount,
        lastError: supportMessageDeliveries.lastError,
        updatedAt: supportMessageDeliveries.updatedAt,
        messageId: supportMessageDeliveries.messageId,
      })
      .from(supportMessageDeliveries)
      .orderBy(desc(supportMessageDeliveries.updatedAt))
      .limit(5);

    // Последнее сообщение для контекста
    const lastMessage = await db.query.supportMessages.findFirst({
      orderBy: [desc(supportMessages.createdAt)],
      columns: {
        id: true,
        direction: true,
        source: true,
        createdAt: true,
      },
    });

    // Проверка ОС (без раскрытия значений)
    const envChecks = {
      TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_SUPPORT_CHAT_ID: !!process.env.TELEGRAM_SUPPORT_CHAT_ID,
      BITRIX24_WEBHOOK_URL: !!process.env.BITRIX24_WEBHOOK_URL,
      BITRIX24_RESPONSIBLE_ID: !!process.env.BITRIX24_RESPONSIBLE_ID,
      CRON_SECRET: !!process.env.CRON_SECRET,
    };

    const failedDeliveries = recentDeliveries.filter((d) => d.status === "FAILED");

    return NextResponse.json({
      ok: true,
      queue: {
        open: Number(openRow?.count || 0),
        pending: Number(pendingRow?.count || 0),
        closed: Number(closedRow?.count || 0),
      },
      recentDeliveries,
      lastMessage,
      envChecks,
      warnings:
        failedDeliveries.length > 0
          ? [`${failedDeliveries.length} доставок со статусом FAILED в последних 5`]
          : [],
    });
  } catch (error) {
    console.error("support smoke-test error", error);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
