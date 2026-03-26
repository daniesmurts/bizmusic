import { NextRequest, NextResponse } from "next/server";
import { verifyUcallerCode } from "@/lib/ucaller";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      ucallerId?: number;
      code?: string;
    };

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