import "server-only";

import { and, count, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { authAttempts } from "@/db/schema";

/** DB-backed so limits hold across all serverless container instances. */
export async function isRateLimited(key: string, limit: number, windowMs: number): Promise<boolean> {
  const [row] = await db
    .select({ n: count() })
    .from(authAttempts)
    .where(and(eq(authAttempts.key, key), gt(authAttempts.createdAt, new Date(Date.now() - windowMs))));
  return (row?.n ?? 0) >= limit;
}

export async function recordAttempt(key: string): Promise<void> {
  await db.insert(authAttempts).values({ key });
  // Opportunistic cleanup of rows older than a day.
  if (Math.random() < 0.02) {
    await db.delete(authAttempts).where(lt(authAttempts.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
  }
}

export async function clearAttempts(key: string): Promise<void> {
  await db.delete(authAttempts).where(eq(authAttempts.key, key));
}
