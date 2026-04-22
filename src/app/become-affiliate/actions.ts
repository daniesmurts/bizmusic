"use server";

import { db } from "@/db";
import { referralAgents } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { generateUniqueReferralCode } from "@/lib/referral/code-generator";

export async function becomeAffiliateAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/register?next=/become-affiliate");
  }

  const existing = await db.query.referralAgents.findFirst({
    where: eq(referralAgents.userId, user.id),
    columns: { id: true },
  });
  if (existing) {
    redirect("/dashboard/affiliate");
  }

  const fullName = (formData.get("fullName") as string | null)?.trim() ?? "";
  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  const city = (formData.get("city") as string | null)?.trim() ?? "";

  if (!fullName || !phone || !city) {
    redirect("/become-affiliate?error=missing_fields");
  }

  const referralCode = await generateUniqueReferralCode(fullName);

  await db.insert(referralAgents).values({
    userId: user.id,
    referralCode,
    fullName,
    phone,
    city,
    status: "active",
    commissionRate: 0.30,
  });

  redirect("/dashboard/affiliate");
}
