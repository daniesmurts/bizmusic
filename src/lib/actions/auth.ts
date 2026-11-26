"use server";

import { cookies } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { legalAcceptanceEvents, referralAgents, users } from "@/db/schema";
import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/auth/password";
import { clearSession, createSession, getClientIp, getUserAgent } from "@/lib/auth/session";
import { clearAttempts, isRateLimited, recordAttempt } from "@/lib/auth/rate-limit";
import { consumeLinkToken, consumeResetCode, issueLinkToken, issueResetCode, peekLinkToken } from "@/lib/auth/tokens";
import { sendPasswordResetCode, sendVerificationEmail } from "@/lib/auth/emails";

const TERMS_VERSION = "2026-03-25";
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 15 * 60 * 1000;
const MIN = 60 * 1000;

export type AuthResult<T = undefined> =
  | ({ success: true } & (T extends undefined ? object : { data: T }))
  | { success: false; error: string; code?: "EMAIL_NOT_VERIFIED" | "RATE_LIMITED" };

function normalizeEmail(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function findUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: sql`lower(${users.email}) = ${email}`,
    columns: {
      id: true,
      email: true,
      role: true,
      passwordHash: true,
      emailVerifiedAt: true,
      disabledAt: true,
      sessionVersion: true,
    },
  });
}

// ─── Registration ────────────────────────────────────────────────────────────

export async function registerAction(input: {
  email: string;
  password: string;
  phone?: string;
  userType: "BUSINESS" | "CREATOR";
  agreed: boolean;
}): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  if (!isEmail(email)) return { success: false, error: "Введите корректный email." };
  if (!input.agreed) {
    return { success: false, error: "Пожалуйста, примите условия использования и политику конфиденциальности." };
  }
  const weak = validatePasswordStrength(input.password ?? "");
  if (weak) return { success: false, error: weak };

  const ip = await getClientIp();
  if (ip && (await isRateLimited(`register-ip:${ip}`, 10, 60 * MIN))) {
    return { success: false, error: "Слишком много регистраций с вашего адреса. Попробуйте через час.", code: "RATE_LIMITED" };
  }

  if (await findUserByEmail(email)) {
    return { success: false, error: "Пользователь с таким email уже зарегистрирован." };
  }

  // Referral attribution from /r/[code]
  const refCode = (await cookies()).get("bizmuzik_ref")?.value;
  const agent = refCode
    ? await db.query.referralAgents.findFirst({
        where: eq(referralAgents.referralCode, refCode),
        columns: { id: true, status: true },
      })
    : undefined;
  const referredBy = agent?.status === "active" ? agent.id : null;

  const now = new Date();
  const passwordHash = await hashPassword(input.password);
  const phone = input.phone?.trim() || null;

  let userId: string;
  try {
    userId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({
          email,
          passwordHash,
          role: "BUSINESS_OWNER",
          userType: input.userType === "CREATOR" ? "CREATOR" : "BUSINESS",
          phone,
          termsAccepted: true,
          termsAcceptedAt: now,
          referredByAgentId: referredBy,
          referralCodeUsed: referredBy ? refCode : null,
        })
        .returning({ id: users.id });

      await tx.insert(legalAcceptanceEvents).values({
        userId: created.id,
        acceptedAt: now,
        source: "registration",
        ipAddress: ip,
        userAgent: await getUserAgent(),
        termsVersion: TERMS_VERSION,
      });
      return created.id;
    });
  } catch (err) {
    // Unique violation from a concurrent registration
    if ((err as { code?: string })?.code === "23505") {
      return { success: false, error: "Пользователь с таким email уже зарегистрирован." };
    }
    throw err;
  }

  if (ip) await recordAttempt(`register-ip:${ip}`);

  const token = await issueLinkToken(userId, "EMAIL_VERIFY", VERIFY_TTL_MS);
  const sent = await sendVerificationEmail(email, token);
  if (!sent.success) {
    console.error("[auth] verification email failed:", sent.error);
    return { success: false, error: "Аккаунт создан, но письмо не отправилось. Нажмите «Отправить письмо ещё раз» на странице входа." };
  }

  return { success: true };
}

export async function resendVerificationAction(rawEmail: string): Promise<AuthResult> {
  const email = normalizeEmail(rawEmail);
  const generic: AuthResult = { success: true };
  if (!isEmail(email)) return generic;

  const key = `verify-resend:${email}`;
  if (await isRateLimited(key, 3, 60 * MIN)) {
    return { success: false, error: "Письмо уже отправлялось несколько раз. Попробуйте через час.", code: "RATE_LIMITED" };
  }
  await recordAttempt(key);

  const user = await findUserByEmail(email);
  if (!user || user.emailVerifiedAt || user.disabledAt) return generic;

  const token = await issueLinkToken(user.id, "EMAIL_VERIFY", VERIFY_TTL_MS);
  await sendVerificationEmail(user.email, token);
  return generic;
}

/** Used by /api/auth/verify-email. Returns true when a session was created. */
export async function verifyEmailToken(token: string): Promise<boolean> {
  const userId = await consumeLinkToken(token, "EMAIL_VERIFY");
  if (!userId) return false;

  const [user] = await db
    .update(users)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(users.id, userId))
    .returning({ id: users.id, role: users.role, sessionVersion: users.sessionVersion, disabledAt: users.disabledAt });
  if (!user || user.disabledAt) return false;

  await createSession(user);
  return true;
}

// ─── Login / logout ──────────────────────────────────────────────────────────

export async function loginAction(input: { email: string; password: string }): Promise<AuthResult<{ role: string }>> {
  const email = normalizeEmail(input.email);
  const invalid = { success: false as const, error: "Неверный email или пароль." };
  if (!isEmail(email) || !input.password) return invalid;

  const ip = await getClientIp();
  const emailKey = `login:${email}`;
  const ipKey = ip ? `login-ip:${ip}` : null;
  if ((await isRateLimited(emailKey, 10, 15 * MIN)) || (ipKey && (await isRateLimited(ipKey, 50, 15 * MIN)))) {
    return { success: false, error: "Слишком много попыток входа. Попробуйте через 15 минут.", code: "RATE_LIMITED" };
  }

  const user = await findUserByEmail(email);
  const ok = await verifyPassword(input.password, user?.passwordHash);
  if (!user || !ok) {
    await recordAttempt(emailKey);
    if (ipKey) await recordAttempt(ipKey);
    return invalid;
  }

  if (user.disabledAt) {
    return { success: false, error: "Аккаунт отключён. Обратитесь к владельцу бизнеса или в поддержку." };
  }
  if (!user.emailVerifiedAt) {
    return {
      success: false,
      error: "Подтвердите email: мы отправили ссылку при регистрации.",
      code: "EMAIL_NOT_VERIFIED",
    };
  }

  await clearAttempts(emailKey);
  await createSession(user);
  return { success: true, data: { role: user.role } };
}

export async function logoutAction(): Promise<void> {
  await clearSession();
}

// ─── Password reset (6-digit code) ───────────────────────────────────────────

export async function requestPasswordResetAction(rawEmail: string): Promise<AuthResult> {
  const email = normalizeEmail(rawEmail);
  if (!isEmail(email)) return { success: false, error: "Введите корректный email." };

  const ip = await getClientIp();
  const key = `reset-request:${email}`;
  if ((await isRateLimited(key, 5, 60 * MIN)) || (ip && (await isRateLimited(`reset-ip:${ip}`, 20, 60 * MIN)))) {
    return { success: false, error: "Слишком много запросов кода. Попробуйте через час.", code: "RATE_LIMITED" };
  }
  await recordAttempt(key);
  if (ip) await recordAttempt(`reset-ip:${ip}`);

  // Same response whether or not the account exists.
  const user = await findUserByEmail(email);
  if (user && !user.disabledAt) {
    const code = await issueResetCode(user.id, RESET_TTL_MS);
    const sent = await sendPasswordResetCode(user.email, code);
    if (!sent.success) console.error("[auth] reset email failed:", sent.error);
  }
  return { success: true };
}

export async function resetPasswordAction(input: { email: string; code: string; password: string }): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const weak = validatePasswordStrength(input.password ?? "");
  if (weak) return { success: false, error: weak };
  if (!/^\d{6}$/.test(input.code ?? "")) return { success: false, error: "Введите 6 цифр кода из письма." };

  const user = await findUserByEmail(email);
  if (!user || user.disabledAt) return { success: false, error: "Код устарел или неверен. Запросите новый." };

  const result = await consumeResetCode(user.id, input.code);
  if (result === "too_many_attempts") {
    return { success: false, error: "Слишком много неверных попыток. Запросите новый код." };
  }
  if (result !== "ok") return { success: false, error: "Код устарел или неверен. Запросите новый." };

  // Bump sessionVersion so sessions on other devices are logged out.
  const [updated] = await db
    .update(users)
    .set({
      passwordHash: await hashPassword(input.password),
      // The code arrived by email, so the address is proven.
      emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      sessionVersion: sql`${users.sessionVersion} + 1`,
    })
    .where(eq(users.id, user.id))
    .returning({ id: users.id, role: users.role, sessionVersion: users.sessionVersion });

  await clearAttempts(`login:${email}`);
  await createSession(updated);
  return { success: true };
}

// ─── Staff invites ───────────────────────────────────────────────────────────

export async function getInviteEmailAction(token: string): Promise<string | null> {
  if (!token) return null;
  const userId = await peekLinkToken(token, "INVITE");
  if (!userId) return null;
  const user = await db.query.users.findFirst({ where: eq(users.id, userId), columns: { email: true, disabledAt: true } });
  return user && !user.disabledAt ? user.email : null;
}

export async function acceptInviteAction(input: { token: string; password: string }): Promise<AuthResult> {
  const weak = validatePasswordStrength(input.password ?? "");
  if (weak) return { success: false, error: weak };

  const userId = await consumeLinkToken(input.token ?? "", "INVITE");
  if (!userId) return { success: false, error: "Приглашение недействительно или устарело. Попросите владельца отправить новое." };

  const [user] = await db
    .update(users)
    .set({
      passwordHash: await hashPassword(input.password),
      emailVerifiedAt: new Date(),
      termsAccepted: true,
      termsAcceptedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ id: users.id, role: users.role, sessionVersion: users.sessionVersion, disabledAt: users.disabledAt });

  if (!user || user.disabledAt) {
    return { success: false, error: "Аккаунт отключён. Обратитесь к владельцу бизнеса." };
  }

  await db.insert(legalAcceptanceEvents).values({
    userId: user.id,
    source: "staff_invite",
    ipAddress: await getClientIp(),
    userAgent: await getUserAgent(),
    termsVersion: TERMS_VERSION,
  });

  await createSession(user);
  return { success: true };
}
