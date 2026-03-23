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
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
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

  // RBAC for /admin: strict check
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return redirectWithCookies('/login')
    }

    // Fetch user role from database
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (roleError || userData?.role !== 'ADMIN') {
      return redirectWithCookies('/dashboard')
    }
  }

  // Protected routes: redirect to login if not authenticated
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return redirectWithCookies('/login')
  }

  // Auth routes: redirect to dashboard if already authenticated
  // Note: /reset-password is excluded because the Supabase recovery flow
  // requires an active session to call updateUser({ password })
  const authRoutes = ['/login', '/register', '/forgot-password']
  if (authRoutes.some(route => request.nextUrl.pathname.startsWith(route)) && user) {
    return redirectWithCookies('/dashboard')
  }

  return response
}
