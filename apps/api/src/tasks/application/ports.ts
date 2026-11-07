import type { RepositoryRights } from '../domain/rights.ts';
import type { Task } from '../domain/task.ts';
import type { ServiceLaunch, TestService } from '../domain/test-services.ts';
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

/** Usage d'un message de l'agent, en tokens. */
export interface AgentUsage {
  cacheCreation: number;
  cacheRead: number;
  input: number;
  output: number;
}

/** Ce que l'agent signale pendant qu'il travaille, puis à la fin (flux JSON de Claude Code). */
export type AgentEvent =
  | { kind: 'result'; ok: boolean; report: null | string; stop: 'error' | 'max_turns' | 'success'; turns: number }
  | { kind: 'session'; sessionId: string }
  | { kind: 'usage'; model: null | string; usage: AgentUsage };

export interface AgentSpec {
  /** Outils interdits du dépôt, en plus de ceux que Claude Code refuse déjà */
  deniedTools: string[];
  folder: string;
  /** Image de l'agent choisie pour le dépôt ; null : l'image par défaut (CA-CONT-54) */
  image: null | string;
  maxTurns: number;
  model: string;
  /** Résultat du lancement des services de test, avant que l'agent démarre */
  onServices: (launches: ServiceLaunch[]) => void;
  prompt: string;
  /** Services de test lancés autour de l'agent, sur son réseau privé (E12a) */
  services: TestService[];
  taskId: number;
  tools: string[];
  workspace: Workspace;
}

/** Un agent au travail : ses événements jusqu'à sa fin, et l'arrêt en quelques secondes (RF-TACH-07). */
export interface AgentRun {
  events: AsyncIterable<AgentEvent>;
  /** Fin complète de l'agent, sa session gardée : la copie jetable se supprime ensuite */
  finished(): Promise<void>;
  stop(): Promise<void>;
}

export interface AgentRunner {
  start(spec: AgentSpec): Promise<AgentRun>;
}

/** Copie jetable du dépôt et dossier personnel temporaire d'une tâche (RF-CONT-06). */
export interface Workspace {
  branch: string;
  dir: string;
}

export interface Workspaces {
  /** Supprime les restes d'un arrêt brutal, au démarrage (NF-12) */
  cleanupAll(): Promise<void>;
  /** Commite le travail, puis rapatrie la branche dans le dépôt ; seule la branche reste */
  collect(
    workspace: Workspace,
    task: { id: number; repositoryRoot: string; title: string },
  ): Promise<{ base: string; changes: { added: number; files: number; removed: number }; from: string }>;
  prepare(task: { branch: string; id: number; repositoryRoot: string; startBranch: null | string }): Promise<Workspace>;
  remove(workspace: Workspace): Promise<void>;
}

/** null quand le worker peut lancer un agent ; sinon la raison (Docker, abonnement Claude) (E5c). */
export interface WorkerHealth {
  check(): Promise<null | string>;
}
