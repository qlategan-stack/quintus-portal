type Site = { label: string; href: string; note: string };

const sites: Site[] = [
  {
    label: 'Trade Analysis Dashboard',
    href: 'https://qlategan-stack.github.io/flowtrader-dashboard/trade-analysis/',
    note: 'Per-trade breakdown · win/loss patterns · strategy review',
  },
];

export default function FlowTraderPage() {
  return (
    <main className="page">
      <header className="hdr">
        <div>
          <div className="kicker">FlowTrader</div>
          <h1>FlowTrader</h1>
          <div className="sub">Algo & discretionary trading — compounding focus</div>
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
        <span>FlowTrader</span>
        <span>{sites.length} {sites.length === 1 ? 'dashboard' : 'dashboards'}</span>
      </footer>
    </main>
  );
}
