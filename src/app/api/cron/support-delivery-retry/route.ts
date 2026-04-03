import { NextResponse } from "next/server";
import { retryFailedSupportDeliveries } from "@/lib/integrations/support-dispatch";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
