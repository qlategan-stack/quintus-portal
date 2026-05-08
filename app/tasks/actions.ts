'use server';

// ─────────────────────────────────────────────────────────────────────────
//  Server Actions for the Tasks surface.
//
//  All mutations go through here, run on the server, use the service-role
//  Supabase client, and call revalidatePath('/tasks') so the UI re-renders
//  with fresh data on the next round-trip. The client-side useTransition
//  hook in row/form components handles pending state visually.
//
//  No auth context — Phase 2 was rolled back. URL obscurity is the only
//  gate. Don't expose this app publicly.
// ─────────────────────────────────────────────────────────────────────────

import { revalidatePath } from 'next/cache';
import { getServerSupabase } from '@/app/lib/supabase-server';
import type { Priority, TaskStatus } from '@/data/types';

const VALID_PRIORITIES: Priority[] = ['red', 'yellow', 'green', 'blue'];
const VALID_OPEN_STATUSES: TaskStatus[] = ['todo', 'doing', 'blocked'];

function asPriority(v: unknown): Priority | null {
  return typeof v === 'string' && (VALID_PRIORITIES as string[]).includes(v)
    ? (v as Priority)
    : null;
}

function asString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function asDateOrNull(v: unknown): string | null {
  const s = asString(v);
  if (!s) return null;
  // Accepts YYYY-MM-DD (HTML date input). Store as date at local-noon UTC
  // so timezone wobble doesn't shift the displayed date.
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T12:00:00Z` : null;
}

export type AddTaskResult =
  | { ok: true }
  | { ok: false; error: string };

export async function addTask(formData: FormData): Promise<AddTaskResult> {
  const title = asString(formData.get('title'));
  const ventureId = asString(formData.get('venture_id'));
  const priority = asPriority(formData.get('priority'));
  const dueAt = asDateOrNull(formData.get('due_at'));

  if (!title) return { ok: false, error: 'Title is required.' };
  if (!ventureId) return { ok: false, error: 'Venture is required.' };

  const sb = getServerSupabase();
  const { error } = await sb.from('tasks').insert({
    title,
    venture_id: ventureId,
    priority,
    due_at: dueAt,
    status: 'todo',
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath('/tasks');
  return { ok: true };
}

export async function completeTask(id: string): Promise<void> {
  const sb = getServerSupabase();
  const { error } = await sb
    .from('tasks')
    .update({ status: 'done', completed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/tasks');
}

export async function dropTask(id: string): Promise<void> {
  const sb = getServerSupabase();
  const { error } = await sb
    .from('tasks')
    .update({ status: 'dropped' })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/tasks');
}

export async function setTaskStatus(id: string, status: TaskStatus): Promise<void> {
  if (!VALID_OPEN_STATUSES.includes(status) && status !== 'done' && status !== 'dropped') {
    throw new Error(`invalid status: ${status}`);
  }
  const patch: Record<string, unknown> = { status };
  if (status === 'done') patch.completed_at = new Date().toISOString();
  if (status !== 'done') patch.completed_at = null;

  const sb = getServerSupabase();
  const { error } = await sb.from('tasks').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/tasks');
}
