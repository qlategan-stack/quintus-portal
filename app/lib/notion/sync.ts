// ─────────────────────────────────────────────────────────────────────────
//  Generic sync engine.
//
//  Algorithm per entity kind:
//    1. Read sync_state.last_synced_at for this kind.
//    2. Pull pages from Notion DB filtered to last_edited_time >= L.
//       (First sync has L=null → returns everything.)
//    3. Pull rows from Supabase where updated_at >= L OR notion_id is null.
//    4. Build a join keyed by Notion page_id (== Supabase notion_id).
//    5. For each pair, classify and apply:
//         - Both sides absent           → impossible
//         - Notion only                 → INSERT into Supabase
//         - Supabase only (no notion_id)→ CREATE Notion page; store notion_id
//         - Both, hashes equal          → skip
//         - Both, only Notion changed   → UPDATE Supabase
//         - Both, only Supabase changed → UPDATE Notion
//         - Both changed, conflict      → newer wins; loser → audit_log
//    6. Update sync_state.last_synced_at to now.
//
//  Each entity kind passes its own mappers/IDs/fields. The engine knows
//  nothing about tasks/meetings/documents specifically.
// ─────────────────────────────────────────────────────────────────────────

import 'server-only';
import { createHash } from 'node:crypto';
import { getServerSupabase } from '@/app/lib/supabase-server';
import { getNotionClient, np } from './client';

export type SyncCounts = {
  pulled: number;        // Notion → Supabase
  pushed: number;        // Supabase → Notion
  inserted_supabase: number;
  inserted_notion: number;
  conflicts: number;
  skipped: number;
  errors: { id: string; message: string }[];
};

const ZERO: SyncCounts = {
  pulled: 0,
  pushed: 0,
  inserted_supabase: 0,
  inserted_notion: 0,
  conflicts: 0,
  skipped: 0,
  errors: [],
};

export type EntityKind = 'task' | 'meeting' | 'document';

/** A canonical, side-agnostic representation of one row. Mappers reduce
 *  both Notion pages and Supabase rows to this shape so we can hash and
 *  compare them apples-to-apples. */
export type Canonical = Record<string, unknown>;

export type SyncMapper = {
  kind: EntityKind;
  notionDbId: string;
  supabaseTable: string;

  /** Convert a Notion page → canonical form + extracted timestamps. */
  fromNotion(page: NotionPage): {
    canonical: Canonical;
    last_edited_time: string;
  };

  /** Convert a Supabase row → canonical form + extracted timestamps. */
  fromSupabase(row: SupabaseRow): {
    canonical: Canonical;
    updated_at: string;
    notion_id: string | null;
    id: string;
  };

  /** Build the patch to apply to Supabase from a Notion page (for inserts/updates). */
  toSupabasePatch(page: NotionPage): Promise<Record<string, unknown>>;

  /** Build the Notion properties patch from a Supabase row. */
  toNotionProperties(row: SupabaseRow): Promise<Record<string, unknown>>;
};

type NotionPage = {
  id: string;
  last_edited_time: string;
  properties: Record<string, unknown>;
  archived?: boolean;
  url?: string;
};

type SupabaseRow = Record<string, unknown> & {
  id: string;
  notion_id: string | null;
  updated_at: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────

function hash(c: Canonical): string {
  // Stable JSON: sort keys before stringify so {a:1,b:2} hashes the same
  // as {b:2,a:1}. Nested objects are not sorted — none of our canonical
  // shapes nest objects, only primitives + arrays of primitives.
  const keys = Object.keys(c).sort();
  const stable = keys.reduce<Record<string, unknown>>((acc, k) => {
    acc[k] = c[k];
    return acc;
  }, {});
  return createHash('sha256').update(JSON.stringify(stable)).digest('hex');
}

async function getLastSync(kind: EntityKind): Promise<string | null> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('sync_state')
    .select('last_synced_at')
    .eq('entity_kind', kind)
    .eq('source', 'notion')
    .is('entity_id', null)
    .maybeSingle();
  if (error) return null;
  return (data?.last_synced_at as string | undefined) ?? null;
}

async function setLastSync(kind: EntityKind): Promise<void> {
  const sb = getServerSupabase();
  const now = new Date().toISOString();
  // We store one "kind-level" row per entity kind with entity_id = null
  // to mark "the last time we synced this whole kind." Per-row sync_state
  // entries are reserved for future deeper tracking.
  await sb.from('sync_state').upsert(
    {
      entity_kind: kind,
      source: 'notion',
      entity_id: null,
      last_synced_at: now,
      sync_direction: 'bidi',
    },
    { onConflict: 'entity_kind,source,entity_id' },
  );
}

async function logConflict(
  kind: EntityKind,
  entity_id: string,
  diff: Record<string, unknown>,
): Promise<void> {
  const sb = getServerSupabase();
  await sb.from('audit_log').insert({
    actor: 'sync',
    action: 'conflict_loser_overwritten',
    entity_kind: kind,
    entity_id,
    diff,
  });
}

// ── Main ─────────────────────────────────────────────────────────────────

export async function syncEntity(mapper: SyncMapper): Promise<SyncCounts> {
  const result: SyncCounts = { ...ZERO, errors: [] };
  const sb = getServerSupabase();
  const notion = getNotionClient();
  const lastSync = await getLastSync(mapper.kind);

  // ── 1. Pull Notion pages (filtered if we have a previous sync) ──
  const notionPages: NotionPage[] = [];
  let cursor: string | undefined;
  do {
    const queryArgs: Record<string, unknown> = {
      database_id: mapper.notionDbId,
      start_cursor: cursor,
      page_size: 100,
    };
    if (lastSync) {
      queryArgs.filter = {
        timestamp: 'last_edited_time',
        last_edited_time: { on_or_after: lastSync },
      };
    }
    const r = await np(() =>
      notion.databases.query(queryArgs as Parameters<typeof notion.databases.query>[0]),
    );
    notionPages.push(...((r as { results: NotionPage[] }).results));
    cursor = (r as { has_more?: boolean; next_cursor?: string }).has_more
      ? (r as { next_cursor?: string }).next_cursor
      : undefined;
  } while (cursor);

  // ── 2. Pull Supabase rows (changed since lastSync OR new local rows) ──
  let sbQuery = sb.from(mapper.supabaseTable).select('*');
  if (lastSync) sbQuery = sbQuery.or(`updated_at.gte.${lastSync},notion_id.is.null`);
  const { data: sbRowsRaw, error: sbErr } = await sbQuery;
  if (sbErr) {
    result.errors.push({ id: '*', message: `supabase fetch: ${sbErr.message}` });
    return result;
  }
  const sbRows = (sbRowsRaw ?? []) as SupabaseRow[];

  // ── 3. Build maps keyed by notion_id ──
  const notionByPageId = new Map<string, NotionPage>();
  for (const p of notionPages) notionByPageId.set(p.id, p);
  const sbByNotionId = new Map<string, SupabaseRow>();
  const sbWithoutNotionId: SupabaseRow[] = [];
  for (const r of sbRows) {
    if (r.notion_id) sbByNotionId.set(r.notion_id, r);
    else sbWithoutNotionId.push(r);
  }

  // ── 4. Reconcile pairs ──
  const allKeys = new Set<string>([...notionByPageId.keys(), ...sbByNotionId.keys()]);

  for (const notion_id of allKeys) {
    const page = notionByPageId.get(notion_id);
    const row = sbByNotionId.get(notion_id);

    try {
      // (a) Notion-only → INSERT into Supabase
      if (page && !row) {
        const patch = await mapper.toSupabasePatch(page);
        const { error } = await sb
          .from(mapper.supabaseTable)
          .insert({ ...patch, notion_id: page.id });
        if (error) throw new Error(error.message);
        result.inserted_supabase += 1;
        continue;
      }

      // (b) Both present → compare
      if (page && row) {
        const n = mapper.fromNotion(page);
        const s = mapper.fromSupabase(row);
        const nHash = hash(n.canonical);
        const sHash = hash(s.canonical);
        if (nHash === sHash) {
          result.skipped += 1;
          continue;
        }

        const nTime = new Date(n.last_edited_time).getTime();
        const sTime = new Date(s.updated_at).getTime();

        if (nTime > sTime) {
          // Notion newer — pull
          const patch = await mapper.toSupabasePatch(page);
          const { error } = await sb
            .from(mapper.supabaseTable)
            .update(patch)
            .eq('id', s.id);
          if (error) throw new Error(error.message);
          if (sTime >= new Date(lastSync ?? 0).getTime()) {
            // Both edited since last sync → conflict
            result.conflicts += 1;
            await logConflict(mapper.kind, s.id, {
              winner: 'notion',
              loser_value: s.canonical,
              winner_value: n.canonical,
            });
          }
          result.pulled += 1;
        } else {
          // Supabase newer (or tie) — push
          const props = await mapper.toNotionProperties(row);
          await np(() =>
            notion.pages.update({
              page_id: page.id,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              properties: props as any,
            }),
          );
          if (nTime >= new Date(lastSync ?? 0).getTime()) {
            result.conflicts += 1;
            await logConflict(mapper.kind, s.id, {
              winner: 'supabase',
              loser_value: n.canonical,
              winner_value: s.canonical,
            });
          }
          result.pushed += 1;
        }
      }
      // (c) Supabase-only with notion_id but Notion missing — page deleted
      //     in Notion. Mark archived in metadata; don't delete Supabase row.
      else if (row && !page) {
        // Filtered Notion query may have excluded this page if its
        // last_edited_time was older than lastSync — i.e. it just wasn't
        // returned because nothing changed there. So this branch is rare
        // and we leave it as a skip rather than guess at archive intent.
        result.skipped += 1;
      }
    } catch (e) {
      result.errors.push({
        id: notion_id,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // ── 5. Supabase rows without a notion_id → CREATE Notion pages ──
  for (const row of sbWithoutNotionId) {
    try {
      const props = await mapper.toNotionProperties(row);
      const created = (await np(() =>
        getNotionClient().pages.create({
          parent: { database_id: mapper.notionDbId },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          properties: props as any,
        }),
      )) as { id: string };
      const { error } = await sb
        .from(mapper.supabaseTable)
        .update({ notion_id: created.id })
        .eq('id', row.id);
      if (error) throw new Error(error.message);
      result.inserted_notion += 1;
    } catch (e) {
      result.errors.push({
        id: row.id,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // ── 6. Mark this kind as synced ──
  if (result.errors.length === 0) await setLastSync(mapper.kind);

  return result;
}
