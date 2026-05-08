'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/app/lib/supabase-auth-browser';

type Tab = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
};

const tabs: Tab[] = [
  { href: '/',              label: 'General',                match: (p) => p === '/' },
  { href: '/webpages',      label: 'Webpages',               match: (p) => p.startsWith('/webpages') },
  { href: '/flowmatic',     label: 'Flowmatic',              match: (p) => p.startsWith('/flowmatic') },
  { href: '/international', label: 'International Projects', match: (p) => p.startsWith('/international') },
  { href: '/flowtrader',    label: 'FlowTrader',             match: (p) => p.startsWith('/flowtrader') },
  { href: '/notion',        label: 'Notion',                 match: (p) => p.startsWith('/notion') },
];

export default function TabNav() {
  const pathname = usePathname() || '/';
  const router = useRouter();

  // Hide the nav on the auth routes — the user isn't signed in there.
  if (pathname === '/login' || pathname.startsWith('/auth/')) {
    return null;
  }

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <nav className="tabs" aria-label="Primary">
      <div className="tabs-inner">
        <Link href="/" className="tabs-brand" aria-label="Quintus Portal home">
          <span className="tabs-brand-mark">QP</span>
          <span className="tabs-brand-name">Quintus Portal</span>
        </Link>
        <ul className="tabs-list">
          {tabs.map((t) => {
            const active = t.match(pathname);
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className={`tab ${active ? 'is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  {t.label}
                </Link>
              </li>
            );
          })}
          <li style={{ marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={signOut}
              className="tab"
              style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
              aria-label="Sign out"
            >
              Sign out
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
