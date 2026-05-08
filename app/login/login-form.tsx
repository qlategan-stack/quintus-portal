'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/app/lib/supabase-auth-browser';

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; email: string }
  | { kind: 'error'; message: string };

export default function LoginForm() {
  const search = useSearchParams();
  const next = search.get('next') ?? '/';
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus({ kind: 'sending' });
    const supabase = createSupabaseBrowserClient();
    const callback = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callback },
    });
    if (error) {
      setStatus({ kind: 'error', message: error.message });
      return;
    }
    setStatus({ kind: 'sent', email: email.trim() });
  }

  if (status.kind === 'sent') {
    return (
      <section className="placeholder">
        <p>
          Check <strong>{status.email}</strong> for a magic link. The link
          opens this page back up, signed in.
        </p>
        <p style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={() => setStatus({ kind: 'idle' })}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
              font: 'inherit',
            }}
          >
            Send to a different email
          </button>
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} className="placeholder">
      <label
        htmlFor="email"
        className="kicker"
        style={{ display: 'block', marginBottom: 8 }}
      >
        Email
      </label>
      <input
        id="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        disabled={status.kind === 'sending'}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: 16,
          border: '1px solid currentColor',
          borderRadius: 6,
          background: 'transparent',
          color: 'inherit',
          marginBottom: 12,
        }}
      />
      <button
        type="submit"
        disabled={status.kind === 'sending'}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: 16,
          fontWeight: 600,
          borderRadius: 6,
          border: '1px solid currentColor',
          background: 'currentColor',
          color: 'transparent',
          cursor: 'pointer',
        }}
      >
        <span style={{ color: 'var(--bg, #fff)', mixBlendMode: 'difference' }}>
          {status.kind === 'sending' ? 'Sending…' : 'Send magic link'}
        </span>
      </button>
      {status.kind === 'error' && (
        <p style={{ marginTop: 12, color: 'crimson' }}>{status.message}</p>
      )}
    </form>
  );
}
