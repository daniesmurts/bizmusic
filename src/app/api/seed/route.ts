import { NextResponse } from "next/server";

export async function GET() {
  // This endpoint is only available in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { prisma } = await import("@/lib/prisma");

  try {
    // Get first user
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: "No user found" }, { status: 404 });
    }

    const business = await prisma.business.upsert({
      where: { inn: "7701234567" },
      update: {
        legalName: 'ООО "Кофейня Маяк"',
        subscriptionStatus: "ACTIVE",
      },
      create: {
        userId: user.id,
        inn: "7701234567",
        kpp: "770101001",
        legalName: 'ООО "Кофейня Маяк"',
        address: "г. Москва, ул. Арбат, д. 1",
        subscriptionStatus: "ACTIVE",
      },
    });

    return NextResponse.json({ success: true, business });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
