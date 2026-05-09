import { loadManifest } from '@/app/lib/fetch-manifest';
import VentureDashboards from '@/app/components/VentureDashboards';

export const dynamic = 'force-dynamic';

const SLUG = 'flowmatic';

export default async function FlowmaticPage() {
  const manifest = await loadManifest(SLUG);
  const tagline = manifest?.tagline ?? 'Automation studio — engine room for every venture';

  return (
    <main className="page">
      <header className="hdr">
        <div>
          <div className="kicker">Flowmatic</div>
          <h1>{manifest?.name ?? 'Flowmatic'}</h1>
          <div className="sub">{tagline}</div>
        </div>
      </header>

      <VentureDashboards slug={SLUG} manifest={manifest} />

      <footer className="ftr">
        <span>Flowmatic</span>
        <span>
          {manifest?.dashboards.length ?? 0}{' '}
          {(manifest?.dashboards.length ?? 0) === 1 ? 'dashboard' : 'dashboards'}
        </span>
      </footer>
    </main>
  );
}
