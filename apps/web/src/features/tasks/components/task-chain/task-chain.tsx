import { ArrowDown } from 'lucide-react';
import type { TaskDto } from '@bosco/domain';
import { TASK_STATES } from '../../lib/tasks';

/** Enchaînement des tâches actives liées (E5b) : une tâche part quand toutes ses flèches entrantes sont validées. */
export function TaskChain({ tasks }: { tasks: TaskDto[] }) {
  if (tasks.length === 0) return null;
  return (
    <aside aria-labelledby="chain-title" className="rounded-card border border-line bg-surface p-4 shadow-card">
      <h2 id="chain-title" className="text-xs font-semibold text-muted">
        Enchaînement
      </h2>
      <p className="mb-3 text-xs text-muted">Une tâche part quand toutes ses flèches entrantes sont validées.</p>
      <ol className="flex flex-col gap-2">
        {tasks.map((task) => (
          <li key={task.id} className="flex flex-col gap-1">
            {task.prerequisites.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted">
                <ArrowDown aria-hidden className="size-3" />
                après {task.prerequisites.map((id) => `T-${id}`).join(' et ')}
              </span>
            )}
            <span className="rounded-control border border-line px-3 py-2">
              <span className="block text-xs text-muted">
                T-{task.id} · {TASK_STATES[task.state].label}
              </span>
              <span className="block truncate font-medium">{task.title}</span>
              <span className="block font-mono text-xs text-muted">
                {task.repository.name}
                {task.startFrom ? ' · même branche' : ''}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
