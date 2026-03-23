import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client (API routes, Server Components)
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Browser-side client ("use client" components)
export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}
