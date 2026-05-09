// ─────────────────────────────────────────────────────────────────────────
//  Documents — sync mapper.
//  Body markdown is intentionally NOT round-tripped in v1 (Notion blocks
//  are a separate, much messier API surface than property values).
//  body_md stays in Supabase; Notion's block content is read-only here.
// ─────────────────────────────────────────────────────────────────────────

import 'server-only';
import { getServerSupabase } from '@/app/lib/supabase-server';
import {
  dCheck,
  dDate,
  dMulti,
  dRich,
  dSelect,
  dTitle,
  eMulti,
  eRich,
  eSelect,
  eTitle,
} from './encoders';
import { AREA_TO_VENTURE, DOC_KIND_TO_MULTI, DOC_MULTI_TO_KIND, VENTURE_TO_AREA } from './mappings';
import type { SyncMapper } from './sync';

const DOC_DB_ID = '254ff48d-2bb1-809e-b980-c080b74c7a7b';

const slugCache = new Map<string, string | null>();
const idCache = new Map<string, string | null>();

async function ventureIdFromSlug(slug: string | null): Promise<string | null> {
  if (!slug) return null;
  if (slugCache.has(slug)) return slugCache.get(slug)!;
  const { data } = await getServerSupabase()
    .from('ventures')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  const id = (data?.id as string | undefined) ?? null;
  slugCache.set(slug, id);
  return id;
}

async function ventureSlugFromId(id: string | null): Promise<string | null> {
  if (!id) return null;
  if (idCache.has(id)) return idCache.get(id)!;
  const { data } = await getServerSupabase()
    .from('ventures')
    .select('slug')
    .eq('id', id)
    .maybeSingle();
  const slug = (data?.slug as string | undefined) ?? null;
  idCache.set(id, slug);
  return slug;
}

type NotionPageLike = {
  id: string;
  last_edited_time: string;
  properties: Record<string, unknown>;
  url?: string;
};

type DocRowLike = Record<string, unknown> & {
  id: string;
  notion_id: string | null;
  updated_at: string;
};

export const documentsMapper: SyncMapper = {
  kind: 'document',
  notionDbId: DOC_DB_ID,
  supabaseTable: 'documents',

  fromNotion(page) {
    const p = (page as NotionPageLike).properties;
    const multi = dMulti(p, 'Multi-select');
    return {
      canonical: {
        title: dTitle(p, 'Document Name') ?? '(untitled)',
        description: dRich(p, 'Description'),
        area: dSelect(p, 'Area'),
        multi: multi.slice().sort(),
      },
      last_edited_time: (page as NotionPageLike).last_edited_time,
    };
  },

  fromSupabase(row) {
    const r = row as DocRowLike;
    const meta = (r.metadata as { notion_multi_select?: string[] } | undefined) ?? {};
    const multi = (meta.notion_multi_select ?? DOC_KIND_TO_MULTI[(r.doc_type as string) ?? 'note'] ?? []).slice().sort();
    return {
      id: r.id as string,
      notion_id: (r.notion_id as string | null) ?? null,
      updated_at: r.updated_at as string,
      canonical: {
        title: r.title ?? '(untitled)',
        description: r.body_md ?? null,
        area: undefined,
        multi,
      },
    };
  },

  async toSupabasePatch(page) {
    const p = (page as NotionPageLike).properties;
    const area = dSelect(p, 'Area');
    const multi = dMulti(p, 'Multi-select');
    const docType = multi.map((t) => DOC_MULTI_TO_KIND[t]).find(Boolean) ?? 'note';
    const venture_id = await ventureIdFromSlug(AREA_TO_VENTURE[area ?? ''] ?? null);
    return {
      title: dTitle(p, 'Document Name') ?? '(untitled)',
      doc_type: docType,
      mime_type: 'text/markdown',
      venture_id,
      body_md: dRich(p, 'Description'),
      source_url: (page as NotionPageLike).url ?? null,
      metadata: {
        notion_area: area,
        notion_multi_select: multi,
        notion_today: dCheck(p, 'Today'),
        notion_created_date: dDate(p, 'Created Time'),
      },
    };
  },

  async toNotionProperties(row) {
    const r = row as DocRowLike;
    const slug = await ventureSlugFromId((r.venture_id as string | null) ?? null);
    const area = slug ? VENTURE_TO_AREA[slug] ?? null : null;
    const multi = DOC_KIND_TO_MULTI[(r.doc_type as string) ?? 'note'] ?? [];

    const props: Record<string, unknown> = {
      'Document Name': eTitle((r.title as string | null) ?? '(untitled)'),
      Description: eRich((r.body_md as string | null) ?? null),
    };
    if (area) props.Area = eSelect(area);
    if (multi.length > 0) props['Multi-select'] = eMulti(multi);
    return props;
  },
};
