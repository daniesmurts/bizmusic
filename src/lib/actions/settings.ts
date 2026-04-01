"use server";

import { db } from "@/db";
import { businesses, payments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { normalizeBusinessLegalData, validateBusinessLegalData } from "@/lib/validation/business";

/**
 * Get current user's profile data
 */
export async function getUserProfileAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Not authenticated");
    
    // Get business data
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.userId, user.id),
    });
    
    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
        },
        business: business || null,
      },
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch profile";
    console.error("Get user profile error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Update user email
 */
export async function updateUserEmailAction(newEmail: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Not authenticated");
    
    if (!newEmail || !newEmail.includes("@")) {
      return { success: false, error: "Invalid email address" };
    }
    
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });
    
    if (error) throw error;
    
    revalidatePath("/dashboard/settings");
    
    return {
      success: true,
      message: "Email updated. Please check your new email for confirmation.",
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update email";
    console.error("Update email error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Update user password
 */
export async function updateUserPasswordAction(currentPassword: string, newPassword: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Not authenticated");
    
    if (!currentPassword) {
      return { success: false, error: "Введите текущий пароль" };
    }
    
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: "Пароль должен быть не менее 8 символов" };
    }
    
    // Verify current password by attempting sign-in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });
    
    if (signInError) {
      return { success: false, error: "Неверный текущий пароль" };
    }
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) throw error;
    
    return {
      success: true,
      message: "Пароль успешно обновлён",
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update password";
    console.error("Update password error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

export interface BusinessProfileInput {
  inn?: string;
  legalName?: string;
  address?: string;
  kpp?: string | null;
  phone?: string | null;
  contactPerson?: string | null;
  businessType?: string | null;
  businessCategory?: string | null;
  bankName?: string | null;
  bik?: string | null;
  settlementAccount?: string | null;
  corrAccount?: string | null;
}

/**
 * Update business profile
 */
export async function updateBusinessProfileAction(data: BusinessProfileInput) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Not authenticated");
    
    // Get existing business
    const existingBusiness = await db.query.businesses.findFirst({
      where: eq(businesses.userId, user.id),
      columns: { id: true }
    });
    
    const normalizedLegal = normalizeBusinessLegalData(data);
    const legalValidation = validateBusinessLegalData(normalizedLegal, {
      requireAll: !existingBusiness,
    });
    if (!legalValidation.isValid) {
      return { success: false, error: legalValidation.error || "Проверьте реквизиты компании" };
    }

    // Build partial update payload without overwriting required fields with empty strings.
    const businessData: Partial<typeof businesses.$inferInsert> = {
      userId: user.id,
      updatedAt: new Date(),
    };

    if (normalizedLegal.inn) businessData.inn = normalizedLegal.inn;
    if (normalizedLegal.legalName) businessData.legalName = normalizedLegal.legalName;
    if (normalizedLegal.address) businessData.address = normalizedLegal.address;
    if (data.kpp !== undefined) businessData.kpp = data.kpp?.trim() || null;
    if (data.phone !== undefined) businessData.phone = data.phone?.trim() || null;
    if (data.contactPerson !== undefined) businessData.contactPerson = data.contactPerson?.trim() || null;
    if (data.businessType !== undefined) businessData.businessType = data.businessType?.trim() || null;
    if (data.businessCategory !== undefined) businessData.businessCategory = data.businessCategory?.trim() || null;
    if (data.bankName !== undefined) businessData.bankName = data.bankName?.trim() || null;
    if (data.bik !== undefined) businessData.bik = data.bik?.trim() || null;
    if (data.settlementAccount !== undefined) businessData.settlementAccount = data.settlementAccount?.trim() || null;
    if (data.corrAccount !== undefined) businessData.corrAccount = data.corrAccount?.trim() || null;
    
    if (normalizedLegal.inn) {
      const innCheck = await db.query.businesses.findFirst({
        where: eq(businesses.inn, normalizedLegal.inn),
        columns: { id: true, userId: true }
      });
      if (innCheck && innCheck.userId !== user.id) {
        return { success: false, error: "Бизнес с таким ИНН уже зарегистрирован." };
      }
    }

    if (!existingBusiness) {
      // Create new business profile
      const [newBusiness] = await db.insert(businesses)
        .values(businessData as typeof businesses.$inferInsert)
        .returning();
      
      revalidatePath("/dashboard/settings");
      
      return {
        success: true,
        message: "Business profile created successfully",
        data: newBusiness,
      };
    }
    
    // Update existing business
    const [updatedBusiness] = await db.update(businesses)
      .set(businessData)
      .where(eq(businesses.id, existingBusiness.id))
      .returning();
    
    revalidatePath("/dashboard/settings");
    
    return {
      success: true,
      message: "Business profile updated successfully",
      data: updatedBusiness,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update business profile";
    console.error("Update business profile error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get user's payment history
 */
export async function getPaymentMethodsAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Not authenticated");

    // First find businessId
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.userId, user.id),
      columns: { id: true }
    });

    if (!business) return { success: true, data: [] };
    
    const paymentsList = await db.query.payments.findMany({
      where: eq(payments.businessId, business.id),
      orderBy: [desc(payments.createdAt)],
      limit: 10,
    });
    
    return {
      success: true,
      data: paymentsList || [],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch payment history";
    console.error("Get payment history error:", error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get user's subscription info
 */
export async function getSubscriptionInfoAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Not authenticated");
    
    const business = await db.query.businesses.findFirst({
      where: eq(businesses.userId, user.id),
      columns: {
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
        currentPlanSlug: true,
        trialEndsAt: true,
        rebillId: true,
      }
    });
    
    return {
      success: true,
      data: business || null,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch subscription info";
    console.error("Get subscription info error:", error);
    return {
      success: false,
      error: message,
    };
  }
}
