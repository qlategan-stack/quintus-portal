'use client';

import { useEffect, useState } from 'react';
import TaskRow from './task-row';
import type { OpenTaskRow, VentureRow } from '@/data/types';

const STORAGE_PREFIX = 'qp.tasks.expanded.';

export default function VentureGroup({
  venture,
  tasks,
  allVentures,
  defaultOpen = false,
}: {
  venture: Pick<VentureRow, 'slug' | 'name'> | { slug: '__unassigned__'; name: string };
  tasks: OpenTaskRow[];
  allVentures: VentureRow[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  // Read persisted state after mount — avoids SSR/CSR mismatch.
  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_PREFIX + venture.slug);
      if (v === '1') setOpen(true);
      if (v === '0') setOpen(false);
    } catch {
      // localStorage may be unavailable (private mode, etc.) — silent fallback.
    }
  }, [venture.slug]);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_PREFIX + venture.slug, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <section className={`venture-group ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        onClick={toggle}
        className="venture-head"
        aria-expanded={open}
      >
        <span className="venture-caret" aria-hidden="true">{open ? '−' : '+'}</span>
        <span className="venture-name">{venture.name}</span>
        <span className="venture-count">
          {tasks.length} {tasks.length === 1 ? 'open' : 'open'}
        </span>
      </button>
      {open && (
        <ul className="task-list">
          {tasks.length === 0 ? (
            <li className="task-empty">No open tasks.</li>
          ) : (
            tasks.map((t) => <TaskRow key={t.id} task={t} ventures={allVentures} />)
          )}
        </ul>
      )}
    </section>
  );
}
