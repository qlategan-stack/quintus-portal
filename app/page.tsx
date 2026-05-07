import Link from 'next/link';

type VentureStatus = 'live' | 'building' | 'planning';

const ventures: Array<{
  code: string;
  name: string;
  role: string;
  headcount: string;
  surface: string;
  status: VentureStatus;
  notes: string;
}> = [
  {
    code: 'OLY',
    name: 'Olympic Paints',
    role: 'Paint manufacturer · Limpopo, SA',
    headcount: '74 Olympic + 28 Primeserve',
    surface: 'Ops · Sales · HR · Supply Chain',
    status: 'live',
    notes: 'KPI dashboard live. HAVEN clocking pipeline running. Two legal entities, one workforce.',
  },
  {
    code: 'FLW',
    name: 'Flowmatic',
    role: 'Automation studio',
    headcount: '—',
    surface: 'n8n · Make · GitHub Actions · Claude',
    status: 'building',
    notes: 'The engine room. Every other venture runs through here eventually.',
  },
  {
    code: 'TRD',
    name: 'TradeCraft',
    role: 'Trading & systems venture',
    headcount: '—',
    surface: 'Strategy / Execution',
    status: 'building',
    notes: 'Long-game. Building the discipline scaffolding first.',
  },
  {
    code: 'WHT',
    name: 'White Store',
    role: 'Retail concept',
    headcount: '—',
    surface: 'Storefront / Inventory',
    status: 'planning',
    notes: 'Concept stage. No infra yet — keep simple until the thesis is real.',
  },
  {
    code: 'FT',
    name: 'Flow Trader',
    role: 'Algo / discretionary trading',
    headcount: '—',
    surface: 'Markets / Capital',
    status: 'building',
    notes: 'Compounding focus. Outputs feed back into TradeCraft when systematised.',
  },
];

const dashboards: Array<{ label: string; href: string; external: boolean; note: string }> = [
  {
    label: 'KPI Sales — Weekly',
    href: 'https://flomaticauto.github.io/olympic-paints-kpi/',
    external: true,
    note: 'MTD · Reps · Debtors · YoY · Rock-bottom',
  },
  {
    label: 'HAVEN HR — Clocking',
    href: 'https://flomaticauto.github.io/olympic-paints-clocking/',
    external: true,
    note: 'Daily attendance · Departments · Missed clock-outs',
  },
  {
    label: 'Daily Journal',
    href: '/journal',
    external: false,
    note: 'Big idea · Concepts · Actions · Reflection',
  },
];

const queue: Array<{ p: string; t: string }> = [
  { p: '🔴', t: 'Portal sitemap — every venture, every script, every dashboard' },
  { p: '🔴', t: 'Notion audit — what exists, what is missing, what to delete' },
  { p: '🟡', t: 'Build one action button end-to-end (POC)' },
  { p: '🟡', t: 'Gmail signature template with first action button' },
  { p: '🟢', t: '20 min movement' },
  { p: '🟢', t: 'Eat one real meal — no screen' },
  { p: '🔵', t: 'Mindset: infrastructure compounds. Today’s grind = tomorrow’s leverage.' },
];

const infra: string[] = [
  'Clocking pipeline · Advius export → build_report.py → Clocking Report YTD.xlsx → gen_dashboard.py → Pages',
  'KPI pipeline · Weekly PDFs → manual data block → build_kpi_dashboard.py → Pages',
  'Notifications · Stop hook → Telegram chat 8042233389',
  'Storage · PARA tree under OneDrive\\1.Projects (Inbox · Projects · Areas · Resources)',
  'Email · Outlook win32com from process_inbox.py → accounts@ + quintusl@olympicpaints.co.za',
];

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

export default function Home() {
  const now = new Date();
  const iso = now.toISOString().slice(0, 10);
  const day = dayOfYear(now);

  return (
    <main className="page">
      <header className="hdr">
        <div>
          <div className="kicker">Command · {iso} · Day {day} of 365</div>
          <h1>Quintus Portal</h1>
          <div className="sub">&ldquo;The Portal Vision &amp; The May Push&rdquo;</div>
        </div>
        <div className="hdr-actions">
          <Link className="pill" href="/journal">Today&rsquo;s Journal →</Link>
        </div>
      </header>

      <section>
        <h2 className="section-h">Ventures</h2>
        <div className="grid">
          {ventures.map((v) => (
            <article key={v.code} className="venture">
              <div className="venture-head">
                <span className="code">{v.code}</span>
                <span className={`status ${v.status}`}>{v.status}</span>
              </div>
              <h3>{v.name}</h3>
              <div className="role">{v.role}</div>
              <div className="meta-row">
                <span className="label">Headcount</span>
                <span>{v.headcount}</span>
              </div>
              <div className="meta-row">
                <span className="label">Surface</span>
                <span>{v.surface}</span>
              </div>
              <p className="notes">{v.notes}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="two-col">
        <div>
          <h2 className="section-h">Live Dashboards</h2>
          <ul className="links">
            {dashboards.map((d) => (
              <li key={d.label}>
                {d.external ? (
                  <a href={d.href} target="_blank" rel="noopener noreferrer">
                    {d.label} ↗
                  </a>
                ) : (
                  <Link href={d.href}>{d.label} →</Link>
                )}
                <div className="kicker" style={{ marginTop: 4 }}>
                  {d.note}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="section-h">Today&rsquo;s Queue</h2>
          <ul className="queue">
            {queue.map((q, i) => (
              <li key={i}>
                <span className="prio">{q.p}</span>
                <span>{q.t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="section-h">Infrastructure Notes</h2>
        <ul className="infra">
          {infra.map((i, idx) => (
            <li key={idx}>
              <code>{i}</code>
            </li>
          ))}
        </ul>
      </section>

      <footer className="ftr">
        <span>Quintus Portal · {iso}</span>
        <span>v0.1 — building the machine that builds everything else</span>
      </footer>
    </main>
  );
}
