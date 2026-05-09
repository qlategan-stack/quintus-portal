import { getOpenTasks, getActiveVentures, getActiveProjects } from '@/data/tasks';
import AddTaskForm from './add-task-form';
import VentureGroup from './venture-group';
import type { OpenTaskRow } from '@/data/types';

// Always render fresh — Server Actions revalidate this path after mutations,
// but force-dynamic also covers external Supabase changes (Studio edits, etc).
export const dynamic = 'force-dynamic';

const UNASSIGNED_KEY = '__unassigned__';

export default async function TasksPage() {
  const [tasks, ventures, projects] = await Promise.all([
    getOpenTasks(),
    getActiveVentures(),
    getActiveProjects(),
  ]);

  // Group by venture slug. Tasks with a venture not in the active list
  // (e.g. a paused/archived venture) fall into the unassigned bucket so
  // they don't disappear from view.
  const grouped = new Map<string, OpenTaskRow[]>();
  for (const v of ventures) grouped.set(v.slug, []);
  grouped.set(UNASSIGNED_KEY, []);
  for (const t of tasks) {
    const key = t.venture_slug && grouped.has(t.venture_slug) ? t.venture_slug : UNASSIGNED_KEY;
    grouped.get(key)!.push(t);
  }

  const unassigned = grouped.get(UNASSIGNED_KEY) ?? [];

  return (
    <main className="page">
      <header className="hdr">
        <div>
          <div className="kicker">Tasks · {tasks.length} open</div>
          <h1>Tasks</h1>
          <div className="sub">
            Click a venture to expand. Add tasks directly — writes hit Supabase live.
          </div>
        </div>
      </header>

      <AddTaskForm ventures={ventures} />

      <section className="venture-groups">
        {ventures
          .filter((v) => (grouped.get(v.slug)?.length ?? 0) > 0)
          .map((v) => (
            <VentureGroup
              key={v.slug}
              venture={v}
              tasks={grouped.get(v.slug) ?? []}
              allVentures={ventures}
              allProjects={projects}
            />
          ))}

        {unassigned.length > 0 && (
          <VentureGroup
            venture={{ slug: UNASSIGNED_KEY, name: 'Unassigned' }}
            tasks={unassigned}
            allVentures={ventures}
            allProjects={projects}
          />
        )}

        {tasks.length === 0 && (
          <p className="placeholder">No open tasks. Add one above.</p>
        )}
      </section>

      <footer className="ftr">
        <span>Tasks · live</span>
        <span>Source: Supabase · v_open_tasks</span>
      </footer>
    </main>
  );
}
