type Site = { label: string; href: string; note: string };

const sites: Site[] = [
  {
    label: 'KPI Sales — Weekly',
    href: 'https://flomaticauto.github.io/olympic-paints-kpi/',
    note: 'MTD · Reps · Debtors · YoY · Rock-bottom',
  },
  {
    label: 'HAVEN HR — Clocking',
    href: 'https://flomaticauto.github.io/olympic-paints-clocking/',
    note: 'Daily attendance · Departments · Missed clock-outs',
  },
  {
    label: 'Quintus Portal (this site)',
    href: 'https://qlategan-stack.github.io/quintus-portal/',
    note: 'You are here',
  },
];

export default function WebpagesPage() {
  return (
    <main className="page">
      <header className="hdr">
        <div>
          <div className="kicker">Webpages</div>
          <h1>Webpages</h1>
          <div className="sub">Live dashboards & sites in production</div>
        </div>
      </header>

      <section>
        <ul className="links">
          {sites.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer">
                {s.label} ↗
              </a>
              <div className="kicker" style={{ marginTop: 4 }}>{s.note}</div>
            </li>
          ))}
        </ul>
      </section>

      <footer className="ftr">
        <span>Webpages</span>
        <span>Add new entries to app/webpages/page.tsx</span>
      </footer>
    </main>
  );
}
