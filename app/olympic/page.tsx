import { loadManifest } from '@/app/lib/fetch-manifest';
import VentureDashboards from '@/app/components/VentureDashboards';

export const dynamic = 'force-dynamic';

const SLUG = 'olympic';

export default async function OlympicPage() {
  const manifest = await loadManifest(SLUG);
  const tagline = manifest?.tagline ?? 'Olympic Paints — Limpopo paint manufacturer';

  return (
    <main className="page">
      <header className="hdr">
        <div>
          <div className="kicker">Olympic Paints</div>
          <h1>{manifest?.name ?? 'Olympic Paints'}</h1>
          <div className="sub">{tagline}</div>
        </div>
      </header>

      <VentureDashboards slug={SLUG} manifest={manifest} />

      <footer className="ftr">
        <span>Olympic Paints</span>
        <span>
          {manifest?.dashboards.length ?? 0}{' '}
          {(manifest?.dashboards.length ?? 0) === 1 ? 'dashboard' : 'dashboards'}
        </span>
      </footer>
    </main>
  );
}
