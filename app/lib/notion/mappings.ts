// ─────────────────────────────────────────────────────────────────────────
//  Bidirectional value maps between Notion select-option strings and the
//  Supabase enum values they correspond to. Inverted from the import
//  script's one-way maps so we can write both directions.
//
//  Where the enums don't fully overlap (e.g. Supabase 'doing'/'blocked'
//  have no Notion equivalent), the reverse mapping picks a sensible
//  Notion-side default. Round-tripping those states from Notion is
//  best-effort: doing/blocked tasks pushed to Notion show as "Action
//  Required" and would come back as 'todo' if Notion were authoritative.
//  Acceptable for v1 — there are zero doing/blocked tasks today, and
//  conflict logic will preserve Supabase's specific value when no actual
//  Notion edit happened.
// ─────────────────────────────────────────────────────────────────────────

import 'server-only';
import type { Priority, TaskStatus } from '@/data/types';

// ── Area (Notion) ↔ venture slug (Supabase) ──────────────────────────────

export const AREA_TO_VENTURE: Record<string, string | null> = {
  GOD: null,
  Quintus: null,
  Olympic: 'olympic',
  Timion: 'timion',
  Flomatic: 'flowmatic',
};

export const VENTURE_TO_AREA: Record<string, string | null> = {
  olympic: 'Olympic',
  timion: 'Timion',
  flowmatic: 'Flomatic',
  // ventures without a Notion Area option get null — sync writes the
  // page without setting Area rather than failing on an unknown option.
  flowtrader: null,
  jbay: null,
  mcaa: null,
  tradecraft: null,
};

// ── Importance (Notion) ↔ priority (Supabase) ────────────────────────────

export const IMPORTANCE_TO_PRIORITY: Record<string, Priority> = {
  Urget: 'red', // typo in Notion select preserved
  High: 'yellow',
  Medium: 'green',
  Low: 'blue',
};

export const PRIORITY_TO_IMPORTANCE: Record<Priority, string> = {
  red: 'Urget',
  yellow: 'High',
  green: 'Medium',
  blue: 'Low',
};

// ── Action Required (Notion) ↔ status (Supabase) ─────────────────────────

export const ACTION_TO_STATUS: Record<string, TaskStatus> = {
  'Action Required': 'todo',
  'FYI Only': 'dropped',
  Completed: 'done',
};

export const STATUS_TO_ACTION: Record<TaskStatus, string> = {
  todo: 'Action Required',
  doing: 'Action Required',
  blocked: 'Action Required',
  done: 'Completed',
  dropped: 'FYI Only',
};

// ── Customer (Notion) ↔ venture slug (Supabase) — meetings ───────────────

export const CUSTOMER_TO_VENTURE: Record<string, string | null> = {
  Olympic: 'olympic',
  Timion: 'timion',
  JBMN: null,
  PLR: null,
};

export const VENTURE_TO_CUSTOMER: Record<string, string | null> = {
  olympic: 'Olympic',
  timion: 'Timion',
  // others have no Notion Customer option
};

// ── Meeting type (Notion) ↔ meeting_kind (Supabase) ──────────────────────

export const MEETING_TYPE_TO_KIND: Record<
  string,
  'general' | 'sales' | 'ops' | 'hr' | 'customer'
> = {
  Sales: 'sales',
  Operations: 'ops',
  Marketing: 'general',
  Contractors: 'general',
  Strategic: 'general',
  Exco: 'general',
  Discovery: 'sales',
};

// Reverse: pick the most representative Notion option per kind.
export const MEETING_KIND_TO_TYPE: Record<string, string> = {
  general: 'Strategic',
  sales: 'Sales',
  ops: 'Operations',
  hr: 'Strategic',
  customer: 'Sales',
  finances: 'Strategic',
  outreach: 'Marketing',
  production: 'Operations',
  supply_chain: 'Operations',
};

// ── Document multi-select (Notion) ↔ doc_kind (Supabase) ─────────────────

export const DOC_MULTI_TO_KIND: Record<string, 'sop' | 'template'> = {
  SOP: 'sop',
  'Job Description': 'template',
};

export const DOC_KIND_TO_MULTI: Record<string, string[]> = {
  sop: ['SOP'],
  template: ['Job Description'],
  // other doc kinds get no multi-select tags
  runbook: [],
  contract: [],
  iso: [],
  report: [],
  note: [],
  email: [],
  spec: [],
  minutes: [],
  other: [],
};
