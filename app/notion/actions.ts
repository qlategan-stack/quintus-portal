'use server';

// ─────────────────────────────────────────────────────────────────────────
//  Sync Server Actions.
//  Orchestrates the three entity-kind syncs (tasks, meetings, documents)
//  and returns a flat per-kind summary for the UI.
// ─────────────────────────────────────────────────────────────────────────

import { revalidatePath } from 'next/cache';
import { syncEntity, type EntityKind, type SyncCounts } from '@/app/lib/notion/sync';
import { tasksMapper } from '@/app/lib/notion/tasks';
import { meetingsMapper } from '@/app/lib/notion/meetings';
import { documentsMapper } from '@/app/lib/notion/documents';

export type SyncSummary = {
  startedAt: string;
  finishedAt: string;
  byKind: Record<EntityKind, SyncCounts>;
  ok: boolean;
};

export async function runSync(): Promise<SyncSummary> {
  const startedAt = new Date().toISOString();
  const byKind: Record<EntityKind, SyncCounts> = {
    task:     await syncEntity(tasksMapper).catch(toErrorCounts),
    meeting:  await syncEntity(meetingsMapper).catch(toErrorCounts),
    document: await syncEntity(documentsMapper).catch(toErrorCounts),
  };
  const finishedAt = new Date().toISOString();
  const ok = Object.values(byKind).every((c) => c.errors.length === 0);
  revalidatePath('/notion');
  revalidatePath('/tasks');
  return { startedAt, finishedAt, byKind, ok };
}

function toErrorCounts(e: unknown): SyncCounts {
  return {
    pulled: 0,
    pushed: 0,
    inserted_supabase: 0,
    inserted_notion: 0,
    conflicts: 0,
    skipped: 0,
    errors: [{ id: '*', message: e instanceof Error ? e.message : String(e) }],
  };
}
