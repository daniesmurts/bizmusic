import { NextResponse } from "next/server";

// Supabase OTP confirm route — superseded by Clerk auth.
// Redirect to login; Clerk handles email verification natively.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next") ?? "/dashboard";
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bizmuzik.ru";
  return NextResponse.redirect(`${baseUrl}${next}`);
}
