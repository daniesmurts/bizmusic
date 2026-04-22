"use server";

import { db, resilient } from "@/db";
import { users, referralAgents } from "@/db/schema";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { generateUniqueReferralCode } from "@/lib/referral/code-generator";

// Create a fresh admin client per invocation — avoids stale TLS connections
// from a module-level singleton (which can cause ECONNRESET in dev).
function makeAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

function isRetryableAdminError(err: any): boolean {
  // Thrown network errors
  if (err?.code === "ECONNRESET" || err?.code === "ECONNREFUSED") return true;
  if (err?.cause?.code === "ECONNRESET" || err?.cause?.code === "ECONNREFUSED") return true;
  if (err?.message?.includes("fetch failed")) return true;
  // Supabase SDK swallows fetch errors and returns them as { error: AuthRetryableFetchError }
  // with status 0. When re-thrown from inside the fn() wrapper, detect them here too.
  if (err?.__isAuthError && err?.status === 0) return true;
  return false;
}

// Retry a Supabase Admin API call up to `attempts` times on network errors.
// NOTE: The Supabase SDK often RETURNS network errors (status=0) instead of throwing them.
// Callers must re-throw those before passing to this helper.
async function withAdminRetry<T>(
  fn: () => Promise<T>,
  attempts = 3
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      if (!isRetryableAdminError(err) || i === attempts - 1) throw err;
      console.warn(`[partner/register] network error on attempt ${i + 1}, retrying…`);
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw lastErr;
}

export async function partnerRegisterAction(formData: FormData) {
  const fullName = (formData.get("fullName") as string | null)?.trim() ?? "";
  const email    = (formData.get("email")    as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const phone    = (formData.get("phone")    as string | null)?.trim() ?? "";
  const city     = (formData.get("city")     as string | null)?.trim() ?? "";

  if (!fullName || !email || !password || !phone || !city) {
    redirect("/partner/register?error=missing_fields");
  }

  if (password.length < 8) {
    redirect("/partner/register?error=password_too_short");
  }

  // Self-healing pre-flight: the registration flow creates three things in order —
  //   (1) Supabase auth user   (2) public.users row   (3) referral_agents row
  // If a previous attempt died between (1)/(2) and (3) — network drop, timeout,
  // user closing the tab — the email will "already exist" even though the
  // partner isn't really registered. Rather than bailing with email_exists,
  // detect that case and resume the flow from wherever it stopped.
  const existingUser = await resilient(() =>
    db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true, role: true },
    })
  );

  let userId: string;
  // Track whether WE created the auth user in this invocation. On resume we
  // must never roll back records that pre-existed — otherwise a transient
  // error downstream would destroy the user we were trying to recover.
  let createdAuthUser = false;
  const admin = makeAdminClient();

  if (existingUser) {
    // Is this already a fully-provisioned partner?
    const existingAgent = await resilient(() =>
      db.query.referralAgents.findFirst({
        where: eq(referralAgents.userId, existingUser.id),
        columns: { id: true },
      })
    );
    if (existingAgent) {
      // Genuine duplicate — they're already registered; send them to log in.
      redirect("/partner/register?error=email_exists");
    }
    // Orphan row from a prior partial run — reuse the user id and resume.
    // Refresh the auth password to whatever the user just typed, so the
    // sign-in at the end of this flow works regardless of what the original
    // (failed) attempt set.
    console.log(`[partner/register] resuming partial registration for ${email} (user ${existingUser.id})`);
    userId = existingUser.id;
    try {
      await admin.auth.admin.updateUserById(userId, { password });
    } catch (err) {
      console.error("[partner/register] failed to refresh password on resume:", err);
      // Non-fatal — if the old password still works they'll sign in; otherwise
      // they'll be sent to /login?registered=partner by the sign-in fallback.
    }
  } else {
    // Fresh registration — create the Supabase auth user.
    // The Supabase Admin SDK catches fetch failures internally and returns them as
    // { data: null, error: AuthRetryableFetchError } with status=0 instead of throwing.
    // We re-throw those so withAdminRetry's retry loop can handle them.
    let authResult: Awaited<ReturnType<typeof admin.auth.admin.createUser>>;
    try {
      authResult = await withAdminRetry(async () => {
        const result = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName, is_partner: true },
        });
        // Re-throw SDK-wrapped network errors so the retry loop sees them
        if (result.error && (result.error as any).__isAuthError && result.error.status === 0) {
          throw result.error;
        }
        return result;
      });
    } catch (err) {
      console.error("[partner/register] createUser network error:", err);
      redirect("/partner/register?error=auth_failed");
    }

    const { data: authData, error: authError } = authResult!;

    // Opposite orphan case: auth user exists but public.users write never landed.
    // Look the user up in auth and resume with their id.
    if (authError && /already been registered|already exists|already_registered/i.test(authError.message)) {
      console.log(`[partner/register] auth user exists but no DB row — resuming for ${email}`);
      const { data: list, error: listErr } = await admin.auth.admin.listUsers();
      if (listErr || !list) {
        console.error("[partner/register] listUsers failed while recovering:", listErr);
        redirect("/partner/register?error=auth_failed");
      }
      const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!existing) {
        console.error("[partner/register] auth says email exists but listUsers can't find it");
        redirect("/partner/register?error=auth_failed");
      }
      userId = existing.id;
    } else if (authError || !authData?.user) {
      console.error("[partner/register] createUser error:", authError);
      redirect("/partner/register?error=auth_failed");
    } else {
      userId = authData.user.id;
      createdAuthUser = true;
    }
  }

  // Upsert public.users row — check by PK first so we never rely on
  // ON CONFLICT (which Turbopack can cache-away in dev).
  try {
    const existingByPk = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingByPk.length === 0) {
      await db.insert(users).values({
        id: userId,
        email,
        passwordHash: "SUPABASE_AUTH",
        role: "PARTNER",
        userType: "BUSINESS",
        termsAccepted: false,
        updatedAt: new Date(),
      });
    } else if (existingByPk[0].role !== "PARTNER") {
      // Row exists but from a failed earlier attempt with the wrong role — fix it
      await db.update(users)
        .set({ role: "PARTNER", updatedAt: new Date() })
        .where(eq(users.id, userId));
    }
  } catch (err: any) {
    const pgMsg    = err?.cause?.message ?? err?.message ?? String(err);
    const pgCode   = err?.cause?.code    ?? err?.code    ?? "?";
    const pgDetail = err?.cause?.detail  ?? "";
    console.error(
      `[partner/register] users upsert failed — code=${pgCode}: ${pgMsg}` +
      (pgDetail ? ` | detail: ${pgDetail}` : "")
    );
    // Only roll back the auth user if WE created it in this run.
    if (createdAuthUser) {
      await admin.auth.admin.deleteUser(userId).catch(() => {});
    }
    redirect("/partner/register?error=auth_failed");
  }

  // Create referral_agents row only if one doesn't already exist.
  try {
    const existingAgent = await db
      .select({ id: referralAgents.id })
      .from(referralAgents)
      .where(eq(referralAgents.userId, userId))
      .limit(1);

    if (existingAgent.length === 0) {
      const referralCode = await generateUniqueReferralCode(fullName);
      await db.insert(referralAgents).values({
        userId,
        referralCode,
        fullName,
        phone,
        city,
        status: "active",
        commissionRate: 0.3,
      });
    }
  } catch (err: any) {
    console.error("[partner/register] referralAgents upsert failed:", err?.message ?? err);
    // Only roll back the user rows if WE created the auth user in this run.
    // On resume, the public.users row / auth user pre-existed — deleting them
    // would destroy what we were trying to recover.
    if (createdAuthUser) {
      await db.delete(users).where(eq(users.id, userId)).catch(() => {});
      await admin.auth.admin.deleteUser(userId).catch(() => {});
    }
    redirect("/partner/register?error=auth_failed");
  }

  // Sign in immediately so the user lands with an active session.
  // signInWithPassword also swallows network errors into result.error (status=0),
  // so retry up to 3× the same way.
  const supabase = await createClient();
  let signInError: any = null;
  for (let i = 0; i < 3; i++) {
    const result = await supabase.auth.signInWithPassword({ email, password });
    signInError = result.error;
    if (!signInError) break;
    const retryable = (signInError as any)?.__isAuthError && signInError.status === 0;
    if (!retryable) break;
    console.warn(`[partner/register] signIn network error on attempt ${i + 1}, retrying…`);
    await new Promise((r) => setTimeout(r, 600 * (i + 1)));
  }

  if (signInError) {
    console.error("[partner/register] signIn error:", signInError);
    redirect("/login?registered=partner");
  }

  redirect("/dashboard/affiliate");
}
