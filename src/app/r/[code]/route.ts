import { db } from "@/db";
import { referralAgents, referralClicks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getRequestIp } from "@/lib/middleware/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bizmuzik.ru";

  const agent = await db.query.referralAgents.findFirst({
    where: eq(referralAgents.referralCode, code),
    columns: { id: true, status: true },
  });

  if (!agent || agent.status !== "active") {
    return NextResponse.redirect(`${baseUrl}/register`);
  }

  try {
    const ip = getRequestIp(req);
    const ua = req.headers.get("user-agent");
    await db.insert(referralClicks).values({
      agentId: agent.id,
      referralCode: code,
      ipAddress: ip || null,
      userAgent: ua || null,
    });
  } catch (err) {
    console.error("[referral] click log error:", err);
  }

  const response = NextResponse.redirect(`${baseUrl}/register`);
  response.cookies.set("bizmuzik_ref", code, {
    path: "/",
    maxAge: 2592000,
    httpOnly: true,
    sameSite: "lax",
  });

  return response;
}
