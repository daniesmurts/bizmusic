import "server-only";

import { cookies, headers } from "next/headers";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, type SessionRole } from "./session-token";

export async function createSession(user: { id: string; role: SessionRole; sessionVersion: number }) {
  const token = await signSession({ sub: user.id, role: user.role, sv: user.sessionVersion });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Client IP behind YC API Gateway (first X-Forwarded-For hop). */
export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim() || null;
  return h.get("x-real-ip");
}

export async function getUserAgent(): Promise<string | null> {
  return (await headers()).get("user-agent");
}
