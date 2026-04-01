import { NextRequest, NextResponse } from "next/server";
import { initUcallerAuth } from "@/lib/ucaller";
import { buildRateLimitHeaders, checkRateLimit, getRequestIp } from "@/lib/middleware/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      phone?: string;
      client?: string;
    };

    const ip = getRequestIp(request);
    const key = `phone-init:${ip}:${body.phone?.trim() || "unknown"}`;
    const rateLimit = checkRateLimit({
      key,
      maxRequests: 5,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Слишком много запросов. Попробуйте чуть позже." },
        { status: 429, headers: buildRateLimitHeaders(rateLimit.retryAfterSeconds) }
      );
    }

    if (!body.phone) {
      return NextResponse.json({ success: false, error: "Телефон обязателен" }, { status: 400 });
    }

    const data = await initUcallerAuth(body.phone, body.client);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось инициализировать подтверждение по телефону";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}