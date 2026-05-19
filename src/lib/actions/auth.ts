"use server";

/**
 * Password reset is handled by Clerk's built-in flows.
 * This stub preserves the action signature for backward compatibility
 * but instructs the user to use Clerk's password reset flow instead.
 */
export async function resetPasswordAction(_password: string) {
  return {
    success: false,
    error: "Смена пароля выполняется через Clerk. Воспользуйтесь ссылкой «Забыли пароль» на странице входа.",
  };
}
