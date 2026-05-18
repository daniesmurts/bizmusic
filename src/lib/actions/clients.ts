"use server";

import { db } from "@/db";
import { businesses, users, locations, playLogs, licenses } from "@/db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";
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

    // Batch-fetch all latest licenses in a single query, then join in memory
    const businessIds = clientsData.map((b) => b.id);
    const latestLicenseMap = new Map<string, { id: string; pdfUrl: string; documentStatus: string; generationError: string | null; businessId: string }>();

    if (businessIds.length > 0) {
      const allLicenses = await db
        .select({
          id: licenses.id,
          pdfUrl: licenses.pdfUrl,
          documentStatus: licenses.documentStatus,
          generationError: licenses.generationError,
          businessId: licenses.businessId,
        })
        .from(licenses)
        .where(inArray(licenses.businessId, businessIds))
        .orderBy(desc(licenses.issuedAt));

      // Keep only the first (latest) license per business
      for (const lic of allLicenses) {
        if (!latestLicenseMap.has(lic.businessId)) {
          latestLicenseMap.set(lic.businessId, lic);
        }
      }
    }

    const mappedClients = clientsData.map((b) => {
      const latestLicense = latestLicenseMap.get(b.id);
      return {
        ...b,
        _count: {
          locations: b.locationsCount,
          playLogs: b.playLogsCount,
        },
        licenses: latestLicense ? [latestLicense] : [],
      };
    });

    return { success: true, data: mappedClients as unknown as AdminBusiness[] };
  } catch (error: unknown) {
    console.error("Error fetching clients:", error);
    return { success: false, error: "Не удалось загрузить список клиентов" };
  }
}
