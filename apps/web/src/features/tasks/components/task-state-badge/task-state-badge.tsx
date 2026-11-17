import type { TaskStateDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { TASK_STATES } from '../../lib/tasks';

/** État d'une tâche : le libellé porte l'état, la couleur ne fait que le souligner (NF-18). */
export function TaskStateBadge({ state }: { state: TaskStateDto }) {
  const { badge, label } = TASK_STATES[state];
  return <span className={cn('badge badge-sm whitespace-nowrap', badge)}>{label}</span>;
}
