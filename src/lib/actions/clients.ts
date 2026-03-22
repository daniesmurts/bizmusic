"use server";

import { db } from "@/db";
import { businesses, users, locations, playLogs, licenses } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { AdminBusiness } from "@/types/admin";

export async function getClientsAction() {
  try {
    const clients = await db.query.businesses.findMany({
      with: {
        user: {
          columns: {
            email: true,
          },
        },
        locations: true,
        playLogs: true,
        licenses: {
          orderBy: [desc(licenses.issuedAt)],
          limit: 1,
        },
      },
      orderBy: [desc(businesses.createdAt)],
    });

    // Map to match the expected AdminBusiness type (counts)
    const mappedClients = clients.map(b => ({
      ...b,
      _count: {
        locations: b.locations.length,
        playLogs: b.playLogs.length,
      }
    }));

    return { success: true, data: mappedClients as unknown as AdminBusiness[] };
  } catch (error: unknown) {
    console.error("Error fetching clients:", error);
    return { success: false, error: "Не удалось загрузить список клиентов" };
  }
}
