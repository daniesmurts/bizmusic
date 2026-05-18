import { NextResponse } from "next/server";
import { retryFailedSupportDeliveries } from "@/lib/integrations/support-dispatch";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function verifyCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (authHeader.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
}

export async function GET(req: Request) {
  try {
    if (!verifyCronSecret(req)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const results = await retryFailedSupportDeliveries(40);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error("support delivery retry cron error", error);
    return NextResponse.json(
      { success: false, error: "Failed to retry support deliveries" },
      { status: 500 },
    );
  }
}
