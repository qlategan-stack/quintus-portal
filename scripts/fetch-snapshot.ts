/**
 * fetch-snapshot.ts
 * ----------------------------------------------------------------------------
 * Build-time data pull: reads from Supabase using the service-role key,
 * writes typed JSON snapshots into data/snapshot/ for the Next.js static
 * export to bake in.
 *
 * Run via:  npx tsx scripts/fetch-snapshot.ts
 * Or as part of `npm run build` (see package.json scripts).
 *
 * Required env (read from .env.local locally, GitHub Secrets in CI):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (server-side only — never ship to client)
 *
 * Failure mode: if SUPABASE_URL is not set, falls back to writing empty
 * arrays so `next build` still succeeds locally before provisioning is done.
 * ----------------------------------------------------------------------------
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// @supabase/realtime-js checks globalThis.WebSocket in its constructor even
// when Realtime is never used. Node 22+ has native WebSocket; on older Node
// (and on CI runners that occasionally pin lower) we stub it. We never
// actually open a socket — this is only to satisfy the constructor check.
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  (globalThis as { WebSocket?: unknown }).WebSocket = class {};
}

const ROOT = process.cwd();
const SNAPSHOT_DIR = resolve(ROOT, 'data', 'snapshot');

let sb: SupabaseClient | null = null;
let HAS_SUPABASE = false;

async function loadDotEnvLocal() {
  try {
    const txt = await readFile(resolve(ROOT, '.env.local'), 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const [, k, v] = m;
      if (process.env[k] === undefined) {
        process.env[k] = v.replace(/^['"]|['"]$/g, '');
      }
    }
  } catch {
    // file missing — fine, fall through to env vars from CI
  }
}

async function write(name: string, payload: unknown) {
  await writeFile(
    resolve(SNAPSHOT_DIR, name),
    JSON.stringify(payload, null, 2),
    'utf8',
  );
  console.log(`  ✓ wrote data/snapshot/${name}`);
}

async function fetchAll<T>(table: string, select = '*'): Promise<T[]> {
  if (!sb) return [];
  const { data, error } = await sb.from(table).select(select);
  if (error) {
    console.error(`  ✗ ${table}: ${error.message}`);
    return [];
  }
  return (data ?? []) as T[];
}

async function pullVentures() {
  return fetchAll(
    'ventures',
    'id, slug, name, entity_type, parent_id, legal_entity, quintus_role, status, brief_md, metadata',
  );
}

async function pullGeneralEntries() {
  if (!sb) return [];
  const { data, error } = await sb
    .from('general_entries')
    .select(
      'id, entry_date, title, mood, big_idea_headline, big_idea_body, reflection, note, ' +
      'entry_concepts ( id, slug, title, body, ord ), ' +
      'entry_actions  ( id, priority, text, ord, task_id )',
    )
    .order('entry_date', { ascending: false });
  if (error) {
    console.error(`  ✗ general_entries: ${error.message}`);
    return [];
  }
  return (data ?? []).map((e: any) => ({
    ...e,
    entry_concepts: (e.entry_concepts ?? []).sort(
      (a: any, b: any) => (a.ord ?? 0) - (b.ord ?? 0),
    ),
    entry_actions: (e.entry_actions ?? []).sort(
      (a: any, b: any) => (a.ord ?? 0) - (b.ord ?? 0),
    ),
  }));
}

async function pullOpenTasks()      { return fetchAll('v_open_tasks'); }
async function pullRecentMeetings() { return fetchAll('v_recent_meetings'); }
async function pullAgents()         { return fetchAll('v_active_agents'); }
async function pullWorkflows() {
  return fetchAll(
    'workflows',
    'id, name, description, platform, venture_id, external_url, trigger_type, status, last_run_at',
  );
}

async function main() {
  console.log('▸ fetch-snapshot');
  await loadDotEnvLocal();
  const URL_ = process.env.SUPABASE_URL ?? '';
  const KEY_ = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  HAS_SUPABASE = Boolean(URL_ && KEY_);
  sb = HAS_SUPABASE
    ? createClient(URL_, KEY_, { auth: { persistSession: false } })
    : null;
  if (!HAS_SUPABASE) {
    console.warn('  ⚠ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.');
    console.warn('    Writing empty snapshots so `next build` still works.');
  }

  await mkdir(SNAPSHOT_DIR, { recursive: true });

  const [
    ventures,
    generalEntries,
    openTasks,
    recentMeetings,
    agents,
    workflows,
  ] = await Promise.all([
    pullVentures(),
    pullGeneralEntries(),
    pullOpenTasks(),
    pullRecentMeetings(),
    pullAgents(),
    pullWorkflows(),
  ]);

  await write('ventures.json',        ventures);
  await write('general-entries.json', generalEntries);
  await write('tasks.json',           openTasks);
  await write('meetings.json',        recentMeetings);
  await write('agents.json',          agents);
  await write('workflows.json',       workflows);
  await write('_meta.json', {
    builtAt: new Date().toISOString(),
    source:  HAS_SUPABASE ? 'supabase' : 'empty-fallback',
    counts: {
      ventures:       ventures.length,
      generalEntries: generalEntries.length,
      openTasks:      openTasks.length,
      recentMeetings: recentMeetings.length,
      agents:         agents.length,
      workflows:      workflows.length,
    },
  });

  console.log('▸ fetch-snapshot done');
}

main().catch((err) => {
  console.error('fetch-snapshot failed:', err);
  process.exit(1);
});
