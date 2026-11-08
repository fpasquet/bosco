import type { RepositoryRights } from '../domain/rights.ts';
import type { Task } from '../domain/task.ts';
import type { TaskView } from './task.service.ts';

export interface TaskRepository {
  find(id: number): Promise<null | Task>;
  list(): Promise<Task[]>;
  nextId(): Promise<number>;
  save(tasks: readonly Task[]): Promise<void>;
}

/** Dépôts connus du poste, d'après les sessions des profils surveillés : ceux où une tâche peut se créer (E6a). */
export interface RepositoryCatalog {
  list(): Promise<{ name: string; root: string }[]>;
}

/** Droits d'un dépôt ; les réglages généraux tant qu'il n'a pas les siens (E8a). */
export interface RightsReader {
  rightsOf(repository: string): Promise<RepositoryRights>;
}

/** Publie chaque changement de tâche vers le flux en direct des tâches (DT-06). */
export interface TaskEvents {
  tasksChanged(tasks: TaskView[]): void;
}

export interface Clock {
  now(): Date;
}
