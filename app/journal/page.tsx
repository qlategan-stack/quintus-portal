'use client';

import { useState } from 'react';
import Link from 'next/link';

type Concept = { id: string; title: string; body: string };
type Action = { priority: '🔴' | '🟡' | '🟢' | '🔵'; text: string };

type Entry = {
  date: string;
  dayOfYear: number;
  mood: string;
  title: string;
  bigIdea: { headline: string; body: string };
  concepts: Concept[];
  actions: Action[];
  reflection: string;
};

const entry: Entry = {
  date: '2026-05-07',
  dayOfYear: 127,
  mood: 'Grinding. Fired up. A little tired but clear.',
  title: 'The Portal Vision & The May Push',
  bigIdea: {
    headline: 'A unified organisational dashboard',
    body:
      'Flowmatic, TradeCraft, White Store, Olympic Paints, Flow Trader — each venture gets its own sub-dashboard. Notion synced per area. GitHub Actions and n8n buttons replace manual Claude prompts. Output flows back via Telegram or email.',
  },
  concepts: [
    {
      id: 'master',
      title: 'Master Landing Page',
      body:
        'Single entry point. Status at a glance for every venture. No more tab-switching, no more remembering URLs. The portal is the home tab.',
    },
    {
      id: 'notion',
      title: 'Notion per Area',
      body:
        'Each PARA area mirrored to a Notion database. Single source of truth, synced automatically. The dashboard reads from Notion; the scripts write to it.',
    },
    {
      id: 'email',
      title: 'Actionable Email View',
      body:
        'Daily and weekly digests styled like a control panel — not a newsletter. Buttons next to the things that matter so the inbox itself becomes a console.',
    },
    {
      id: 'actions',
      title: 'Action Buttons → GitHub Actions',
      body:
        'Replace manual Claude prompts with one-click triggers. Each button hits a workflow that runs the script, ships the output, and notifies the right channel.',
    },
    {
      id: 'output',
      title: 'Output Channels',
      body:
        'Telegram for instant, email for archival, dashboard for the long view. Same data, three lenses. Pick the channel by latency required.',
    },
    {
      id: 'sig',
      title: 'Email Signature Button',
      body:
        'Click-to-trigger from the signature itself. Lowest possible friction — see something in an email, fix it from the same email.',
    },
  ],
  actions: [
    { priority: '🔴', text: 'Portal sitemap — every venture, every script, every dashboard mapped' },
    { priority: '🔴', text: 'Notion audit — what exists, what is missing, what should be deleted' },
    { priority: '🟡', text: 'Build one action button end-to-end as proof of concept' },
    { priority: '🟡', text: 'Gmail signature template with the first action button' },
    { priority: '🟢', text: '20 min movement — walk, lift, anything' },
    { priority: '🟢', text: 'Eat one real meal — sit down, no screen' },
    { priority: '🔵', text: 'Mindset note: infrastructure compounds. Today’s grind is tomorrow’s leverage.' },
  ],
  reflection:
    'The hours you’ve put in are not fruitless — they’re infrastructure. You’re building the machine that builds everything else.',
};

export default function Journal() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  return (
    <main className="page journal">
      <header className="j-hdr">
        <Link href="/" className="back">← Portal</Link>
        <div className="j-meta">
          <div className="kicker">
            {entry.date} · Day {entry.dayOfYear} of 365
          </div>
          <h1>{entry.title}</h1>
          <div className="mood">
            <span className="label">Mood</span>
            {entry.mood}
          </div>
        </div>
        <button
          className="pill new-entry"
          type="button"
          aria-label="Start a new journal entry"
        >
          + New Entry
        </button>
      </header>

      <section className="big-idea">
        <div className="kicker">Big Idea</div>
        <h2>{entry.bigIdea.headline}</h2>
        <p>{entry.bigIdea.body}</p>
      </section>

      <section>
        <h2 className="section-h">Core Concepts</h2>
        <div className="concepts">
          {entry.concepts.map((c) => {
            const isOpen = openId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                className={`concept ${isOpen ? 'is-open' : ''}`}
                onClick={() => toggle(c.id)}
                aria-expanded={isOpen}
                aria-controls={`concept-${c.id}-body`}
              >
                <div className="concept-head">
                  <span>{c.title}</span>
                  <span className="caret" aria-hidden="true">
                    {isOpen ? '−' : '+'}
                  </span>
                </div>
                {isOpen && (
                  <p id={`concept-${c.id}-body`} className="concept-body">
                    {c.body}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="section-h">Action Items</h2>
        <ul className="actions">
          {entry.actions.map((a, i) => (
            <li key={i}>
              <span className="prio" aria-hidden="true">{a.priority}</span>
              <span>{a.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="reflection">
        <h2 className="section-h">Reflection</h2>
        <blockquote>{entry.reflection}</blockquote>
      </section>

      <footer className="ftr">
        <span>Daily Idea Journal · {entry.date}</span>
        <span>Quintus Portal</span>
      </footer>
    </main>
  );
}
