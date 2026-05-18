import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-user";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ role: null });

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { role: true },
  });

  return NextResponse.json({ role: dbUser?.role ?? null });
}
