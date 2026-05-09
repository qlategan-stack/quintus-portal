import { getServerSupabase } from '@/app/lib/supabase-server';
import SyncButton from './sync-button';

export const dynamic = 'force-dynamic';

type SyncStateRow = {
  entity_kind: string;
  last_synced_at: string | null;
};

const KINDS = [
  { key: 'task',     label: 'Tasks',     supabaseTable: 'tasks',     notionDbName: 'Tasks DB' },
  { key: 'meeting',  label: 'Meetings',  supabaseTable: 'meetings',  notionDbName: 'Meeting Minutes DB' },
  { key: 'document', label: 'Documents', supabaseTable: 'documents', notionDbName: 'Documents DB' },
] as const;

async function loadOverview() {
  const sb = getServerSupabase();

  const [{ data: states }, taskCount, meetingCount, docCount, taskUnsynced, meetingUnsynced, docUnsynced] = await Promise.all([
    sb.from('sync_state')
      .select('entity_kind, last_synced_at')
      .eq('source', 'notion')
      .is('entity_id', null)
      .returns<SyncStateRow[]>(),
    sb.from('tasks').select('id', { count: 'exact', head: true }),
    sb.from('meetings').select('id', { count: 'exact', head: true }),
    sb.from('documents').select('id', { count: 'exact', head: true }),
    sb.from('tasks').select('id', { count: 'exact', head: true }).is('notion_id', null),
    sb.from('meetings').select('id', { count: 'exact', head: true }).is('notion_id', null),
    sb.from('documents').select('id', { count: 'exact', head: true }).is('notion_id', null),
  ]);

  const lastSyncedByKind = new Map<string, string | null>();
  for (const s of states ?? []) lastSyncedByKind.set(s.entity_kind, s.last_synced_at);

  return [
    { ...KINDS[0], total: taskCount.count ?? 0,    unsynced: taskUnsynced.count ?? 0,    lastSynced: lastSyncedByKind.get('task') ?? null },
    { ...KINDS[1], total: meetingCount.count ?? 0, unsynced: meetingUnsynced.count ?? 0, lastSynced: lastSyncedByKind.get('meeting') ?? null },
    { ...KINDS[2], total: docCount.count ?? 0,    unsynced: docUnsynced.count ?? 0,     lastSynced: lastSyncedByKind.get('document') ?? null },
  ];
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'never';
  const t = new Date(iso).getTime();
  const ago = Date.now() - t;
  const min = Math.round(ago / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default async function NotionSyncPage() {
  const overview = await loadOverview();

  return (
    <main className="page">
      <header className="hdr">
        <div>
          <div className="kicker">Notion · two-way sync</div>
          <h1>Notion Sync</h1>
          <div className="sub">
            Last-write-wins on updated_at. Click below to pull Notion changes
            and push Portal changes in one round-trip.
          </div>
        </div>
      </header>

      <section className="sync-overview">
        <table className="sync-table">
          <thead>
            <tr>
              <th>Entity</th>
              <th>Total in Supabase</th>
              <th title="Rows without a notion_id — will be created in Notion on next sync">Pending push</th>
              <th>Last synced</th>
            </tr>
          </thead>
          <tbody>
            {overview.map((o) => (
              <tr key={o.key}>
                <td className="sync-kind">{o.label}</td>
                <td>{o.total}</td>
                <td>{o.unsynced}</td>
                <td className="sync-relative">{formatRelative(o.lastSynced)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <SyncButton />

      <footer className="ftr">
        <span>Notion ↔ Supabase</span>
        <span>Manual trigger · last-write-wins · conflicts logged to audit_log</span>
      </footer>
    </main>
  );
}
