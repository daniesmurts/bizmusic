import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { type EmailOtpType } from '@supabase/supabase-js'

/**
 * Handles Supabase email confirmation links that use token_hash format.
 * This route verifies the OTP token and then redirects appropriately.
 * 
 * URL format: /auth/confirm?token_hash=XXX&type=recovery&next=/reset-password
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  // Use NEXT_PUBLIC_SITE_URL to avoid Docker's internal 0.0.0.0:8080 origin
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bizmuzik.ru'

  if (token_hash && type) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options })
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`)
    }

    console.error('[auth/confirm] OTP verification failed:', error.message)
  }

  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`)
}
