import { getGeneralEntries } from '@/data/general-entries';
import GeneralEntryCard from './components/GeneralEntryCard';

// Always render fresh from Supabase. Will switch to tag-based revalidation
// once Server Actions land in Phase 4 — for now, simple is correct.
export const dynamic = 'force-dynamic';

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

export default async function GeneralPage() {
  const entries = await getGeneralEntries();
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  const now = new Date();
  const iso = now.toISOString().slice(0, 10);
  const day = dayOfYear(now);
  const count = sorted.length;

  return (
    <main className="page">
      <header className="hdr">
        <div>
          <div className="kicker">General · {iso} · Day {day} of 365</div>
          <h1>General Entries</h1>
          <div className="sub">
            Friday review · click to expand · {count} {count === 1 ? 'entry' : 'entries'}
          </div>
        </div>
      </header>

      {count === 0 ? (
        <section className="empty">
          <p>
            No entries yet. Add the first one to{' '}
            <code>data/general-entries.ts</code>, commit, push.
          </p>
        </section>
      ) : (
        <section>
          <ul className="entries-list">
            {sorted.map((e, i) => (
              <li key={`${e.date}-${e.title}`}>
                <GeneralEntryCard entry={e} defaultOpen={i === 0} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="ftr">
        <span>Quintus Portal · {iso}</span>
        <span>General · weekly Friday review</span>
      </footer>
    </main>
  );
}
