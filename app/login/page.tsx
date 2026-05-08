import { Suspense } from 'react';
import LoginForm from './login-form';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <main className="page" style={{ maxWidth: 480, margin: '8vh auto' }}>
      <header className="hdr">
        <div>
          <div className="kicker">Quintus Portal</div>
          <h1>Sign in</h1>
          <div className="sub">Magic link by email — no password.</div>
        </div>
      </header>

      <Suspense fallback={<section className="placeholder"><p>Loading…</p></section>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
