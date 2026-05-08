'use client';

import { useState, useTransition } from 'react';
import { addTask } from './actions';
import type { Priority, VentureRow } from '@/data/types';

const PRIORITY_BUTTONS: { value: Priority; emoji: string; label: string }[] = [
  { value: 'red',    emoji: '🔴', label: 'Red' },
  { value: 'yellow', emoji: '🟡', label: 'Yellow' },
  { value: 'green',  emoji: '🟢', label: 'Green' },
  { value: 'blue',   emoji: '🔵', label: 'Blue' },
];

export default function AddTaskForm({ ventures }: { ventures: VentureRow[] }) {
  const [priority, setPriority] = useState<Priority | ''>('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await addTask(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      form.reset();
      setPriority('');
    });
  }

  return (
    <form onSubmit={onSubmit} className="task-add">
      <div className="task-add-row">
        <input
          name="title"
          type="text"
          placeholder="New task…"
          required
          disabled={pending}
          className="task-input task-input-title"
          autoComplete="off"
        />
        <select
          name="venture_id"
          required
          disabled={pending}
          className="task-input task-input-venture"
          defaultValue=""
        >
          <option value="" disabled>Venture…</option>
          {ventures.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="task-add-submit"
        >
          {pending ? 'Adding…' : 'Add'}
        </button>
      </div>
      <div className="task-add-row task-add-meta">
        <input type="hidden" name="priority" value={priority} />
        <div className="task-priority-picker">
          {PRIORITY_BUTTONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(priority === p.value ? '' : p.value)}
              className={`task-priority-btn ${priority === p.value ? 'is-selected' : ''}`}
              aria-label={`Priority ${p.label}`}
              aria-pressed={priority === p.value}
              disabled={pending}
            >
              {p.emoji}
            </button>
          ))}
          {priority && (
            <button
              type="button"
              onClick={() => setPriority('')}
              className="task-priority-clear"
              aria-label="Clear priority"
              disabled={pending}
            >
              clear
            </button>
          )}
        </div>
        <input
          name="due_at"
          type="date"
          disabled={pending}
          className="task-input task-input-due"
          aria-label="Due date"
        />
      </div>
      {error && <p className="task-error">{error}</p>}
    </form>
  );
}
