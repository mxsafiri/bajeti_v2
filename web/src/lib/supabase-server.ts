import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  // Get the cookies from the request
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // In Next.js App Router, we cannot set cookies on the server
          // except in Server Actions or Route Handlers
        },
        remove(name: string, options: any) {
          // In Next.js App Router, we cannot remove cookies on the server
          // except in Server Actions or Route Handlers
        },
      },
    }
  )
}
