import type { VentureManifest } from '@/data/manifest';
import { manifestSource } from '@/app/lib/fetch-manifest';

/** Server Component. Renders a venture's dashboard list with empty-state
 *  messaging when no dashboards have been published. */
export default function VentureDashboards({
  slug,
  manifest,
}: {
  slug: string;
  manifest: VentureManifest | null;
}) {
  if (!manifest) {
    return (
      <section className="placeholder">
        <p>No manifest registered for this venture.</p>
        <p style={{ marginTop: 8, color: 'var(--text-faint)', fontSize: 13 }}>
          Add an entry in <code>data/venture-manifests.ts</code> and a JSON
          file in <code>public/manifests/{slug}.json</code>.
        </p>
      </section>
    );
  }

  const { dashboards } = manifest;
  const source = manifestSource(slug);

  if (dashboards.length === 0) {
    return (
      <section className="placeholder">
        <p>
          No dashboards published yet for{' '}
          <strong>{manifest.name}</strong>.
        </p>
        <p style={{ marginTop: 8, color: 'var(--text-faint)', fontSize: 13 }}>
          Edit <code>public/manifests/{slug}.json</code> to add dashboards
          here. They&apos;ll auto-appear on the next build.
          {source === 'local' &&
            ' Or publish a remote manifest from the venture’s own repo and add its URL to REMOTE_MANIFESTS.'}
        </p>
      </section>
    );
  }

  return (
    <section>
      <ul className="links">
        {dashboards.map((d) => (
          <li key={d.url}>
            <a href={d.url} target="_blank" rel="noopener noreferrer">
              {d.title} ↗
            </a>
            {d.description && (
              <div className="kicker" style={{ marginTop: 4 }}>{d.description}</div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
