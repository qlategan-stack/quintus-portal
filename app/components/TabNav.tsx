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
  { href: '/webpages',      label: 'Quintus Organisations',  match: (p) => p.startsWith('/webpages') },
  { href: '/olympic',       label: 'Olympic Paints',         match: (p) => p.startsWith('/olympic') },
  { href: '/flowmatic',     label: 'Flowmatic',              match: (p) => p.startsWith('/flowmatic') },
  { href: '/flowtrader',    label: 'FlowTrader',             match: (p) => p.startsWith('/flowtrader') },
  { href: '/tradecraft',    label: 'TradeCraft',             match: (p) => p.startsWith('/tradecraft') },
  { href: '/jbay',          label: 'Jeffreys Bay',           match: (p) => p.startsWith('/jbay') },
  { href: '/timion',        label: 'Timion NPC',             match: (p) => p.startsWith('/timion') },
  { href: '/mcaa',          label: 'MCAA',                   match: (p) => p.startsWith('/mcaa') },
  { href: '/international', label: 'International Projects', match: (p) => p.startsWith('/international') },
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
