'use client';

import { useTransition } from 'react';
import { completeTask, dropTask } from './actions';
import type { OpenTaskRow, Priority } from '@/data/types';

const PRIORITY_EMOJI: Record<Priority, string> = {
  red: '🔴',
  yellow: '🟡',
  green: '🟢',
  blue: '🔵',
};

function formatDue(iso: string | null): { text: string; tone: 'overdue' | 'soon' | 'normal' } | null {
  if (!iso) return null;
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  const text = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (days < 0) return { text: `${text} · ${-days}d overdue`, tone: 'overdue' };
  if (days === 0) return { text: `${text} · today`, tone: 'soon' };
  if (days <= 7) return { text: `${text} · in ${days}d`, tone: 'soon' };
  return { text, tone: 'normal' };
}

export default function TaskRow({ task }: { task: OpenTaskRow }) {
  const [pending, startTransition] = useTransition();
  const due = formatDue(task.due_at);

  function onComplete() {
    startTransition(() => completeTask(task.id));
  }
  function onDrop() {
    startTransition(() => dropTask(task.id));
  }

  return (
    <li className={`task-row ${pending ? 'is-pending' : ''}`}>
      <span className="task-priority" aria-label={`Priority ${task.priority ?? 'none'}`}>
        {task.priority ? PRIORITY_EMOJI[task.priority] : '◦'}
      </span>
      <span className="task-title">{task.title}</span>
      {task.project_title && (
        <span className="task-project" title="Project">{task.project_title}</span>
      )}
      {due && <span className={`task-due task-due-${due.tone}`}>{due.text}</span>}
      <div className="task-actions">
        <button
          type="button"
          onClick={onComplete}
          disabled={pending}
          className="task-action task-action-done"
          title="Mark done"
          aria-label="Mark done"
        >
          ✓
        </button>
        <button
          type="button"
          onClick={onDrop}
          disabled={pending}
          className="task-action task-action-drop"
          title="Drop"
          aria-label="Drop"
        >
          ✗
        </button>
      </div>
    </li>
  );
}
