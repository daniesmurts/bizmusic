import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, leadActivities, referralAgents } from "@/db/schema";
import { eq, gte, count, inArray } from "drizzle-orm";
import { sendTelegramMessage } from "@/lib/telegram";

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [callsResult] = await db
      .select({ count: count() })
      .from(leadActivities)
      .where(
        gte(leadActivities.createdAt, startOfDay)
      );

    const [trialsResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(eq(leads.status, "trial_sent"));

    const [conversionsResult] = await db
      .select({ count: count() })
      .from(leads)
      .where(eq(leads.status, "converted"));

    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (adminChatId) {
      await sendTelegramMessage(
        adminChatId,
        `📊 <b>Итоги дня BizMuzik CRM</b>\n\n` +
        `📞 Звонков сегодня: <b>${callsResult?.count ?? 0}</b>\n` +
        `🚀 Пробных периодов: <b>${trialsResult?.count ?? 0}</b>\n` +
        `✅ Конверсий: <b>${conversionsResult?.count ?? 0}</b>`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Daily summary cron error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
