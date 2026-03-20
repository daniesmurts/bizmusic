import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
