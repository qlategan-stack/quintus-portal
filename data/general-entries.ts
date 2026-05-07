// ─────────────────────────────────────────────────────────────────────────
//  General Entries — the log
//
//  This is the single source of truth for every General Entry on the portal.
//  To add a new entry: prepend an object to the array. Date must be ISO
//  YYYY-MM-DD. Push to main and the workflow rebuilds and redeploys Pages.
//
//  Friday review pattern: open the portal on a Friday, the entries from the
//  past week are surfaced with a "This week" badge for quick scan and action.
// ─────────────────────────────────────────────────────────────────────────

export type Concept = { id: string; title: string; body: string };

export type ActionPriority = '🔴' | '🟡' | '🟢' | '🔵';
export type ActionItem = { priority: ActionPriority; text: string };

export type GeneralEntry = {
  /** ISO date — YYYY-MM-DD */
  date: string;
  title: string;
  mood?: string;
  bigIdea?: { headline: string; body: string };
  concepts?: Concept[];
  actions?: ActionItem[];
  reflection?: string;
  /** Free-form note for entries that don't fit the structured shape */
  note?: string;
};

export const generalEntries: GeneralEntry[] = [
  {
    date: '2026-05-07',
    title: 'The Portal Vision & The May Push',
    mood: 'Grinding. Fired up. A little tired but clear.',
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
  },
];
