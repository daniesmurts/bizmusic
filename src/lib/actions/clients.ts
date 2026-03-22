"use server";

import { db } from "@/db";
import { businesses, users, locations, playLogs, licenses } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { AdminBusiness } from "@/types/admin";

export async function getClientsAction() {
  try {
    const clientsData = await db
      .select({
        id: businesses.id,
        legalName: businesses.legalName,
        inn: businesses.inn,
        kpp: businesses.kpp,
        address: businesses.address,
        subscriptionStatus: businesses.subscriptionStatus,
        createdAt: businesses.createdAt,
        user: {
          email: users.email,
        },
        locationsCount: sql<number>`(SELECT count(*) FROM ${locations} WHERE ${locations.businessId} = ${businesses.id})`.mapWith(Number),
        playLogsCount: sql<number>`(SELECT count(*) FROM ${playLogs} WHERE ${playLogs.businessId} = ${businesses.id})`.mapWith(Number),
      })
      .from(businesses)
      .leftJoin(users, eq(users.id, businesses.userId))
      .orderBy(desc(businesses.createdAt));

    // Fetch latest licenses separately for each business to avoid full relation materialization
    const mappedClients = await Promise.all(clientsData.map(async (b) => {
      const [latestLicense] = await db.query.licenses.findMany({
        where: eq(licenses.businessId, b.id),
        orderBy: [desc(licenses.issuedAt)],
        limit: 1,
      });

      return {
        ...b,
        _count: {
          locations: b.locationsCount,
          playLogs: b.playLogsCount,
        },
        licenses: latestLicense ? [{ id: latestLicense.id, pdfUrl: latestLicense.pdfUrl }] : []
      };
    }));

    return { success: true, data: mappedClients as unknown as AdminBusiness[] };
  } catch (error: unknown) {
    console.error("Error fetching clients:", error);
    return { success: false, error: "Не удалось загрузить список клиентов" };
  }
}
