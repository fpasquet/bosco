import type { TaskDto, TaskStateDto } from '@bosco/domain';

/** Libellés et tons des états de tâche (CONTEXTE, lot 2). */
// Un badge neutre garde sa bordure : sans elle, il disparaît sur une ligne survolée, du même fond que lui
export const TASK_STATES: Record<TaskStateDto, { badge: string; label: string }> = {
  awaiting_session: { label: 'En attente d’une session', badge: 'badge-soft badge-warning' },
  blocked: { label: 'Bloquée', badge: 'badge-ghost border-line-strong' },
  cancelled: { label: 'Annulée', badge: 'badge-ghost border-line-strong line-through' },
  failed: { label: 'En échec', badge: 'badge-soft badge-error' },
  queued: { label: 'En file', badge: 'badge-ghost border-line-strong' },
  rejected: { label: 'Rejetée', badge: 'badge-soft badge-error' },
  running: { label: 'En cours', badge: 'badge-soft badge-info' },
  to_review: { label: 'À relire', badge: 'badge-soft badge-primary' },
  validated: { label: 'Validée', badge: 'badge-soft badge-success' },
};

/** Ordre de la file : ce qui attend ta relecture d'abord, le plus lointain ensuite (CA-TACH-05). */
const ORDER: readonly TaskStateDto[] = ['to_review', 'awaiting_session', 'running', 'queued', 'blocked'];

export type TaskTab = 'active' | 'failed' | 'finished';

export function tabOf(task: TaskDto): TaskTab {
  if (task.state === 'failed' || task.state === 'rejected') return 'failed';
  if (task.state === 'validated' || task.state === 'cancelled') return 'finished';
  return 'active';
}

export function sortTasks(tasks: readonly TaskDto[]): TaskDto[] {
  return tasks.toSorted((left, right) => {
    const rank = (task: TaskDto) => {
      const index = ORDER.indexOf(task.state);
      return index === -1 ? ORDER.length : index;
    };
    return rank(left) - rank(right) || left.createdAt.localeCompare(right.createdAt);
  });
}

/** Tâches actives liées entre elles, pour l'enchaînement (E5b) : chacune avec ce qu'elle attend. */
export function chainOf(tasks: readonly TaskDto[]): TaskDto[] {
  const active = tasks.filter((task) => tabOf(task) === 'active');
  const linked = new Set(
    active.flatMap((task) => [task.prerequisites.length > 0 ? task.id : null, ...task.prerequisites]),
  );
  return sortTasks(active.filter((task) => linked.has(task.id)));
}

const NBSP = '\u00a0';
const DOLLARS = new Intl.NumberFormat('fr', { maximumFractionDigits: 2, minimumFractionDigits: 2 });

/** « 1,50 $ » */
export function usd(value: number): string {
  return DOLLARS.format(value) + NBSP + '$';
}

/** Ce qui retient une tâche, en une phrase : « partira de la branche de T-12 », « attend T-13 et T-14 ». */
export function whyWaiting(task: TaskDto): null | string {
  if (task.state === 'awaiting_session') return '« prends la prochaine tâche Bosco » dans une session du dépôt';
  if (task.state !== 'blocked') return null;
  if (task.startFrom) return `partira de la branche de T-${task.startFrom}`;
  const ids = task.waitingFor.map(({ id }) => 'T-' + id);
  return `attend ${ids.join(' et ')}`;
}
