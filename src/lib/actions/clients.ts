"use server";

import { prisma } from "@/lib/prisma";
import { AdminBusiness } from "@/types/admin";

export async function getClientsAction() {
  try {
    const businesses = await prisma.business.findMany({
      include: {
        user: {
          select: {
            email: true,
          },
        },
        _count: {
          select: {
            locations: true,
            playLogs: true,
          },
        },
        licenses: {
          select: {
            id: true,
            pdfUrl: true,
          },
          take: 1,
          orderBy: {
            issuedAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: businesses as unknown as AdminBusiness[] };
  } catch (error: any) {
    console.error("Error fetching clients:", error);
    return { success: false, error: "Не удалось загрузить список клиентов" };
  }
}
