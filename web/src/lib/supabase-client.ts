import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single instance to be reused
const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

// Export the singleton instance
export { supabase };

// For consistency, keep the createClient function but return the same instance
export function createClient() {
  return supabase;
}
