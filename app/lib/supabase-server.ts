// ─────────────────────────────────────────────────────────────────────────
//  Server-only Supabase client.
//
//  Phase 1: uses the service-role key — runs only in Server Components,
//  Route Handlers, and Server Actions. NEVER import this from a "use client"
//  file; Next.js will fail the build if you do, because the service-role
//  key would leak into the browser bundle.
//
//  Phase 2 will add a separate auth-aware client (`@supabase/ssr`,
//  cookie-bound) for per-user RLS-gated reads. The service-role client here
//  stays as the escape hatch for admin tasks.
// ─────────────────────────────────────────────────────────────────────────

import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing — set them in Vercel project env or .env.local',
    );
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
