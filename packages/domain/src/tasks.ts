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
