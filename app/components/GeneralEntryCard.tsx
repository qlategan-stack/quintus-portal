'use client';

import { useState } from 'react';
import type { GeneralEntry } from '@/data/general-entries';

function isWithinPastDays(dateIso: string, days: number): boolean {
  const t = new Date(dateIso + 'T00:00:00').getTime();
  if (Number.isNaN(t)) return false;
  const now = Date.now();
  return t <= now && now - t <= days * 86_400_000;
}

export default function GeneralEntryCard({
  entry,
  defaultOpen = false,
}: {
  entry: GeneralEntry;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const thisWeek = isWithinPastDays(entry.date, 7);

  return (
    <article className={`entry ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="entry-head"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <div className="entry-meta-row">
          <time className="entry-date" dateTime={entry.date}>{entry.date}</time>
          {thisWeek && <span className="badge week">This week</span>}
          <span className="entry-caret" aria-hidden="true">{open ? '−' : '+'}</span>
        </div>
        <h3 className="entry-title">{entry.title}</h3>
        {entry.mood && (
          <div className="entry-mood">
            <span className="label">Mood</span> {entry.mood}
          </div>
        )}
      </button>

      {open && (
        <div className="entry-body">
          {entry.bigIdea && (
            <section className="entry-section big-idea">
              <div className="kicker">Big Idea</div>
              <h4>{entry.bigIdea.headline}</h4>
              <p>{entry.bigIdea.body}</p>
            </section>
          )}

          {entry.concepts && entry.concepts.length > 0 && (
            <section className="entry-section">
              <div className="kicker">Core Concepts</div>
              <ul className="concept-list">
                {entry.concepts.map((c) => (
                  <li key={c.id}>
                    <h5>{c.title}</h5>
                    <p>{c.body}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {entry.actions && entry.actions.length > 0 && (
            <section className="entry-section">
              <div className="kicker">Action Items</div>
              <ul className="actions-list">
                {entry.actions.map((a, i) => (
                  <li key={i}>
                    <span className="prio" aria-hidden="true">{a.priority}</span>
                    <span>{a.text}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {entry.reflection && (
            <section className="entry-section reflection">
              <div className="kicker">Reflection</div>
              <blockquote>{entry.reflection}</blockquote>
            </section>
          )}

          {entry.note && (
            <section className="entry-section">
              <div className="kicker">Note</div>
              <p>{entry.note}</p>
            </section>
          )}
        </div>
      )}
    </article>
  );
}
