import Link from 'next/link';
import { loadAllManifests, manifestSource } from '@/app/lib/fetch-manifest';

export const dynamic = 'force-dynamic';

const SLUG_TO_PATH: Record<string, string> = {
  olympic:       '/olympic',
  flowmatic:     '/flowmatic',
  flowtrader:    '/flowtrader',
  tradecraft:    '/tradecraft',
  jbay:          '/jbay',
  timion:        '/timion',
  mcaa:          '/mcaa',
  international: '/international',
};

export default async function QuintusOrganisationsPage() {
  const manifests = await loadAllManifests();
  const totalDashboards = manifests.reduce((n, m) => n + m.dashboards.length, 0);
  const venturesWithContent = manifests.filter((m) => m.dashboards.length > 0).length;

  return (
    <main className="page">
      <header className="hdr">
        <div>
          <div className="kicker">Quintus Organisations · cross-venture rollup</div>
          <h1>Quintus Organisations</h1>
          <div className="sub">
            All published dashboards across all ventures. Edit any venture&apos;s
            manifest in <code>public/manifests/</code> to add entries here.
          </div>
        </div>
      </header>

      <div
        style={{
          display: 'flex',
          gap: 24,
          margin: '4px 0 28px',
          fontSize: 13,
          color: 'var(--text-dim)',
        }}
      >
        <span>{manifests.length} ventures</span>
        <span>{venturesWithContent} active</span>
        <span>{totalDashboards} total dashboards</span>
      </div>

      {manifests.map((m) => {
        const path = SLUG_TO_PATH[m.venture];
        return (
          <section key={m.venture} style={{ marginBottom: 32 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 16,
                marginBottom: 10,
                paddingBottom: 8,
                borderBottom: '1px solid var(--border)',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  fontWeight: 400,
                  color: 'var(--text)',
                  margin: 0,
                }}
              >
                {path ? (
                  <Link href={path}>{m.name} ↗</Link>
                ) : (
                  m.name
                )}
              </h2>
              <span
                className="kicker"
                title={`Source: ${manifestSource(m.venture)}`}
              >
                {m.dashboards.length}{' '}
                {m.dashboards.length === 1 ? 'dashboard' : 'dashboards'}
              </span>
            </div>

            {m.tagline && (
              <p
                style={{
                  color: 'var(--text-dim)',
                  fontSize: 13,
                  marginBottom: 14,
                  fontStyle: 'italic',
                }}
              >
                {m.tagline}
              </p>
            )}

            {m.dashboards.length === 0 ? (
              <p
                style={{
                  color: 'var(--text-faint)',
                  fontSize: 13,
                  fontStyle: 'italic',
                }}
              >
                No dashboards yet — edit{' '}
                <code>public/manifests/{m.venture}.json</code> to add some.
              </p>
            ) : (
              <ul className="links">
                {m.dashboards.map((d) => (
                  <li key={d.url}>
                    <a href={d.url} target="_blank" rel="noopener noreferrer">
                      {d.title} ↗
                    </a>
                    {d.description && (
                      <div className="kicker" style={{ marginTop: 4 }}>
                        {d.description}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      <footer className="ftr">
        <span>Quintus Organisations</span>
        <span>
          {manifests.length} ventures · {totalDashboards} dashboards
        </span>
      </footer>
    </main>
  );
}
