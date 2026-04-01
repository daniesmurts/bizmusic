import { db } from "@/db";
import { businesses, locations, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export interface AccessScope {
  userId: string;
  role: "ADMIN" | "BUSINESS_OWNER" | "STAFF";
  businessId: string | null;
  assignedLocationId: string | null;
  isOwnerLike: boolean;
  isBranchManager: boolean;
}

export async function resolveAccessScope(userId: string): Promise<AccessScope | null> {
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, role: true, assignedLocationId: true },
  });

  if (!dbUser) return null;

  if (dbUser.role === "STAFF") {
    if (!dbUser.assignedLocationId) {
      return {
        userId: dbUser.id,
        role: dbUser.role,
        businessId: null,
        assignedLocationId: null,
        isOwnerLike: false,
        isBranchManager: true,
      };
    }

    const assignedLocation = await db.query.locations.findFirst({
      where: eq(locations.id, dbUser.assignedLocationId),
      columns: { id: true, businessId: true },
    });

    return {
      userId: dbUser.id,
      role: dbUser.role,
      businessId: assignedLocation?.businessId ?? null,
      assignedLocationId: assignedLocation?.id ?? null,
      isOwnerLike: false,
      isBranchManager: true,
    };
  }

  const ownerBusiness = await db.query.businesses.findFirst({
    where: eq(businesses.userId, dbUser.id),
    columns: { id: true },
    orderBy: [desc(businesses.updatedAt)],
  });

  return {
    userId: dbUser.id,
    role: dbUser.role,
    businessId: ownerBusiness?.id ?? null,
    assignedLocationId: null,
    isOwnerLike: dbUser.role === "ADMIN" || dbUser.role === "BUSINESS_OWNER",
    isBranchManager: false,
  };
}

export function canAccessLocation(scope: AccessScope, locationId: string | null | undefined) {
  if (!locationId) return scope.isOwnerLike;
  if (scope.isBranchManager) return scope.assignedLocationId === locationId;
  return scope.isOwnerLike;
}