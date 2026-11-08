/** Vues des tâches, telles que l'API les renvoie en JSON (dates en ISO 8601). */

export type TaskStateDto =
  | 'awaiting_session'
  | 'blocked'
  | 'cancelled'
  | 'failed'
  | 'queued'
  | 'rejected'
  | 'running'
  | 'to_review'
  | 'validated';

export type TaskModeDto = 'session' | 'worker';

export interface GuardrailsDto {
  budgetUsd: number;
  maxTurns: number;
  model: null | string;
  tools: null | string[];
}

export interface TaskDto {
  context: null | string;
  createdAt: string;
  createdBy: 'person' | 'session';
  editable: boolean;
  failure: null | string;
  folder: string;
  guardrails: GuardrailsDto;
  id: number;
  instruction: string;
  log: { at: string; detail: null | string; event: string }[];
  mode: TaskModeDto;
  /** Ce que le worker a produit : branche, compte rendu, modifications, session, tours (E7a) */
  outcome: {
    branch: null | string;
    changes: { added: number; files: number; removed: number } | null;
    report: null | string;
    sessionId: null | string;
    turns: number;
  };
  prerequisites: number[];
  repository: { name: string; root: string };
  spentUsd: number;
  /** Préalable du même dépôt dont la tâche partira de la branche ; null : la branche principale */
  startFrom: null | number;
  state: TaskStateDto;
  title: string;
  updatedAt: string;
  waitingFor: { id: number; state: TaskStateDto; title: string }[];
}

/** Ce que la personne écrit dans le formulaire d'une tâche (E6a). */
export interface TaskDraftDto {
  context: null | string;
  folder: string;
  guardrails: GuardrailsDto;
  instruction: string;
  mode: TaskModeDto;
  prerequisites: number[];
  repository: string;
}

/** Erreurs du formulaire, chacune liée à son champ (E6b). */
export interface TaskIssueDto {
  field: 'budgetUsd' | 'instruction' | 'maxTurns' | 'prerequisites' | 'repository' | 'tools';
  message: string;
}

/** État du worker (GET /api/worker, E5b, E5c). */
export interface WorkerStatusDto {
  capacity: number;
  running: number;
  /** null quand le worker est disponible ; sinon la raison (« Docker ne répond pas ») */
  unavailable: null | string;
  /** Pourquoi une tâche prête reste en file, par numéro de tâche */
  waiting: Record<number, string>;
}
