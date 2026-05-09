// ─────────────────────────────────────────────────────────────────────────
//  Venture manifest registry — two-layer setup.
//
//  LOCAL_MANIFESTS: bundled JSON files in /public/manifests/. Always
//  available, even before any venture publishes its own remote manifest.
//  Edit these in this repo to add/remove dashboards quickly.
//
//  REMOTE_MANIFESTS: optional per-venture URL. When present, it wins over
//  the local file — the venture "owns" its manifest from its own repo.
//  Migration path: when ready, host manifest.json in the venture's repo
//  (e.g. via GitHub Pages) and add its URL here. Local fallback stays as
//  a safety net if the remote is unreachable.
// ─────────────────────────────────────────────────────────────────────────

import type { VentureManifest } from './manifest';

import olympic from '../public/manifests/olympic.json';
import flowmatic from '../public/manifests/flowmatic.json';
import flowtrader from '../public/manifests/flowtrader.json';
import timion from '../public/manifests/timion.json';
import mcaa from '../public/manifests/mcaa.json';
import tradecraft from '../public/manifests/tradecraft.json';
import jbay from '../public/manifests/jbay.json';
import international from '../public/manifests/international.json';

export const LOCAL_MANIFESTS: Record<string, VentureManifest> = {
  olympic:       olympic       as VentureManifest,
  flowmatic:     flowmatic     as VentureManifest,
  flowtrader:    flowtrader    as VentureManifest,
  timion:        timion        as VentureManifest,
  mcaa:          mcaa          as VentureManifest,
  tradecraft:    tradecraft    as VentureManifest,
  jbay:          jbay          as VentureManifest,
  international: international as VentureManifest,
};

/**
 * Optional remote URL per venture. When set, fetched at request time and
 * preferred over the local file. Empty string / missing key = use local.
 *
 * Example, once a venture publishes its own manifest:
 *   flowtrader: 'https://qlategan-stack.github.io/flowtrader-dashboard/manifest.json',
 */
export const REMOTE_MANIFESTS: Record<string, string> = {
  // (none yet — all using local fallback)
};

/** Stable display order for the cross-venture rollup. */
export const VENTURE_ORDER: string[] = [
  'olympic',
  'flowmatic',
  'flowtrader',
  'tradecraft',
  'jbay',
  'timion',
  'mcaa',
  'international',
];
