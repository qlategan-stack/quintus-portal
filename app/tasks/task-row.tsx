'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  completeTask,
  dropTask,
  getTaskDescription,
  setTaskDueAt,
  setTaskPriority,
  setTaskVenture,
  updateTaskDescription,
  updateTaskTitle,
} from './actions';
import type { OpenTaskRow, Priority, VentureRow } from '@/data/types';

const PRIORITY_EMOJI: Record<Priority, string> = {
  red: '🔴',
  yellow: '🟡',
  green: '🟢',
  blue: '🔵',
};

// Cycle order: red → yellow → green → blue → none → red.
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

type DescState =
  | { kind: 'idle' }       // not loaded yet
  | { kind: 'loading' }
  | { kind: 'loaded'; value: string }
  | { kind: 'error'; message: string };

export default function TaskRow({
  task,
  ventures,
}: {
  task: OpenTaskRow;
  ventures: VentureRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [editingDue, setEditingDue] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [desc, setDesc] = useState<DescState>({ kind: 'idle' });
  const [descDraft, setDescDraft] = useState('');
  const cancelRef = useRef(false);

  const due = formatDue(task.due_at);
  const currentVenture = ventures.find((v) => v.slug === task.venture_slug);

  // Lazy-load description on first expand. Subsequent expands use the cache.
  useEffect(() => {
    if (!expanded || desc.kind !== 'idle') return;
    setDesc({ kind: 'loading' });
    getTaskDescription(task.id)
      .then((d) => {
        const value = d ?? '';
        setDesc({ kind: 'loaded', value });
        setDescDraft(value);
      })
      .catch((e) => setDesc({ kind: 'error', message: String(e) }));
  }, [expanded, desc.kind, task.id]);

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
    const value = e.target.value || null;
    setEditingDue(false);
    startTransition(() => setTaskDueAt(task.id, value));
  }

  function onVentureChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value || null;
    startTransition(() => setTaskVenture(task.id, v));
  }

  function commitDescription() {
    if (desc.kind !== 'loaded') return;
    if (descDraft === desc.value) return;
    const newValue = descDraft;
    setDesc({ kind: 'loaded', value: newValue });
    startTransition(() => updateTaskDescription(task.id, newValue));
  }

  return (
    <li className={`task-row-wrap ${pending ? 'is-pending' : ''}`}>
      <div className="task-row">
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
            onClick={() => setExpanded((v) => !v)}
            className="task-action task-action-expand"
            title={expanded ? 'Collapse' : 'Expand details'}
            aria-label={expanded ? 'Collapse' : 'Expand details'}
            aria-expanded={expanded}
          >
            {expanded ? '▴' : '▾'}
          </button>
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
      </div>

      {expanded && (
        <div className="task-detail">
          <div className="task-detail-field">
            <label className="kicker" htmlFor={`desc-${task.id}`}>
              Description
            </label>
            {desc.kind === 'loading' && (
              <p className="task-detail-status">Loading…</p>
            )}
            {desc.kind === 'error' && (
              <p className="task-detail-status task-error">{desc.message}</p>
            )}
            {desc.kind === 'loaded' && (
              <textarea
                id={`desc-${task.id}`}
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                onBlur={commitDescription}
                placeholder="Add a description… (autosaves on blur)"
                className="task-detail-textarea"
                rows={Math.max(3, descDraft.split('\n').length)}
                disabled={pending}
              />
            )}
          </div>

          <div className="task-detail-field">
            <label className="kicker" htmlFor={`venture-${task.id}`}>
              Venture
            </label>
            <select
              id={`venture-${task.id}`}
              value={currentVenture?.id ?? ''}
              onChange={onVentureChange}
              disabled={pending}
              className="task-detail-select"
            >
              <option value="">— Unassigned —</option>
              {ventures.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </li>
  );
}
