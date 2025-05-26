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

  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  // Debug logging
  console.log('Current path:', request.nextUrl.pathname)
  console.log('Session state:', session ? 'Authenticated' : 'Not authenticated')
  if (sessionError) {
    console.error('Session error:', sessionError)
    // On session error, redirect to sign-in
    return NextResponse.redirect(new URL('/auth/sign-in', request.url))
  }

  const { pathname } = request.nextUrl

  // Handle auth routes (sign-in, sign-up)
  if (pathname.startsWith('/auth')) {
    // If user is already authenticated, redirect to dashboard
    if (session) {
      console.log('Authenticated user trying to access auth page, redirecting to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // Otherwise, allow access to auth pages
    console.log('Unauthenticated user accessing auth page, allowing access')
    return response
  }

  // Handle dashboard routes
  if (pathname.startsWith('/dashboard')) {
    // If user is not authenticated, redirect to sign-in
    if (!session) {
      console.log('Unauthenticated user trying to access dashboard, redirecting to sign-in')
      return NextResponse.redirect(new URL('/auth/sign-in', request.url))
    }
    // Otherwise, allow access to dashboard
    console.log('Authenticated user accessing dashboard, allowing access')
    return response
  }

  // Allow access to all other routes (including root page) regardless of auth status
  console.log('Accessing public route:', pathname)
  return response
}

export const config = {
  matcher: [
    '/auth/:path*',
    '/dashboard/:path*'
  ]
}
