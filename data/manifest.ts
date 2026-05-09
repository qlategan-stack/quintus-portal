// ─────────────────────────────────────────────────────────────────────────
//  Venture manifest types — the contract each venture publishes for its
//  dashboards/links. Read by the Portal to render per-venture pages and
//  the cross-venture rollup on /webpages (Quintus Organisations).
//
//  Whether a manifest lives locally (in this repo's public/manifests/) or
//  remotely (in the venture's own repo, exposed via GitHub Pages or any
//  public URL), the shape is the same.
// ─────────────────────────────────────────────────────────────────────────

export type DashboardEntry = {
  /** Display title */
  title: string;
  /** Public URL — opened in a new tab */
  url: string;
  /** Optional one-line subtitle/description */
  description?: string;
  /** Optional grouping tag, e.g. 'analysis', 'monitoring', 'admin' */
  category?: string;
};

export type VentureManifest = {
  /** Venture slug, must match the key in venture-manifests.ts registry */
  venture: string;
  /** Display name shown in headings */
  name: string;
  /** Optional one-line description rendered under the venture name */
  tagline?: string;
  /** Dashboards/links the Portal should surface */
  dashboards: DashboardEntry[];
  /** ISO timestamp — informational, shown in metadata */
  updatedAt?: string;
};
