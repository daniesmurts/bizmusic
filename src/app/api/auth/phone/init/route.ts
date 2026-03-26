import { NextRequest, NextResponse } from "next/server";
import { initUcallerAuth } from "@/lib/ucaller";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      phone?: string;
      client?: string;
    };

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