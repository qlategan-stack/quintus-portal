/**
 * import-from-notion.ts
 * ----------------------------------------------------------------------------
 * One-shot bulk import: pulls every row from your three canonical Notion
 * databases (Tasks, Meeting Minutes, Documents) and upserts them into Supabase.
 *
 * Run via:  npx tsx scripts/import-from-notion.ts
 *
 * Required env (in .env.local):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NOTION_TOKEN                — internal integration token from
 *                                 https://www.notion.so/profile/integrations
 *
 * Prereq: in each Notion database, click ••• → Connections → add your
 * integration. Without that the API returns 404 for those DBs.
 *
 * Idempotent: uses Notion page id as `notion_id` upsert key, so re-runs
 * update existing rows in place.
 * ----------------------------------------------------------------------------
 */

import { createClient as createSupabase, type SupabaseClient } from '@supabase/supabase-js';
import { Client as Notion } from '@notionhq/client';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// realtime-js wants a WebSocket constructor at client init
if (typeof (globalThis as { WebSocket?: unknown }).WebSocket === 'undefined') {
  (globalThis as { WebSocket?: unknown }).WebSocket = class {};
}

// ── Config ───────────────────────────────────────────────────────────────
const TASK_DB_ID = '247ff48d-2bb1-800c-a00a-ca3b59f789eb';
const DOC_DB_ID  = '254ff48d-2bb1-809e-b980-c080b74c7a7b';
const MM_DB_ID   = '247ff48d-2bb1-8009-979b-d25bac9fe72e';

const AREA_TO_VENTURE: Record<string, string | null> = {
  GOD:      null,         // personal/cross-cutting
  Quintus:  null,
  Olympic:  'olympic',
  Timion:   'timion',
  Flomatic: 'flowmatic',
};

const CUSTOMER_TO_VENTURE: Record<string, string | null> = {
  Olympic: 'olympic',
  Timion:  'timion',
  JBMN:    null,           // a Flomatic customer, no venture row yet
  PLR:     null,
};

const IMPORTANCE_TO_PRIORITY: Record<string, 'red' | 'yellow' | 'green' | 'blue'> = {
  Urget:  'red',
  High:   'yellow',
  Medium: 'green',
  Low:    'blue',
};

const ACTION_TO_STATUS: Record<string, 'todo' | 'doing' | 'blocked' | 'done' | 'dropped'> = {
  'Action Required': 'todo',
  'FYI Only':        'dropped',
  Completed:         'done',
};

const MEETING_TYPE_MAP: Record<string, 'general' | 'sales' | 'ops' | 'hr' | 'customer'> = {
  Sales:       'sales',
  Operations:  'ops',
  Marketing:   'general',
  Contractors: 'general',
  Strategic:   'general',
  Exco:        'general',
  Discovery:   'sales',
};

const DOC_MULTI_TO_KIND: Record<string, 'sop' | 'template'> = {
  SOP:               'sop',
  'Job Description': 'template',
};

// ── env loader (same trick as fetch-snapshot.ts) ─────────────────────────
async function loadDotEnvLocal(root: string) {
  try {
    const txt = await readFile(resolve(root, '.env.local'), 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
      if (!m) continue;
      const [, k, v] = m;
      if (process.env[k] === undefined) process.env[k] = v.replace(/^['"]|['"]$/g, '');
    }
  } catch {}
}

// ── Property extractors ──────────────────────────────────────────────────
type Props = Record<string, any>;
const getTitle  = (p: Props, name: string) =>
  (p[name]?.title ?? []).map((t: any) => t.plain_text).join('').trim() || null;
const getRich   = (p: Props, name: string) =>
  (p[name]?.rich_text ?? []).map((t: any) => t.plain_text).join('').trim() || null;
const getSelect = (p: Props, name: string): string | null => p[name]?.select?.name ?? null;
const getMulti  = (p: Props, name: string): string[] =>
  (p[name]?.multi_select ?? []).map((s: any) => s.name);
const getDate   = (p: Props, name: string): string | null => p[name]?.date?.start ?? null;
const getUrl    = (p: Props, name: string): string | null => p[name]?.url ?? null;
const getCheck  = (p: Props, name: string): boolean => Boolean(p[name]?.checkbox);

// ── Supabase / Notion clients ────────────────────────────────────────────
let sb: SupabaseClient;
let notion: Notion;
let ventureCache: Record<string, string> = {};

async function ventureIdFromSlug(slug: string | null): Promise<string | null> {
  if (!slug) return null;
  if (ventureCache[slug]) return ventureCache[slug];
  const { data, error } = await sb.from('ventures').select('id').eq('slug', slug).single();
  if (error || !data) return null;
  ventureCache[slug] = data.id;
  return data.id;
}

// ── Pagers ───────────────────────────────────────────────────────────────
async function paginate(databaseId: string): Promise<any[]> {
  const out: any[] = [];
  let cursor: string | undefined;
  do {
    const r: any = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    });
    out.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return out;
}

// ── Importers ────────────────────────────────────────────────────────────
async function importTasks() {
  console.log('▸ Importing tasks…');
  const rows = await paginate(TASK_DB_ID);
  let ok = 0, fail = 0;
  for (const page of rows) {
    const p = page.properties as Props;
    const area = getSelect(p, 'Area');
    const importance = getSelect(p, 'Importance');
    const action = getSelect(p, 'Action Required');
    const venture_id = await ventureIdFromSlug(AREA_TO_VENTURE[area ?? ''] ?? null);

    const task = {
      notion_id: page.id,
      title: getTitle(p, 'Name') ?? '(untitled)',
      description: getRich(p, 'Description'),
      venture_id,
      priority: importance ? IMPORTANCE_TO_PRIORITY[importance] ?? null : null,
      status: action ? ACTION_TO_STATUS[action] ?? 'todo' : 'todo',
      due_at: getDate(p, 'Due Date'),
      source_url: getUrl(p, 'userDefined:URL') ?? getUrl(p, 'Email Link') ?? page.url,
      metadata: {
        notion_area: area,
        notion_action_required: action,
        notion_importance: importance,
        notion_status: getSelect(p, 'Status'),
        notion_category: getSelect(p, 'Category'),
        notion_collaborators: getMulti(p, 'Colaborator '),
        notion_today: getCheck(p, 'Today'),
        notion_archive: getCheck(p, 'Archive'),
        notion_start_time: getDate(p, 'Start Time'),
        notion_end_time: getDate(p, 'End Time'),
      },
    };

    const { error } = await sb.from('tasks').upsert(task, { onConflict: 'notion_id' });
    if (error) { fail++; console.error(`  ✗ ${task.title}: ${error.message}`); }
    else ok++;
  }
  console.log(`  ${ok} ok / ${fail} failed (of ${rows.length} total)`);
}

async function importDocuments() {
  console.log('▸ Importing documents…');
  const rows = await paginate(DOC_DB_ID);
  let ok = 0, fail = 0;
  for (const page of rows) {
    const p = page.properties as Props;
    const area = getSelect(p, 'Area');
    const multi = getMulti(p, 'Multi-select');
    const docType = multi.map(t => DOC_MULTI_TO_KIND[t]).find(Boolean) ?? 'note';
    const venture_id = await ventureIdFromSlug(AREA_TO_VENTURE[area ?? ''] ?? null);

    const doc = {
      notion_id: page.id,
      title: getTitle(p, 'Document Name') ?? '(untitled)',
      doc_type: docType,
      mime_type: 'text/markdown',
      venture_id,
      body_md: getRich(p, 'Description'),
      source_url: page.url,
      metadata: {
        notion_area: area,
        notion_multi_select: multi,
        notion_today: getCheck(p, 'Today'),
        notion_created_date: getDate(p, 'Created Time'),
      },
    };

    const { error } = await sb.from('documents').upsert(doc, { onConflict: 'notion_id' });
    if (error) { fail++; console.error(`  ✗ ${doc.title}: ${error.message}`); }
    else ok++;
  }
  console.log(`  ${ok} ok / ${fail} failed (of ${rows.length} total)`);
}

async function importMeetings() {
  console.log('▸ Importing meetings…');
  const rows = await paginate(MM_DB_ID);
  let ok = 0, fail = 0;
  for (const page of rows) {
    const p = page.properties as Props;
    const customer = getSelect(p, 'Customer');
    const meetingType = getSelect(p, 'Meeting Type');
    const venture_id = await ventureIdFromSlug(CUSTOMER_TO_VENTURE[customer ?? ''] ?? null);
    const heldAt = getDate(p, 'Date') ?? page.created_time;

    const meeting = {
      notion_id: page.id,
      title: getTitle(p, 'Name') ?? '(untitled)',
      meeting_type: meetingType ? MEETING_TYPE_MAP[meetingType] ?? 'general' : 'general',
      held_at: heldAt,
      venture_id,
      source_url: getUrl(p, 'userDefined:URL') ?? page.url,
      metadata: {
        notion_customer: customer,
        notion_meeting_type: meetingType,
        notion_attendees: getMulti(p, 'Attendees'),
        notion_meeting_date: getDate(p, 'Meeting Date'),
      },
    };

    const { error } = await sb.from('meetings').upsert(meeting, { onConflict: 'notion_id' });
    if (error) { fail++; console.error(`  ✗ ${meeting.title}: ${error.message}`); }
    else ok++;
  }
  console.log(`  ${ok} ok / ${fail} failed (of ${rows.length} total)`);
}

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  await loadDotEnvLocal(process.cwd());
  const url   = process.env.SUPABASE_URL;
  const skey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ntok  = process.env.NOTION_TOKEN;
  if (!url || !skey || !ntok) {
    console.error('Missing env. Need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NOTION_TOKEN.');
    process.exit(1);
  }
  sb = createSupabase(url, skey, { auth: { persistSession: false } });
  notion = new Notion({ auth: ntok });

  console.log('▸ import-from-notion');
  await importTasks();
  await importDocuments();
  await importMeetings();
  console.log('▸ done. Run `npm run snapshot` to refresh local JSON, then `git push`.');
}

main().catch((e) => { console.error(e); process.exit(1); });
