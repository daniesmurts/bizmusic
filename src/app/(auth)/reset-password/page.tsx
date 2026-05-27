/**
 * The reset-password flow is now handled entirely on /forgot-password in a
 * two-step single-page flow. This redirect ensures that any direct links to
 * /reset-password still land in the right place.
 */
import { redirect } from "next/navigation";

export default function ResetPasswordRedirect() {
  redirect("/forgot-password");
}
