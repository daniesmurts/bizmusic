import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set({ name, value })
          })

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Helper to create a redirect response preserving session cookies
  const redirectWithCookies = (pathname: string) => {
    const url = request.nextUrl.clone()
    url.pathname = pathname
    const redirectResponse = NextResponse.redirect(url)
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie)
    })
    return redirectResponse
  }

  // Fetch role once for all RBAC decisions (only when user is authenticated)
  let userRole: string | null = null
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = userData?.role ?? null
  }

  // RBAC for /admin: only ADMINs allowed
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) return redirectWithCookies('/login')
    if (userRole !== 'ADMIN') return redirectWithCookies('/dashboard')
  }

  // RBAC for /dashboard: must be authenticated
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return redirectWithCookies('/login')
  }

  // PARTNER isolation: partners may access /dashboard/affiliate and /dashboard/leads.
  // Any attempt to access other /dashboard/* routes sends them home.
  if (
    user &&
    userRole === 'PARTNER' &&
    request.nextUrl.pathname.startsWith('/dashboard') &&
    !request.nextUrl.pathname.startsWith('/dashboard/affiliate') &&
    !request.nextUrl.pathname.startsWith('/dashboard/leads')
  ) {
    return redirectWithCookies('/dashboard/affiliate')
  }

  // Auth routes: redirect already-authenticated users to their home
  // Note: /reset-password is excluded (Supabase recovery requires an active session)
  const authRoutes = ['/login', '/register', '/forgot-password']
  if (authRoutes.some(route => request.nextUrl.pathname.startsWith(route)) && user) {
    const home = userRole === 'PARTNER' ? '/dashboard/affiliate' : '/dashboard'
    return redirectWithCookies(home)
  }

  return response
}
