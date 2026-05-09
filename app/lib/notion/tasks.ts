// ─────────────────────────────────────────────────────────────────────────
//  Tasks — sync mapper.
//  Bidirectional translation between Notion's task DB pages and Supabase
//  public.tasks rows.
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
  dUrl,
  eDate,
  eRich,
  eSelect,
  eTitle,
} from './encoders';
import {
  ACTION_TO_STATUS,
  AREA_TO_VENTURE,
  IMPORTANCE_TO_PRIORITY,
  PRIORITY_TO_IMPORTANCE,
  STATUS_TO_ACTION,
  VENTURE_TO_AREA,
} from './mappings';
import type { SyncMapper } from './sync';
import type { Priority, TaskStatus } from '@/data/types';

const TASK_DB_ID = '247ff48d-2bb1-800c-a00a-ca3b59f789eb';

const ventureSlugCache = new Map<string, string | null>();
const ventureIdCache = new Map<string, string | null>();

async function ventureIdFromSlug(slug: string | null): Promise<string | null> {
  if (!slug) return null;
  if (ventureSlugCache.has(slug)) return ventureSlugCache.get(slug)!;
  const { data } = await getServerSupabase()
    .from('ventures')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  const id = (data?.id as string | undefined) ?? null;
  ventureSlugCache.set(slug, id);
  return id;
}

async function ventureSlugFromId(id: string | null): Promise<string | null> {
  if (!id) return null;
  if (ventureIdCache.has(id)) return ventureIdCache.get(id)!;
  const { data } = await getServerSupabase()
    .from('ventures')
    .select('slug')
    .eq('id', id)
    .maybeSingle();
  const slug = (data?.slug as string | undefined) ?? null;
  ventureIdCache.set(id, slug);
  return slug;
}

type NotionPageLike = {
  id: string;
  last_edited_time: string;
  properties: Record<string, unknown>;
  url?: string;
};

type TaskRowLike = Record<string, unknown> & {
  id: string;
  notion_id: string | null;
  updated_at: string;
};

export const tasksMapper: SyncMapper = {
  kind: 'task',
  notionDbId: TASK_DB_ID,
  supabaseTable: 'tasks',

  fromNotion(page) {
    const p = (page as NotionPageLike).properties;
    const importance = dSelect(p, 'Importance');
    const action = dSelect(p, 'Action Required');
    const area = dSelect(p, 'Area');
    return {
      canonical: {
        title: dTitle(p, 'Name') ?? '(untitled)',
        description: dRich(p, 'Description'),
        priority: importance ? IMPORTANCE_TO_PRIORITY[importance] ?? null : null,
        status: action ? ACTION_TO_STATUS[action] ?? 'todo' : 'todo',
        due_at: dDate(p, 'Due Date'),
        area, // Notion-only, kept in canonical so changes here trigger a sync
      },
      last_edited_time: (page as NotionPageLike).last_edited_time,
    };
  },

  fromSupabase(row) {
    const r = row as TaskRowLike;
    return {
      id: r.id as string,
      notion_id: (r.notion_id as string | null) ?? null,
      updated_at: r.updated_at as string,
      canonical: {
        title: r.title ?? '(untitled)',
        description: r.description ?? null,
        priority: (r.priority as Priority | null) ?? null,
        status: r.status as TaskStatus,
        due_at: r.due_at ?? null,
        area: undefined, // not represented Supabase-side
      },
    };
  },

  async toSupabasePatch(page) {
    const p = (page as NotionPageLike).properties;
    const area = dSelect(p, 'Area');
    const importance = dSelect(p, 'Importance');
    const action = dSelect(p, 'Action Required');
    const venture_id = await ventureIdFromSlug(AREA_TO_VENTURE[area ?? ''] ?? null);
    return {
      title: dTitle(p, 'Name') ?? '(untitled)',
      description: dRich(p, 'Description'),
      venture_id,
      priority: importance ? IMPORTANCE_TO_PRIORITY[importance] ?? null : null,
      status: action ? ACTION_TO_STATUS[action] ?? 'todo' : 'todo',
      due_at: dDate(p, 'Due Date'),
      source_url: dUrl(p, 'userDefined:URL') ?? dUrl(p, 'Email Link') ?? (page as NotionPageLike).url ?? null,
      metadata: {
        notion_area: area,
        notion_action_required: action,
        notion_importance: importance,
        notion_status: dSelect(p, 'Status'),
        notion_category: dSelect(p, 'Category'),
        notion_collaborators: dMulti(p, 'Colaborator '),
        notion_today: dCheck(p, 'Today'),
        notion_archive: dCheck(p, 'Archive'),
      },
    };
  },

  async toNotionProperties(row) {
    const r = row as TaskRowLike;
    const slug = await ventureSlugFromId((r.venture_id as string | null) ?? null);
    const area = slug ? VENTURE_TO_AREA[slug] ?? null : null;
    const priority = (r.priority as Priority | null) ?? null;
    const status = r.status as TaskStatus;

    const props: Record<string, unknown> = {
      Name: eTitle((r.title as string | null) ?? '(untitled)'),
      Description: eRich((r.description as string | null) ?? null),
      Importance: eSelect(priority ? PRIORITY_TO_IMPORTANCE[priority] : null),
      'Action Required': eSelect(STATUS_TO_ACTION[status]),
      'Due Date': eDate((r.due_at as string | null) ?? null),
    };
    // Only set Area if we have a mapping; otherwise leave whatever Notion has.
    if (area) props.Area = eSelect(area);
    return props;
  },
};
