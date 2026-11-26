import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/get-user";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json(
    user ? { user: { id: user.id, email: user.email }, role: user.role } : { user: null, role: null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
