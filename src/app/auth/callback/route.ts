import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { syncUserAndLegalAcceptance } from '@/lib/legal-acceptance'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  // Use NEXT_PUBLIC_SITE_URL to avoid Docker's internal 0.0.0.0:8080 origin
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bizmuzik.ru'

  if (code) {
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
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: userData } = await supabase.auth.getUser()
      const authUser = userData.user
      const ipHeader = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      const ipAddress = ipHeader?.split(',')[0]?.trim()
      const userAgent = request.headers.get('user-agent') || undefined

      if (authUser?.id && authUser.email) {
        await syncUserAndLegalAcceptance({
          userId: authUser.id,
          email: authUser.email,
          metadata: authUser.user_metadata as Record<string, unknown>,
          source: 'auth_callback',
          ipAddress,
          userAgent,
        })
      }

      return NextResponse.redirect(`${baseUrl}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${baseUrl}/auth/auth-code-error`)
}
