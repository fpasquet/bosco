import type { TaskDto, WorkerStatusDto } from '@bosco/domain';

const GIGABYTE = 1024 ** 3;
const GIGABYTES = new Intl.NumberFormat('fr', { maximumFractionDigits: 0 });

export interface DepartureInput {
  /** Agents au plus à la fois pour ce dépôt (E8a) */
  concurrency: number;
  /** Préalables choisies */
  prerequisites: readonly Pick<TaskDto, 'state'>[];
  repository: string;
  /** Tâches de ce dépôt dont l'agent travaille déjà */
  repositoryBusy: number;
  worker: Pick<WorkerStatusDto, 'agentMemory' | 'availableMemory' | 'capacity' | 'running' | 'unavailable'>;
}

/**
 * Ligne du bas du formulaire, pour le worker (E6a, CA-TACH-78) : ce qui retiendra la tâche, préalables puis place dans
 * le worker, avec la capacité du moment.
 * « Départ dès que les préalables sont validées, s'il y a de la place · maintenant : 0 / 4 agents, 28 Go disponibles »
 */
export function departureOf({
  concurrency,
  prerequisites,
  repository,
  repositoryBusy,
  worker,
}: DepartureInput): string {
  if (worker.unavailable) return `Départ au retour du worker · maintenant : ${worker.unavailable}`;
  const now = `maintenant : ${worker.running} / ${worker.capacity} agents, ${GIGABYTES.format(Math.floor(worker.availableMemory / GIGABYTE))} Go disponibles`;
  const repositoryFull = repositoryBusy >= concurrency;
  const room = worker.running < worker.capacity && worker.availableMemory >= worker.agentMemory && !repositoryFull;
  const pending = prerequisites.some((task) => task.state !== 'validated');
  let start = "Départ dès qu'il y aura de la place";
  if (pending) start = "Départ dès que les préalables sont validées, s'il y a de la place";
  else if (room) start = 'Départ tout de suite';
  const agents = `${repositoryBusy} ${repositoryBusy > 1 ? 'agents' : 'agent'} sur ${concurrency}`;
  return [start, now, repositoryFull ? `${repository} : ${agents}, attend une place` : null]
    .filter(Boolean)
    .join(' · ');
}
