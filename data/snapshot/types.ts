/**
 * Snapshot types — generated shapes from Supabase, consumed by the static portal.
 * Do NOT edit by hand; mirror schema changes here when you add columns.
 */

export type Priority = 'red' | 'yellow' | 'green' | 'blue';

// Map back to existing emoji UI:
export const PRIORITY_EMOJI: Record<Priority, '🔴' | '🟡' | '🟢' | '🔵'> = {
  red:    '🔴',
  yellow: '🟡',
  green:  '🟢',
  blue:   '🔵',
};

export type VentureSnapshot = {
  id: string;
  slug: 'olympic' | 'flowmatic' | 'timion' | 'jbay' | 'tradecraft' | 'flowtrader' | 'mcaa' | string;
  name: string;
  entity_type: 'operating_company' | 'consultancy' | 'npo' | 'property' | 'product';
  parent_id: string | null;
  legal_entity: string | null;
  quintus_role: string | null;
  status: 'active' | 'paused' | 'archived';
  brief_md: string | null;
  metadata: Record<string, unknown>;
};

export type EntryConceptSnapshot = {
  id: string;
  slug: string;
  title: string;
  body: string;
  ord: number;
};

export type EntryActionSnapshot = {
  id: string;
  priority: Priority;
  text: string;
  ord: number;
  task_id: string | null;
};

export type GeneralEntrySnapshot = {
  id: string;
  entry_date: string; // YYYY-MM-DD
  title: string;
  mood: string | null;
  big_idea_headline: string | null;
  big_idea_body: string | null;
  reflection: string | null;
  note: string | null;
  entry_concepts: EntryConceptSnapshot[];
  entry_actions: EntryActionSnapshot[];
};

export type TaskSnapshot = {
  id: string;
  title: string;
  priority: Priority | null;
  status: 'todo' | 'doing' | 'blocked';
  due_at: string | null;
  venture_slug: string | null;
  venture_name: string | null;
  project_title: string | null;
  assignee_name: string | null;
};

export type MeetingSnapshot = {
  id: string;
  title: string;
  held_at: string;
  meeting_type: string;
  venture_slug: string | null;
  attendee_count: number;
};

export type AgentSnapshot = {
  id: string;
  slug: string;
  name: string;
  role: 'orchestrator' | 'specialist' | 'filing' | 'intake';
  model: string | null;
  status: 'active';
  venture_slug: string | null;
};

export type WorkflowSnapshot = {
  id: string;
  name: string;
  description: string | null;
  platform: 'n8n' | 'make' | 'github_actions' | 'claude_code' | 'manual_script';
  venture_id: string | null;
  external_url: string | null;
  trigger_type: 'manual' | 'schedule' | 'webhook' | 'file_watcher';
  status: 'active' | 'paused' | 'broken' | 'draft';
  last_run_at: string | null;
};

export type SnapshotMeta = {
  builtAt: string;
  source: 'supabase' | 'empty-fallback';
  counts: {
    ventures: number;
    generalEntries: number;
    openTasks: number;
    recentMeetings: number;
    agents: number;
    workflows: number;
  };
};
