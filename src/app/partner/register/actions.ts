"use server";

import { db } from "@/db";
import { users, referralAgents } from "@/db/schema";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { generateUniqueReferralCode } from "@/lib/referral/code-generator";

export async function partnerRegisterAction(formData: FormData) {
  const fullName = (formData.get("fullName") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const city = (formData.get("city") as string | null)?.trim() ?? "";

  if (!fullName || !email || !password || !phone || !city) {
    redirect("/partner/register?error=missing_fields");
  }

  if (password.length < 8) {
    redirect("/partner/register?error=password_too_short");
  }

  // Check if email is already registered
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true },
  });
  if (existingUser) {
    redirect("/partner/register?error=email_exists");
  }

  // Create Supabase auth user — email_confirm: true skips the confirmation email
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, is_partner: true },
  });

  if (authError || !authData.user) {
    console.error("[partner/register] createUser error:", authError);
    redirect("/partner/register?error=auth_failed");
  }

  const userId = authData.user.id;

  // Create user row with PARTNER role
  await db.insert(users).values({
    id: userId,
    email,
    passwordHash: "SUPABASE_AUTH",
    role: "PARTNER",
  });

  // Generate referral code and create agent record
  const referralCode = await generateUniqueReferralCode(fullName);
  await db.insert(referralAgents).values({
    userId,
    referralCode,
    fullName,
    phone,
    city,
    status: "active",
    commissionRate: 0.30,
  });

  // Sign in immediately so the user lands with an active session
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

  if (signInError) {
    console.error("[partner/register] signIn error:", signInError);
    redirect("/login?registered=partner");
  }

  redirect("/dashboard/affiliate");
}
