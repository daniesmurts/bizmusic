"use server";

import { createClient } from "@/utils/supabase/server";

export async function resetPasswordAction(password: string) {
  try {
    const supabase = await createClient();
    
    // Check if the user has a valid session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { 
        success: false, 
        error: "Сессия не найдена или истекла. Пожалуйста, запросите новую ссылку." 
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
    console.error("Reset password error:", error);
    return {
      success: false,
      error: message,
    };
  }
}
