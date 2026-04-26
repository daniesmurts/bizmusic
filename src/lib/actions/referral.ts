"use server";

import { createClient } from "@/utils/supabase/server";
import { db, resilient } from "@/db";
import { referralAgents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getReferralDataAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const agent = await resilient(() =>
      db.query.referralAgents.findFirst({
        where: eq(referralAgents.userId, user.id),
      })
    );

    if (!agent) {
      return { success: false, error: "No referral agent found" };
    }

    return {
      success: true,
      data: {
        referralCode: agent.referralCode,
        fullName: agent.fullName || user.user_metadata?.full_name || "Ваш менеджер",
      },
    };
  } catch (error) {
    console.error("Error in getReferralDataAction:", error);
    return { success: false, error: "Failed to fetch referral data" };
  }
}
