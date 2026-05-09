// ─────────────────────────────────────────────────────────────────────────
//  Manifest loader.
//  - REMOTE_MANIFESTS[slug]  → fetch with 10-min revalidate (Next cache)
//  - LOCAL_MANIFESTS[slug]   → bundled fallback, always available
//  - Remote failure          → silent fallback to local; never breaks render
// ─────────────────────────────────────────────────────────────────────────

import 'server-only';
import {
  LOCAL_MANIFESTS,
  REMOTE_MANIFESTS,
  VENTURE_ORDER,
} from '@/data/venture-manifests';
import type { VentureManifest } from '@/data/manifest';

/** Load a single venture's manifest. Returns null if the slug isn't known. */
export async function loadManifest(slug: string): Promise<VentureManifest | null> {
  const remote = REMOTE_MANIFESTS[slug];
  if (remote) {
    try {
      const res = await fetch(remote, { next: { revalidate: 600 } });
      if (res.ok) {
        const data = (await res.json()) as VentureManifest;
        return data;
      }
    } catch {
      // network/parse failure — fall through to local
    }
  }
  return LOCAL_MANIFESTS[slug] ?? null;
}

/** Load every venture's manifest in parallel, in canonical order. */
export async function loadAllManifests(): Promise<VentureManifest[]> {
  const results = await Promise.all(VENTURE_ORDER.map((slug) => loadManifest(slug)));
  return results.filter((m): m is VentureManifest => m !== null);
}

/** Look up the source actually used (remote vs local) — for diagnostics. */
export function manifestSource(slug: string): 'remote' | 'local' | 'none' {
  if (REMOTE_MANIFESTS[slug]) return 'remote';
  if (LOCAL_MANIFESTS[slug]) return 'local';
  return 'none';
}
