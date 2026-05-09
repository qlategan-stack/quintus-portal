// ─────────────────────────────────────────────────────────────────────────
//  Meetings — sync mapper.
// ─────────────────────────────────────────────────────────────────────────

import 'server-only';
import { getServerSupabase } from '@/app/lib/supabase-server';
import {
  dDate,
  dMulti,
  dSelect,
  dTitle,
  dUrl,
  eDate,
  eSelect,
  eTitle,
  normalizeIso,
} from './encoders';
import {
  CUSTOMER_TO_VENTURE,
  MEETING_KIND_TO_TYPE,
  MEETING_TYPE_TO_KIND,
  VENTURE_TO_CUSTOMER,
} from './mappings';
import type { SyncMapper } from './sync';

const MM_DB_ID = '247ff48d-2bb1-8009-979b-d25bac9fe72e';

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
  created_time: string;
};

type MeetingRowLike = Record<string, unknown> & {
  id: string;
  notion_id: string | null;
  updated_at: string;
};

export const meetingsMapper: SyncMapper = {
  kind: 'meeting',
  notionDbId: MM_DB_ID,
  supabaseTable: 'meetings',

  fromNotion(page) {
    const p = (page as NotionPageLike).properties;
    return {
      canonical: {
        title: dTitle(p, 'Name') ?? '(untitled)',
        meeting_type: MEETING_TYPE_TO_KIND[dSelect(p, 'Meeting Type') ?? ''] ?? 'general',
        held_at: normalizeIso(dDate(p, 'Date') ?? (page as NotionPageLike).created_time),
      },
      last_edited_time: (page as NotionPageLike).last_edited_time,
    };
  },

  fromSupabase(row) {
    const r = row as MeetingRowLike;
    return {
      id: r.id as string,
      notion_id: (r.notion_id as string | null) ?? null,
      updated_at: r.updated_at as string,
      canonical: {
        title: r.title ?? '(untitled)',
        meeting_type: r.meeting_type ?? 'general',
        held_at: normalizeIso(r.held_at as string | null),
      },
    };
  },

  async toSupabasePatch(page) {
    const p = (page as NotionPageLike).properties;
    const customer = dSelect(p, 'Customer');
    const meetingType = dSelect(p, 'Meeting Type');
    const venture_id = await ventureIdFromSlug(CUSTOMER_TO_VENTURE[customer ?? ''] ?? null);
    const heldAt = dDate(p, 'Date') ?? (page as NotionPageLike).created_time;
    return {
      title: dTitle(p, 'Name') ?? '(untitled)',
      meeting_type: meetingType ? MEETING_TYPE_TO_KIND[meetingType] ?? 'general' : 'general',
      held_at: heldAt,
      venture_id,
      source_url: dUrl(p, 'userDefined:URL') ?? (page as NotionPageLike).url ?? null,
      metadata: {
        notion_customer: customer,
        notion_meeting_type: meetingType,
        notion_attendees: dMulti(p, 'Attendees'),
        notion_meeting_date: dDate(p, 'Meeting Date'),
      },
    };
  },

  async toNotionProperties(row) {
    const r = row as MeetingRowLike;
    const slug = await ventureSlugFromId((r.venture_id as string | null) ?? null);
    const customer = slug ? VENTURE_TO_CUSTOMER[slug] ?? null : null;
    const kind = (r.meeting_type as string) ?? 'general';
    const meetingType = MEETING_KIND_TO_TYPE[kind] ?? null;

    const props: Record<string, unknown> = {
      Name: eTitle((r.title as string | null) ?? '(untitled)'),
      Date: eDate((r.held_at as string | null) ?? null),
    };
    if (meetingType) props['Meeting Type'] = eSelect(meetingType);
    if (customer) props.Customer = eSelect(customer);
    return props;
  },
};
