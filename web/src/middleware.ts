import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
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
        set(name: string, value: string, options: { path: string }) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: { path: string }) {
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

  // Auth routes are public
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

  // Root path redirects based on auth status
  if (pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  return response
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/auth/:path*',
  ],
}
