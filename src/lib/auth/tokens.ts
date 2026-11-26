import "server-only";

import { createHmac, randomBytes, randomInt } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { authTokens } from "@/db/schema";

type TokenType = "EMAIL_VERIFY" | "PASSWORD_RESET" | "INVITE";

const MAX_CODE_ATTEMPTS = 5;

function hashToken(raw: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHmac("sha256", secret).update(raw).digest("hex");
}

async function issue(userId: string, type: TokenType, raw: string, ttlMs: number) {
  // Only the newest token of a type is valid.
  await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(authTokens.userId, userId), eq(authTokens.type, type), isNull(authTokens.usedAt)));

  await db.insert(authTokens).values({
    userId,
    type,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + ttlMs),
  });
}

/** Long random token for links (email verification, invites). */
export async function issueLinkToken(userId: string, type: "EMAIL_VERIFY" | "INVITE", ttlMs: number): Promise<string> {
  const raw = randomBytes(32).toString("base64url");
  await issue(userId, type, raw, ttlMs);
  return raw;
}

/** 6-digit code for password reset; bound to the user so it can't be guessed across accounts. */
export async function issueResetCode(userId: string, ttlMs: number): Promise<string> {
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await issue(userId, "PASSWORD_RESET", `${userId}:${code}`, ttlMs);
  return code;
}

/** Consumes a link token; returns its userId or null. */
export async function consumeLinkToken(raw: string, type: "EMAIL_VERIFY" | "INVITE"): Promise<string | null> {
  const [row] = await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(authTokens.tokenHash, hashToken(raw)),
        eq(authTokens.type, type),
        isNull(authTokens.usedAt),
        gt(authTokens.expiresAt, new Date()),
      ),
    )
    .returning({ userId: authTokens.userId });
  return row?.userId ?? null;
}

/** Looks up a link token without consuming it (e.g. to render the invite form). */
export async function peekLinkToken(raw: string, type: "EMAIL_VERIFY" | "INVITE"): Promise<string | null> {
  const row = await db.query.authTokens.findFirst({
    where: and(
      eq(authTokens.tokenHash, hashToken(raw)),
      eq(authTokens.type, type),
      isNull(authTokens.usedAt),
      gt(authTokens.expiresAt, new Date()),
    ),
    columns: { userId: true },
  });
  return row?.userId ?? null;
}

export type ResetCodeResult = "ok" | "invalid" | "expired" | "too_many_attempts";

export async function consumeResetCode(userId: string, code: string): Promise<ResetCodeResult> {
  const row = await db.query.authTokens.findFirst({
    where: and(eq(authTokens.userId, userId), eq(authTokens.type, "PASSWORD_RESET"), isNull(authTokens.usedAt)),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });
  if (!row) return "invalid";
  if (row.expiresAt <= new Date()) return "expired";
  if (row.attempts >= MAX_CODE_ATTEMPTS) return "too_many_attempts";

  if (row.tokenHash !== hashToken(`${userId}:${code}`)) {
    await db.update(authTokens).set({ attempts: row.attempts + 1 }).where(eq(authTokens.id, row.id));
    return row.attempts + 1 >= MAX_CODE_ATTEMPTS ? "too_many_attempts" : "invalid";
  }

  const [consumed] = await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(authTokens.id, row.id), isNull(authTokens.usedAt)))
    .returning({ id: authTokens.id });
  return consumed ? "ok" : "invalid";
}
