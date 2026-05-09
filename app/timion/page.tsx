import { loadManifest } from '@/app/lib/fetch-manifest';
import VentureDashboards from '@/app/components/VentureDashboards';

export const dynamic = 'force-dynamic';

const SLUG = 'timion';

export default async function TimionPage() {
  const manifest = await loadManifest(SLUG);
  const tagline = manifest?.tagline ?? 'Timion NPC — non-profit ventures';

  return (
    <main className="page">
      <header className="hdr">
        <div>
          <div className="kicker">Timion NPC</div>
          <h1>{manifest?.name ?? 'Timion NPC'}</h1>
          <div className="sub">{tagline}</div>
        </div>
      </header>

      <VentureDashboards slug={SLUG} manifest={manifest} />

      <footer className="ftr">
        <span>Timion NPC</span>
        <span>
          {manifest?.dashboards.length ?? 0}{' '}
          {(manifest?.dashboards.length ?? 0) === 1 ? 'dashboard' : 'dashboards'}
        </span>
      </footer>
    </main>
  );
}
