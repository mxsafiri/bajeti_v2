import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export default async function middleware(request: NextRequest) {
  try {
    // Create a response to modify
    let response = NextResponse.next({
      request: {
        headers: request.headers
      }
    })

    // Create a Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: { expires?: Date; path?: string; domain?: string; secure?: boolean }) {
            response.cookies.set({
              name,
              value,
              ...options
            })
          },
          remove(name: string, options: { path?: string; domain?: string }) {
            response.cookies.delete(name)
          },
        },
      }
    )

    await supabase.auth.getSession()

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
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
