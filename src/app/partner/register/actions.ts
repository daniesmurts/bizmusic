"use server";

import { db, resilient } from "@/db";
import { users, referralAgents } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { generateUniqueReferralCode } from "@/lib/referral/code-generator";
import { hashPassword } from "@/lib/auth/password";
import { issueLinkToken } from "@/lib/auth/tokens";
import { sendVerificationEmail } from "@/lib/auth/emails";

export async function partnerRegisterAction(formData: FormData) {
  const fullName = (formData.get("fullName") as string | null)?.trim() ?? "";
  const email    = (formData.get("email")    as string | null)?.trim().toLowerCase() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const phone    = (formData.get("phone")    as string | null)?.trim() ?? "";
  const city     = (formData.get("city")     as string | null)?.trim() ?? "";

  if (!fullName || !email || !password || !phone || !city) {
    redirect("/partner/register?error=missing_fields");
  }

  if (password.length < 8) {
    redirect("/partner/register?error=password_too_short");
  }

  // Self-healing: an earlier run may have created the user but not the agent row.
  const existingDbUser = await resilient(() =>
    db.query.users.findFirst({
      where: sql`lower(${users.email}) = ${email}`,
      columns: { id: true, role: true, emailVerifiedAt: true },
    })
  );

  let dbUserId: string;

  if (existingDbUser) {
    const existingAgent = await resilient(() =>
      db.query.referralAgents.findFirst({
        where: eq(referralAgents.userId, existingDbUser.id),
        columns: { id: true },
      })
    );
    // Only resume an unverified partial partner registration; never take over a live account.
    if (existingAgent || existingDbUser.role !== "PARTNER" || existingDbUser.emailVerifiedAt) {
      redirect("/partner/register?error=email_exists");
    }
    console.log(`[partner/register] resuming partial registration for ${email}`);
    await db
      .update(users)
      .set({ passwordHash: await hashPassword(password) })
      .where(eq(users.id, existingDbUser.id));
    dbUserId = existingDbUser.id;
  } else {
    try {
      const [created] = await db.insert(users).values({
        email,
        passwordHash: await hashPassword(password),
        role: "PARTNER",
        userType: "BUSINESS",
        termsAccepted: false,
      }).returning({ id: users.id });
      dbUserId = created.id;
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === "23505") {
        redirect("/partner/register?error=email_exists");
      }
      console.error("[partner/register] users insert failed:", err);
      redirect("/partner/register?error=auth_failed");
    }
  }

  const dbUser = { id: dbUserId };

  // Create referral_agents row if it doesn't exist yet
  try {
    const existing = await db.select({ id: referralAgents.id })
      .from(referralAgents)
      .where(eq(referralAgents.userId, dbUser!.id))
      .limit(1);

    if (existing.length === 0) {
      const referralCode = await generateUniqueReferralCode(fullName);
      await db.insert(referralAgents).values({
        userId: dbUser!.id,
        referralCode,
        fullName,
        phone,
        city,
        status: "active",
        commissionRate: 0.3,
      });
    }
  } catch (err) {
    console.error("[partner/register] referralAgents insert failed:", err);
    redirect("/partner/register?error=auth_failed");
  }

  const token = await issueLinkToken(dbUserId, "EMAIL_VERIFY", 24 * 60 * 60 * 1000);
  const sent = await sendVerificationEmail(email, token);
  if (!sent.success) console.error("[partner/register] verification email failed:", sent.error);

  redirect("/login?registered=partner");
}
