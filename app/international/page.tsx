import { loadManifest } from '@/app/lib/fetch-manifest';
import VentureDashboards from '@/app/components/VentureDashboards';

export const dynamic = 'force-dynamic';

const SLUG = 'international';

export default async function InternationalPage() {
  const manifest = await loadManifest(SLUG);
  const tagline = manifest?.tagline ?? 'Cross-border ventures and partnerships';

  return (
    <main className="page">
      <header className="hdr">
        <div>
          <div className="kicker">International Projects</div>
          <h1>{manifest?.name ?? 'International Projects'}</h1>
          <div className="sub">{tagline}</div>
        </div>
      </header>

      <VentureDashboards slug={SLUG} manifest={manifest} />

      <footer className="ftr">
        <span>International Projects</span>
        <span>
          {manifest?.dashboards.length ?? 0}{' '}
          {(manifest?.dashboards.length ?? 0) === 1 ? 'dashboard' : 'dashboards'}
        </span>
      </footer>
    </main>
  );
}
