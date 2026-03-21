"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

/**
 * Get current user's profile data
 */
export async function getUserProfileAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Not authenticated");
    
    // Get business data
    const { data: business } = await supabase
      .from("businesses")
      .select("*")
      .eq("userId", user.id)
      .single();
    
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
    
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" };
    }
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) throw error;
    
    return {
      success: true,
      message: "Password updated successfully",
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
    const { data: existingBusiness } = await supabase
      .from("businesses")
      .select("id")
      .eq("userId", user.id)
      .maybeSingle(); // Correctly handle 0 or 1
    
    // Basic fields
    const businessData: Record<string, string | null> = {
      userId: user.id,
      inn: data.inn || "",
      legalName: data.legalName || "",
      address: data.address || "",
      kpp: data.kpp || null,
      phone: data.phone || null,
      contactPerson: data.contactPerson || null,
      businessType: data.businessType || null,
      businessCategory: data.businessCategory || null,
      bankName: data.bankName || null,
      bik: data.bik || null,
      settlementAccount: data.settlementAccount || null,
      corrAccount: data.corrAccount || null,
    };
    
    if (!existingBusiness) {
      // Create new business profile
      const { data: newBusiness, error } = await supabase
        .from("businesses")
        .insert(businessData)
        .select()
        .single();
      
      if (error) throw error;
      
      revalidatePath("/dashboard/settings");
      
      return {
        success: true,
        message: "Business profile created successfully",
        data: newBusiness,
      };
    }
    
    // Update existing business
    const { data: updatedBusiness, error } = await supabase
      .from("businesses")
      .update(businessData)
      .eq("id", existingBusiness.id)
      .select()
      .single();
    
    if (error) throw error;
    
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
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("userId", user.id)
      .single();

    if (!business) return { success: true, data: [] };
    
    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("businessId", business.id)
      .order("createdAt", { ascending: false })
      .limit(10);
    
    return {
      success: true,
      data: payments || [],
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
    
    const { data: business } = await supabase
      .from("businesses")
      .select("subscriptionStatus, subscriptionExpiresAt, currentPlanSlug, trialEndsAt, rebillId")
      .eq("userId", user.id)
      .maybeSingle();
    
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
