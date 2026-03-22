import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses } from "@/db/schema";

export async function GET() {
  // This endpoint is only available in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    // Get first user
    const user = await db.query.users.findFirst();
    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 404 });
    }

    // Upsert business - Drizzle ON CONFLICT for Postgres
    const [business] = await db.insert(businesses)
      .values({
        userId: user.id,
        inn: "7701234567",
        kpp: "770101001",
        legalName: 'ООО "Кофейня Маяк"',
        address: "г. Москва, ул. Арбат, д. 1",
        subscriptionStatus: "ACTIVE",
      })
      .onConflictDoUpdate({
        target: businesses.inn,
        set: {
          legalName: 'ООО "Кофейня Маяк"',
          subscriptionStatus: "ACTIVE",
        }
      })
      .returning();

    return NextResponse.json({ success: true, business });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
