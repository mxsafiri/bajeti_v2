import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    console.error('Critical Error: NEXT_PUBLIC_SUPABASE_URL is not set. This will cause authentication and data fetching to fail.');
    // In middleware, it's crucial to handle this.
    // Throwing an error will result in a 500 page, which is appropriate for a misconfiguration.
    throw new Error('Server configuration error: Supabase URL is missing. Please check environment variables.');
  }

  if (!supabaseAnonKey) {
    console.error('Critical Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. This will cause authentication and data fetching to fail.');
    throw new Error('Server configuration error: Supabase Anon Key is missing. Please check environment variables.');
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard')
  const isRootPage = request.nextUrl.pathname === '/'

  const { pathname } = request.nextUrl

  // Auth routes are public but redirect to dashboard if already authenticated
  if (pathname.startsWith('/auth')) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // Dashboard routes are protected
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/sign-in', request.url))
    }
    return response
  }

  // Allow access to all other routes (including root page) regardless of auth status

  return response
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/auth/:path*',
  ],
}
