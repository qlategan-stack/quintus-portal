'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PaletteSwitcher from './PaletteSwitcher';
import FontSwitcher from './FontSwitcher';

type Tab = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
};

const tabs: Tab[] = [
  { href: '/',              label: 'General',                match: (p) => p === '/' },
  { href: '/tasks',         label: 'Tasks',                  match: (p) => p.startsWith('/tasks') },
  { href: '/webpages',      label: 'Webpages',               match: (p) => p.startsWith('/webpages') },
  { href: '/flowmatic',     label: 'Flowmatic',              match: (p) => p.startsWith('/flowmatic') },
  { href: '/international', label: 'International Projects', match: (p) => p.startsWith('/international') },
  { href: '/flowtrader',    label: 'FlowTrader',             match: (p) => p.startsWith('/flowtrader') },
  { href: '/notion',        label: 'Notion Sync',            match: (p) => p.startsWith('/notion') },
];

export default function TabNav() {
  const pathname = usePathname() || '/';

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
        </ul>
        <div className="switchers">
          <FontSwitcher />
          <PaletteSwitcher />
        </div>
      </div>
    </nav>
  );
}
