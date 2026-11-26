import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE, verifySession, type SessionRole } from "./session-token";

export interface AuthUser {
  id: string;
}

export interface SessionUser extends AuthUser {
  email: string;
  role: SessionRole;
}

/**
 * Resolves the signed-in user for this request. Unlike src/proxy.ts (signature
 * only), this also checks the DB so disabled accounts and revoked sessions
 * (sessionVersion bump) are rejected immediately.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const payload = await verifySession(token);
  if (!payload) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, payload.sub),
    columns: { id: true, email: true, role: true, sessionVersion: true, disabledAt: true },
  });
  if (!user || user.disabledAt || user.sessionVersion !== payload.sv) return null;

  return { id: user.id, email: user.email, role: user.role };
});

export async function getAuthUser(): Promise<AuthUser | null> {
  const user = await getSessionUser();
  return user ? { id: user.id } : null;
}
