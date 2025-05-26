import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);

export function createClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
}
