import type { TaskDto } from '@bosco/domain';
import type { TaskView } from '../../application/task.service.ts';

/** Vue d'une tâche en JSON : dates en ISO 8601. */
export function presentTask(task: TaskView): TaskDto {
  return {
    ...task,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    log: task.log.map((entry) => ({ ...entry, at: entry.at.toISOString() })),
  };
}

export type { TaskDto } from '@bosco/domain';
