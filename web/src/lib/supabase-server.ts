import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: { expires?: Date; path?: string; domain?: string; secure?: boolean }) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie setting error
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: { path?: string; domain?: string }) {
          try {
            cookieStore.delete({ name, ...options })
          } catch (error) {
            // Handle cookie deletion error
            console.error('Error deleting cookie:', error)
          }
        },
      },
    }
  )
}
