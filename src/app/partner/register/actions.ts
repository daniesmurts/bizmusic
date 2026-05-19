"use server";

import { db, resilient } from "@/db";
import { users, referralAgents } from "@/db/schema";
import { clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { generateUniqueReferralCode } from "@/lib/referral/code-generator";

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

  const client = await clerkClient();

  // Self-healing: check if a DB user already exists for this email
  const existingDbUser = await resilient(() =>
    db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
      columns: { id: true, role: true, clerkId: true },
    })
  );

  let clerkUserId: string;

  if (existingDbUser) {
    // Check if already a fully-provisioned partner
    const existingAgent = await resilient(() =>
      db.query.referralAgents.findFirst({
        where: eq(referralAgents.userId, existingDbUser.id),
        columns: { id: true },
      })
    );
    if (existingAgent) {
      redirect("/partner/register?error=email_exists");
    }

    // Orphan from a prior partial run — reuse the existing record
    console.log(`[partner/register] resuming partial registration for ${email}`);

    if (existingDbUser.clerkId) {
      clerkUserId = existingDbUser.clerkId;
      // Reset password in case they forgot it
      try {
        await client.users.updateUser(clerkUserId, { password });
      } catch (err) {
        console.error("[partner/register] failed to update password on resume:", err);
      }
    } else {
      // No Clerk account yet — create one
      try {
        const clerkUser = await client.users.createUser({
          emailAddress: [email],
          password,
          firstName: fullName.split(" ")[0],
          lastName: fullName.split(" ").slice(1).join(" ") || undefined,
          publicMetadata: { role: "PARTNER" },
          skipPasswordChecks: false,
        });
        clerkUserId = clerkUser.id;
        await db.update(users).set({ clerkId: clerkUserId }).where(eq(users.id, existingDbUser.id));
      } catch (err) {
        console.error("[partner/register] createUser error on resume:", err);
        redirect("/partner/register?error=auth_failed");
      }
    }
  } else {
    // Fresh registration
    let clerkUser;
    try {
      clerkUser = await client.users.createUser({
        emailAddress: [email],
        password,
        firstName: fullName.split(" ")[0],
        lastName: fullName.split(" ").slice(1).join(" ") || undefined,
        publicMetadata: { role: "PARTNER" },
        skipPasswordChecks: false,
      });
    } catch (err: unknown) {
      const errObj = err as { errors?: { code?: string }[] };
      const code = errObj?.errors?.[0]?.code;
      if (code === "form_identifier_exists") {
        redirect("/partner/register?error=email_exists");
      }
      console.error("[partner/register] createUser error:", err);
      redirect("/partner/register?error=auth_failed");
    }
    clerkUserId = clerkUser.id;

    // Insert DB user row
    try {
      await db.insert(users).values({
        clerkId: clerkUserId,
        email: email.toLowerCase(),
        passwordHash: "CLERK_AUTH",
        role: "PARTNER",
        userType: "BUSINESS",
        termsAccepted: false,
        updatedAt: new Date(),
      });
    } catch (err: unknown) {
      console.error("[partner/register] users insert failed:", err);
      // Roll back Clerk user
      await client.users.deleteUser(clerkUserId).catch((e) => {
        console.error("[partner/register] cleanup: failed to delete Clerk user:", e);
      });
      redirect("/partner/register?error=auth_failed");
    }
  }

  // Resolve internal DB user id
  const dbUser = await resilient(() =>
    db.query.users.findFirst({
      where: eq(users.clerkId, clerkUserId),
      columns: { id: true },
    })
  );

  if (!dbUser) {
    console.error("[partner/register] DB user not found after creation for clerkId:", clerkUserId);
    redirect("/partner/register?error=auth_failed");
  }

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

  redirect("/login?registered=partner");
}
