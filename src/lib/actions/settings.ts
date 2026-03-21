"use server";

import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Helper to get Supabase client with user context
async function getSupabaseClient() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Get user from auth cookie
  const authToken = cookieStore.get("sb-auth-token")?.value;
  if (authToken) {
    const { data: { user } } = await supabase.auth.getUser(authToken);
    if (user) {
      return { supabase, user };
    }
  }
  
  throw new Error("Not authenticated");
}

export interface UserProfileUpdate {
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface BusinessProfileUpdate {
  legalName?: string;
  inn?: string;
  kpp?: string;
  address?: string;
  phone?: string;
  contactPerson?: string;
  businessType?: string;
  businessCategory?: string;
  bankName?: string;
  bik?: string;
  settlementAccount?: string;
  corrAccount?: string;
}

/**
 * Get current user's profile data
 */
export async function getUserProfileAction() {
  try {
    const { supabase, user } = await getSupabaseClient();
    
    // Get business data
    const { data: business } = await supabase
      .from("businesses")
      .select("*")
      .eq("user_id", user.id)
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
  } catch (error: any) {
    console.error("Get user profile error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch profile",
    };
  }
}

/**
 * Update user email
 */
export async function updateUserEmailAction(newEmail: string) {
  try {
    const { supabase, user } = await getSupabaseClient();
    
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
  } catch (error: any) {
    console.error("Update email error:", error);
    return {
      success: false,
      error: error.message || "Failed to update email",
    };
  }
}

/**
 * Update user password
 */
export async function updateUserPasswordAction(currentPassword: string, newPassword: string) {
  try {
    const { supabase } = await getSupabaseClient();
    
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" };
    }
    
    // Note: Supabase doesn't provide a way to verify current password
    // We'll just update to new password (user must be logged in)
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) throw error;
    
    return {
      success: true,
      message: "Password updated successfully",
    };
  } catch (error: any) {
    console.error("Update password error:", error);
    return {
      success: false,
      error: error.message || "Failed to update password",
    };
  }
}

/**
 * Update business profile
 */
export async function updateBusinessProfileAction(data: BusinessProfileUpdate) {
  try {
    const { supabase, user } = await getSupabaseClient();
    
    // Get existing business
    const { data: existingBusiness } = await supabase
      .from("businesses")
      .select("id")
      .eq("user_id", user.id)
      .single();
    
    if (!existingBusiness) {
      // Create new business profile
      const insertData: any = {
        user_id: user.id,
        inn: data.inn || "",
        legal_name: data.legalName || "",
        address: data.address || "",
      };
      
      if (data.kpp) insertData.kpp = data.kpp;
      if (data.phone) insertData.phone = data.phone;
      if (data.contactPerson) insertData.contact_person = data.contactPerson;
      if (data.businessType) insertData.business_type = data.businessType;
      if (data.businessCategory) insertData.business_category = data.businessCategory;
      if (data.bankName) insertData.bank_name = data.bankName;
      if (data.bik) insertData.bik = data.bik;
      if (data.settlementAccount) insertData.settlement_account = data.settlementAccount;
      if (data.corrAccount) insertData.corr_account = data.corrAccount;
      
      const { data: newBusiness, error } = await supabase
        .from("businesses")
        .insert(insertData)
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
    const updateData: any = {};
    if (data.inn !== undefined) updateData.inn = data.inn;
    if (data.legalName !== undefined) updateData.legal_name = data.legalName;
    if (data.kpp !== undefined) updateData.kpp = data.kpp;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.contactPerson !== undefined) updateData.contact_person = data.contactPerson;
    if (data.businessType !== undefined) updateData.business_type = data.businessType;
    if (data.businessCategory !== undefined) updateData.business_category = data.businessCategory;
    if (data.bankName !== undefined) updateData.bank_name = data.bankName;
    if (data.bik !== undefined) updateData.bik = data.bik;
    if (data.settlementAccount !== undefined) updateData.settlement_account = data.settlementAccount;
    if (data.corrAccount !== undefined) updateData.corr_account = data.corrAccount;
    
    const { data: updatedBusiness, error } = await supabase
      .from("businesses")
      .update(updateData)
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
  } catch (error: any) {
    console.error("Update business profile error:", error);
    return {
      success: false,
      error: error.message || "Failed to update business profile",
    };
  }
}

/**
 * Get user's payment methods
 */
export async function getPaymentMethodsAction() {
  try {
    const { supabase, user } = await getSupabaseClient();
    
    const { data: payments } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    
    return {
      success: true,
      data: payments || [],
    };
  } catch (error: any) {
    console.error("Get payment methods error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch payment methods",
    };
  }
}

/**
 * Get user's subscription info
 */
export async function getSubscriptionInfoAction() {
  try {
    const { supabase, user } = await getSupabaseClient();
    
    const { data: business } = await supabase
      .from("businesses")
      .select("subscription_status, subscription_expires_at, current_plan_slug, trial_ends_at, rebill_id")
      .eq("user_id", user.id)
      .single();
    
    return {
      success: true,
      data: business || null,
    };
  } catch (error: any) {
    console.error("Get subscription info error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch subscription info",
    };
  }
}
