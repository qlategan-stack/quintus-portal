'use client';

import { useRef, useState, useTransition } from 'react';
import {
  completeTask,
  dropTask,
  setTaskDueAt,
  setTaskPriority,
  updateTaskTitle,
} from './actions';
import type { OpenTaskRow, Priority } from '@/data/types';

const PRIORITY_EMOJI: Record<Priority, string> = {
  red: '🔴',
  yellow: '🟡',
  green: '🟢',
  blue: '🔵',
};

// Cycle order for click-to-change priority: red → yellow → green → blue → none → red.
const PRIORITY_CYCLE: (Priority | null)[] = ['red', 'yellow', 'green', 'blue', null];

function nextPriority(current: Priority | null): Priority | null {
  const idx = PRIORITY_CYCLE.indexOf(current);
  return PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length];
}

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

function isoDateOnly(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export default function TaskRow({ task }: { task: OpenTaskRow }) {
  const [pending, startTransition] = useTransition();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [editingDue, setEditingDue] = useState(false);
  const cancelRef = useRef(false);

  const due = formatDue(task.due_at);

  function onComplete() {
    startTransition(() => completeTask(task.id));
  }
  function onDrop() {
    startTransition(() => dropTask(task.id));
  }

  function onCyclePriority() {
    const next = nextPriority(task.priority ?? null);
    startTransition(() => setTaskPriority(task.id, next));
  }

  function startTitleEdit() {
    setTitleDraft(task.title);
    cancelRef.current = false;
    setEditingTitle(true);
  }

  function commitTitle() {
    const t = titleDraft.trim();
    setEditingTitle(false);
    if (cancelRef.current) {
      cancelRef.current = false;
      return;
    }
    if (!t || t === task.title) return;
    startTransition(() => updateTaskTitle(task.id, t));
  }

  function onTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      cancelRef.current = true;
      e.currentTarget.blur();
    }
  }

  function onDueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value || null; // empty string clears
    setEditingDue(false);
    startTransition(() => setTaskDueAt(task.id, value));
  }

  return (
    <li className={`task-row ${pending ? 'is-pending' : ''}`}>
      <button
        type="button"
        onClick={onCyclePriority}
        disabled={pending}
        className="task-priority task-priority-clickable"
        title="Click to cycle priority"
        aria-label={`Priority ${task.priority ?? 'none'} — click to change`}
      >
        {task.priority ? PRIORITY_EMOJI[task.priority] : '◦'}
      </button>

      {editingTitle ? (
        <input
          type="text"
          autoFocus
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onKeyDown={onTitleKeyDown}
          onBlur={commitTitle}
          className="task-title-input"
          aria-label="Edit title"
        />
      ) : (
        <button
          type="button"
          onClick={startTitleEdit}
          disabled={pending}
          className="task-title task-title-clickable"
          title="Click to edit"
        >
          {task.title}
        </button>
      )}

      {task.project_title && (
        <span className="task-project" title="Project">{task.project_title}</span>
      )}

      {editingDue ? (
        <input
          type="date"
          autoFocus
          defaultValue={isoDateOnly(task.due_at)}
          onChange={onDueChange}
          onBlur={() => setEditingDue(false)}
          className="task-due-input"
          aria-label="Edit due date"
        />
      ) : due ? (
        <button
          type="button"
          onClick={() => setEditingDue(true)}
          disabled={pending}
          className={`task-due task-due-${due.tone} task-due-clickable`}
          title="Click to change due date"
        >
          {due.text}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setEditingDue(true)}
          disabled={pending}
          className="task-due task-due-add"
          title="Set due date"
        >
          + date
        </button>
      )}

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
