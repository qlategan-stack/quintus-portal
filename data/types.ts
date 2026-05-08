// ─────────────────────────────────────────────────────────────────────────
//  Shared DB-shaped types — mirror Supabase schema.
//  Moved here from data/snapshot/types.ts when the snapshot pipeline was
//  retired. Server Components consume these directly via the supabase-server
//  client.
// ─────────────────────────────────────────────────────────────────────────

export type Priority = 'red' | 'yellow' | 'green' | 'blue';

export const PRIORITY_EMOJI: Record<Priority, '🔴' | '🟡' | '🟢' | '🔵'> = {
  red:    '🔴',
  yellow: '🟡',
  green:  '🟢',
  blue:   '🔵',
};

export type VentureRow = {
  id: string;
  slug: string;
  name: string;
  entity_type: 'operating_company' | 'consultancy' | 'npo' | 'property' | 'product';
  parent_id: string | null;
  legal_entity: string | null;
  quintus_role: string | null;
  status: 'active' | 'paused' | 'archived';
  brief_md: string | null;
  metadata: Record<string, unknown>;
};

export type EntryConceptRow = {
  id: string;
  slug: string;
  title: string;
  body: string;
  ord: number;
};

export type EntryActionRow = {
  id: string;
  priority: Priority;
  text: string;
  ord: number;
  task_id: string | null;
};

export type GeneralEntryRow = {
  id: string;
  entry_date: string;
  title: string;
  mood: string | null;
  big_idea_headline: string | null;
  big_idea_body: string | null;
  reflection: string | null;
  note: string | null;
  entry_concepts: EntryConceptRow[];
  entry_actions: EntryActionRow[];
};

export type TaskRow = {
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

export type MeetingRow = {
  id: string;
  title: string;
  held_at: string;
  meeting_type: string;
  venture_slug: string | null;
  attendee_count: number;
};

export type AgentRow = {
  id: string;
  slug: string;
  name: string;
  role: 'orchestrator' | 'specialist' | 'filing' | 'intake';
  model: string | null;
  status: 'active';
  venture_slug: string | null;
};

export type WorkflowRow = {
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
