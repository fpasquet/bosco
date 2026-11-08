import Link from 'next/link';
import type { TaskDto } from '@bosco/domain';
import { usd, whyWaiting } from '../../lib/tasks';
import { TaskStateBadge } from '../task-state-badge';

/** Budget : dépensé sur prévu ; les garde-fous ne valent pas pour une tâche « Ma session » (E5b, annotation 5). */
function budgetOf(task: TaskDto): string {
  if (task.mode === 'session') return '—';
  const planned = usd(task.guardrails.budgetUsd);
  return task.spentUsd > 0 ? `${usd(task.spentUsd)} / ${planned}` : planned;
}

/** File des tâches (E5b) : toute ligne ouvre le détail de la tâche (CA-TACH-13). */
export function TaskList({ tasks }: { tasks: TaskDto[] }) {
  if (tasks.length === 0) return <p className="text-muted">Aucune tâche ici.</p>;
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-card">
      <table className="table w-full min-w-xl text-left">
        <caption className="sr-only">Tâches</caption>
        <thead className="text-xs text-muted">
          <tr className="h-9 border-b border-line">
            <th className="pl-4 font-medium">Tâche</th>
            <th className="w-28 font-medium">Attend</th>
            <th className="w-32 pr-4 text-right font-medium">Budget</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="relative border-b border-line hover:bg-surface-alt">
              <td className="pl-4">
                <Link href={`/tasks/${task.id}`} className="font-medium after:absolute after:inset-0">
                  <span className="font-mono text-xs text-muted">T-{task.id}</span> {task.title}
                </Link>
                <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <TaskStateBadge state={task.state} />
                  {task.mode === 'worker' ? 'Worker' : 'Ma session'}
                  <span className="font-mono">
                    {task.repository.name}
                    {task.folder ? ` · ${task.folder}` : ''}
                  </span>
                  {whyWaiting(task) && <span>· {whyWaiting(task)}</span>}
                  {task.createdBy === 'session' && <span>· créée par une session</span>}
                  {task.failure && task.state !== 'cancelled' && <span>· {task.failure}</span>}
                </span>
              </td>
              <td className="font-mono text-xs text-muted">
                {task.waitingFor.length > 0 ? task.waitingFor.map(({ id }) => `T-${id}`).join(' ') : '—'}
              </td>
              <td className="pr-4 text-right font-mono text-xs tabular-nums">{budgetOf(task)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
