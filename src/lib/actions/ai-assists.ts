"use server";

import { db } from "@/db";
import { businesses } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import {
  consumeAiAssistCredit,
  getBusinessAiEntitlementState,
  getAiEntitlementStatus,
} from "@/lib/ai-entitlements";
import { refineAnnouncementText } from "@/lib/groq-ai";
import { resolveAccessScope } from "@/lib/auth/scope";

export interface GenerateAiAssistInput {
  userDraft: string;
  locale?: "ru-RU";
}

/**
 * Generate AI-refined announcement text and consume credit
 */
export async function generateAiAssistAction(input: GenerateAiAssistInput) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const scope = await resolveAccessScope(user.id);
    if (scope?.isBranchManager) {
      return { success: false, error: "Менеджер филиала не может использовать ИИ-ассистирование" };
    }

    // Get business ID for the user
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.userId, user.id),
    });

    if (!business) {
      return { success: false, error: "Business not found for this user." };
    }

    // Validation
    if (input.userDraft.length === 0) {
      return { success: false, error: "Черновик объявления не должен быть пустым." };
    }

    if (input.userDraft.length > 500) {
      return { success: false, error: "Черновик объявления не должен превышать 500 символов." };
    }

    // Check entitlement
    const entitlement = await getAiEntitlementStatus(business.id);
    if (!entitlement.canAssist) {
      return { success: false, error: entitlement.denialReason || "Лимит помощи ИИ исчерпан." };
    }

    // 1. Call Groq to refine text
    const refinedText = await refineAnnouncementText(input.userDraft, input.locale || "ru-RU");

    // 2. Consume AI assist credit in transaction
    await db.transaction(async (tx) => {
      await consumeAiAssistCredit(tx, {
        businessId: business.id,
        provider: "groq",
        charsCount: refinedText.length,
      });
    });

    // 3. Get updated entitlement status
    const nextEntitlement = await getAiEntitlementStatus(business.id);

    return {
      success: true,
      data: {
        refinedText,
      },
      entitlement: nextEntitlement,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate AI assistance";
    console.error("AI assist generation error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get AI entitlement status for the current business
 */
export async function getAiAssistStatusAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const scope = await resolveAccessScope(user.id);
    if (scope?.isBranchManager) {
      return { success: false, error: "Недостаточно прав" };
    }

    const business = await db.query.businesses.findFirst({
      where: eq(businesses.userId, user.id),
      columns: { id: true },
    });

    if (!business) {
      return { success: false, error: "Business not found" };
    }

    const data = await getAiEntitlementStatus(business.id);
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load AI assist status";
    return { success: false, error: message };
  }
}
