// ─────────────────────────────────────────────────────────────────────────
//  General Entries — live Supabase query.
//
//  Phase 1 of the static-export → dynamic-Vercel migration: the build-time
//  snapshot is gone. This module now exposes an async fetcher that runs in
//  Server Components and queries Supabase at request time.
//
//  To add a new entry: edit it in Supabase Studio. The next page load picks
//  it up — no rebuild required.
// ─────────────────────────────────────────────────────────────────────────

import 'server-only';
import { getServerSupabase } from '@/app/lib/supabase-server';
import {
  PRIORITY_EMOJI,
  type GeneralEntryRow,
} from './types';

export type Concept = { id: string; title: string; body: string };

export type ActionPriority = '🔴' | '🟡' | '🟢' | '🔵';
export type ActionItem = { priority: ActionPriority; text: string };

export type GeneralEntry = {
  /** ISO date — YYYY-MM-DD */
  date: string;
  title: string;
  mood?: string;
  bigIdea?: { headline: string; body: string };
  concepts?: Concept[];
  actions?: ActionItem[];
  reflection?: string;
  /** Free-form note for entries that don't fit the structured shape */
  note?: string;
};

function adapt(row: GeneralEntryRow): GeneralEntry {
  const entry: GeneralEntry = {
    date: row.entry_date,
    title: row.title,
  };
  if (row.mood) entry.mood = row.mood;
  if (row.big_idea_headline) {
    entry.bigIdea = {
      headline: row.big_idea_headline,
      body: row.big_idea_body ?? '',
    };
  }
  const concepts = (row.entry_concepts ?? [])
    .slice()
    .sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0))
    .map((c) => ({ id: c.slug, title: c.title, body: c.body }));
  if (concepts.length > 0) entry.concepts = concepts;

  const actions = (row.entry_actions ?? [])
    .slice()
    .sort((a, b) => (a.ord ?? 0) - (b.ord ?? 0))
    .map((a) => ({ priority: PRIORITY_EMOJI[a.priority], text: a.text }));
  if (actions.length > 0) entry.actions = actions;

  if (row.reflection) entry.reflection = row.reflection;
  if (row.note) entry.note = row.note;
  return entry;
}

export async function getGeneralEntries(): Promise<GeneralEntry[]> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('general_entries')
    .select(
      'id, entry_date, title, mood, big_idea_headline, big_idea_body, reflection, note, ' +
        'entry_concepts ( id, slug, title, body, ord ), ' +
        'entry_actions  ( id, priority, text, ord, task_id )',
    )
    .order('entry_date', { ascending: false });

  if (error) {
    console.error('general_entries query failed:', error.message);
    return [];
  }
  return ((data ?? []) as unknown as GeneralEntryRow[]).map(adapt);
}
