import { loadManifest } from '@/app/lib/fetch-manifest';
import VentureDashboards from '@/app/components/VentureDashboards';

export const dynamic = 'force-dynamic';

const SLUG = 'mcaa';

export default async function McaaPage() {
  const manifest = await loadManifest(SLUG);
  const tagline = manifest?.tagline ?? 'MCAA — member-driven association';

  return (
    <main className="page">
      <header className="hdr">
        <div>
          <div className="kicker">MCAA</div>
          <h1>{manifest?.name ?? 'MCAA'}</h1>
          <div className="sub">{tagline}</div>
        </div>
      </header>

      <VentureDashboards slug={SLUG} manifest={manifest} />

      <footer className="ftr">
        <span>MCAA</span>
        <span>
          {manifest?.dashboards.length ?? 0}{' '}
          {(manifest?.dashboards.length ?? 0) === 1 ? 'dashboard' : 'dashboards'}
        </span>
      </footer>
    </main>
  );
}
