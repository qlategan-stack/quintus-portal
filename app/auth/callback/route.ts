// ─────────────────────────────────────────────────────────────────────────
//  Magic-link callback.
//
//  Supabase's email contains a link like:
//    https://<supabase-url>/auth/v1/verify?token=...&redirect_to=<this-url>
//  Supabase redirects the browser here with ?code=... after verifying the
//  token. We exchange the code for a session cookie via the SSR helper and
//  send the user on to ?next= (default /).
// ─────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/app/lib/supabase-auth-server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const redirectTo = next.startsWith('/') ? next : '/';
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(`${origin}/auth/error?message=missing-code`);
}
