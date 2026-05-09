// ─────────────────────────────────────────────────────────────────────────
//  Tasks — read-side fetchers.
//
//  Reads use v_open_tasks (already filters status NOT IN ('done','dropped')
//  and joins ventures/projects/people for display). Writes go to the base
//  tasks table via Server Actions in app/tasks/actions.ts.
//
//  Sort is applied in JS rather than SQL so we can express the priority
//  ordering (red > yellow > green > blue > none) without a CASE clause.
// ─────────────────────────────────────────────────────────────────────────

import 'server-only';
import { getServerSupabase } from '@/app/lib/supabase-server';
import type { OpenTaskRow, Priority, ProjectRow, VentureRow } from './types';

const PRIORITY_ORDER: Record<Priority, number> = {
  red: 1,
  yellow: 2,
  green: 3,
  blue: 4,
};

function priorityRank(p: Priority | null): number {
  return p ? PRIORITY_ORDER[p] : 5;
}

function dueRank(d: string | null): number {
  return d ? new Date(d).getTime() : Number.POSITIVE_INFINITY;
}

export async function getOpenTasks(): Promise<OpenTaskRow[]> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('v_open_tasks')
    .select('id, title, priority, status, due_at, venture_slug, venture_name, project_title, assignee_name');

  if (error) {
    console.error('v_open_tasks query failed:', error.message);
    return [];
  }
  const rows = (data ?? []) as OpenTaskRow[];
  rows.sort((a, b) => {
    const dp = priorityRank(a.priority) - priorityRank(b.priority);
    if (dp !== 0) return dp;
    return dueRank(a.due_at) - dueRank(b.due_at);
  });
  return rows;
}

export async function getActiveVentures(): Promise<VentureRow[]> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('ventures')
    .select(
      'id, slug, name, entity_type, parent_id, legal_entity, quintus_role, status, brief_md, metadata',
    )
    .eq('status', 'active')
    .order('name');

  if (error) {
    console.error('ventures query failed:', error.message);
    return [];
  }
  return (data ?? []) as VentureRow[];
}

export async function getActiveProjects(): Promise<ProjectRow[]> {
  const sb = getServerSupabase();
  const { data, error } = await sb
    .from('projects')
    .select('id, venture_id, title, description, para_category, status')
    .in('status', ['active', 'paused'])
    .order('title');

  if (error) {
    console.error('projects query failed:', error.message);
    return [];
  }
  return (data ?? []) as ProjectRow[];
}
