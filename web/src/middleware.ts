import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export default async function middleware(request: NextRequest) {
  try {
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
    }

    // Create a Supabase client configured to use cookies
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
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Get the current path
    const path = request.nextUrl.pathname
    console.log('[Middleware] Current path:', path)

    // Get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('[Middleware] Session state:', session ? 'Authenticated' : 'Not authenticated')
    
    // If there's a session error, clear cookies and redirect to sign in
    if (sessionError) {
      console.error('Session error:', sessionError)
      const response = NextResponse.redirect(new URL('/auth/sign-in', request.url))
      
      // Clear auth cookies
      response.cookies.set('sb-access-token', '', { 
        expires: new Date(0),
        path: '/' 
      })
      response.cookies.set('sb-refresh-token', '', { 
        expires: new Date(0),
        path: '/' 
      })
      
      return response
    }

    // If user is signed in and trying to access auth pages, redirect to dashboard
    if (session && path.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // If user is not signed in and trying to access protected pages, redirect to sign in
    if (!session && path.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/auth/sign-in', request.url))
    }
    console.log('Authenticated user accessing dashboard, allowing access')
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, redirect to sign in
    const response = NextResponse.redirect(new URL('/auth/sign-in', request.url))
    
    // Clear auth cookies on error
    response.cookies.set('sb-access-token', '', { 
      expires: new Date(0),
      path: '/' 
    })
    response.cookies.set('sb-refresh-token', '', { 
      expires: new Date(0),
      path: '/' 
    })
    
    return response
  }
}

export const config = {
  matcher: [
    '/auth/:path*',
    '/dashboard/:path*'
  ]
}
