import { loadManifest } from '@/app/lib/fetch-manifest';
import VentureDashboards from '@/app/components/VentureDashboards';

export const dynamic = 'force-dynamic';

const SLUG = 'tradecraft';

export default async function TradeCraftPage() {
  const manifest = await loadManifest(SLUG);
  const tagline = manifest?.tagline ?? 'TradeCraft — trading education and tools';

  return (
    <main className="page">
      <header className="hdr">
        <div>
          <div className="kicker">TradeCraft</div>
          <h1>{manifest?.name ?? 'TradeCraft'}</h1>
          <div className="sub">{tagline}</div>
        </div>
      </header>

      <VentureDashboards slug={SLUG} manifest={manifest} />

      <footer className="ftr">
        <span>TradeCraft</span>
        <span>
          {manifest?.dashboards.length ?? 0}{' '}
          {(manifest?.dashboards.length ?? 0) === 1 ? 'dashboard' : 'dashboards'}
        </span>
      </footer>
    </main>
  );
}
