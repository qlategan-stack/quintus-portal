import { loadManifest } from '@/app/lib/fetch-manifest';
import VentureDashboards from '@/app/components/VentureDashboards';

export const dynamic = 'force-dynamic';

const SLUG = 'jbay';

export default async function JbayPage() {
  const manifest = await loadManifest(SLUG);
  const tagline = manifest?.tagline ?? 'Jeffreys Bay Airbnb — short-stay hosting';

  return (
    <main className="page">
      <header className="hdr">
        <div>
          <div className="kicker">Jeffreys Bay Airbnb</div>
          <h1>{manifest?.name ?? 'Jeffreys Bay Airbnb'}</h1>
          <div className="sub">{tagline}</div>
        </div>
      </header>

      <VentureDashboards slug={SLUG} manifest={manifest} />

      <footer className="ftr">
        <span>Jeffreys Bay Airbnb</span>
        <span>
          {manifest?.dashboards.length ?? 0}{' '}
          {(manifest?.dashboards.length ?? 0) === 1 ? 'dashboard' : 'dashboards'}
        </span>
      </footer>
    </main>
  );
}
