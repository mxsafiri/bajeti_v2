import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export default async function middleware(request: NextRequest) {
  try {
    // Create a response to modify
    let response = NextResponse.next({
      request: {
        headers: request.headers,
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
        remove(name: string, options: any) {
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

  const { data: { session } } = await supabase.auth.getSession()

  // If user is signed in and the current path is / or /auth/*, redirect to /dashboard
  if (session && (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/auth'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If user is not signed in and the current path is /dashboard or any protected route
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url))
  }

  return response
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/auth/:path*'],
}
