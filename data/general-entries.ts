// ─────────────────────────────────────────────────────────────────────────
//  General Entries — adapter
//
//  Source of truth: Supabase `general_entries` + `entry_concepts` +
//  `entry_actions`, pulled at build time by `scripts/fetch-snapshot.ts`
//  into `data/snapshot/general-entries.json`. This file shapes that
//  snapshot back into the existing GeneralEntry type so app/page.tsx and
//  app/components/GeneralEntryCard.tsx don't have to change.
//
//  To add a new entry: edit it in Supabase Studio (Table editor →
//  general_entries / entry_concepts / entry_actions). Next snapshot run
//  picks it up; cron rebuilds Pages every 30 min.
// ─────────────────────────────────────────────────────────────────────────

import snapshot from './snapshot/general-entries.json';
import type { GeneralEntrySnapshot } from './snapshot/types';

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

const PRIORITY_EMOJI: Record<'red' | 'yellow' | 'green' | 'blue', ActionPriority> = {
  red:    '🔴',
  yellow: '🟡',
  green:  '🟢',
  blue:   '🔵',
};

function adapt(s: GeneralEntrySnapshot): GeneralEntry {
  const entry: GeneralEntry = {
    date: s.entry_date,
    title: s.title,
  };
  if (s.mood) entry.mood = s.mood;
  if (s.big_idea_headline) {
    entry.bigIdea = {
      headline: s.big_idea_headline,
      body: s.big_idea_body ?? '',
    };
  }
  const concepts = (s.entry_concepts ?? []).map((c) => ({
    id: c.slug,
    title: c.title,
    body: c.body,
  }));
  if (concepts.length > 0) entry.concepts = concepts;

  const actions = (s.entry_actions ?? []).map((a) => ({
    priority: PRIORITY_EMOJI[a.priority],
    text: a.text,
  }));
  if (actions.length > 0) entry.actions = actions;

  if (s.reflection) entry.reflection = s.reflection;
  if (s.note) entry.note = s.note;
  return entry;
}

export const generalEntries: GeneralEntry[] =
  (snapshot as unknown as GeneralEntrySnapshot[]).map(adapt);
