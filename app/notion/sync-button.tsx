'use client';

import { useState, useTransition } from 'react';
import { runSync, type SyncSummary } from './actions';

export default function SyncButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SyncSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    setResult(null);
    startTransition(async () => {
      try {
        const r = await runSync();
        setResult(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div className="sync-panel">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="sync-button"
      >
        {pending ? 'Syncing…' : '▶ Sync Now'}
      </button>

      {error && <p className="task-error" style={{ marginTop: 12 }}>{error}</p>}

      {result && (
        <div className="sync-result">
          <div className="kicker">
            Last run · {new Date(result.startedAt).toLocaleString()}
            {result.ok ? '' : ' · with errors'}
          </div>
          <table className="sync-table">
            <thead>
              <tr>
                <th>Kind</th>
                <th title="Notion → Supabase">Pulled</th>
                <th title="Supabase → Notion">Pushed</th>
                <th title="New rows added to Supabase">+SB</th>
                <th title="New pages created in Notion">+N</th>
                <th>Conflicts</th>
                <th>Skipped</th>
                <th>Errors</th>
              </tr>
            </thead>
            <tbody>
              {(['task', 'meeting', 'document'] as const).map((k) => {
                const c = result.byKind[k];
                return (
                  <tr key={k}>
                    <td className="sync-kind">{k}</td>
                    <td>{c.pulled}</td>
                    <td>{c.pushed}</td>
                    <td>{c.inserted_supabase}</td>
                    <td>{c.inserted_notion}</td>
                    <td>{c.conflicts}</td>
                    <td>{c.skipped}</td>
                    <td>{c.errors.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {Object.values(result.byKind).some((c) => c.errors.length > 0) && (
            <details className="sync-errors">
              <summary>Show errors</summary>
              <ul>
                {(['task', 'meeting', 'document'] as const).flatMap((k) =>
                  result.byKind[k].errors.map((e, i) => (
                    <li key={`${k}-${i}`}>
                      <code>{k}</code> · <code>{e.id}</code> — {e.message}
                    </li>
                  )),
                )}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
