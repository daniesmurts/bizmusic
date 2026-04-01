import { NextRequest, NextResponse } from "next/server";
import { verifyUcallerCode } from "@/lib/ucaller";
import { buildRateLimitHeaders, checkRateLimit, getRequestIp } from "@/lib/middleware/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      ucallerId?: number;
      code?: string;
    };

    const ip = getRequestIp(request);
    const key = `phone-verify:${ip}:${String(body.ucallerId || "unknown")}`;
    const rateLimit = checkRateLimit({
      key,
      maxRequests: 10,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: "Слишком много попыток. Попробуйте чуть позже." },
        { status: 429, headers: buildRateLimitHeaders(rateLimit.retryAfterSeconds) }
      );
    }

    if (!body.ucallerId || !body.code) {
      return NextResponse.json({ success: false, error: "Требуются ucallerId и код" }, { status: 400 });
    }

    const result = await verifyUcallerCode(Number(body.ucallerId), body.code);
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Не удалось подтвердить код";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}