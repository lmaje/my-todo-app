import { createClient } from '@supabase/supabase-js';
import { createServerClient as createSSRServerClient, createBrowserClient as createSSRBrowserClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Simple server client for API routes (no cookie auth needed for todos — uses anon key)
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// SSR server client with cookie-based auth (for Server Components + middleware)
export async function createAuthServerClient() {
  const cookieStore = await cookies();
  return createSSRServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component — can't set cookies, middleware handles refresh
        }
      },
    },
  });
}

// Browser client for "use client" components
export function createBrowserClient() {
  return createSSRBrowserClient(supabaseUrl, supabaseAnonKey);
}
