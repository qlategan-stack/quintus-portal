// ─────────────────────────────────────────────────────────────────────────
//  Auth-aware Supabase client for server contexts.
//
//  Use in Server Components, Route Handlers, and Server Actions. Reads/writes
//  the session via Next 15's async cookies(). Pairs with RLS policies in
//  Phase 3 to gate per-user data.
//
//  Imports next/headers, so it MUST NOT be imported from a "use client"
//  module — that's why the browser client lives in supabase-auth-browser.ts.
// ─────────────────────────────────────────────────────────────────────────

import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing',
    );
  }
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component — middleware will refresh
          // the session on the next request, so swallowing this is safe.
        }
      },
    },
  });
}
