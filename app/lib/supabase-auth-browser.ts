// ─────────────────────────────────────────────────────────────────────────
//  Auth-aware Supabase client for the browser.
//
//  Use in "use client" components — login form, sign-out button, anything
//  that needs to react to auth state in the browser. Bundles into the
//  client JS, so it MUST NOT touch next/headers, server-only modules, or
//  the service-role key.
// ─────────────────────────────────────────────────────────────────────────

import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing',
    );
  }
  return createBrowserClient(url, key);
}
