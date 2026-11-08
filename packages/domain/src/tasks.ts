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
    base: null | string;
    branch: null | string;
    from: null | string;
    pullRequest: null | string;
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

/** Connexion d'un agent refusée par le proxy de sa tâche (E11b). */
export interface EgressRefusalDto {
  at: string;
  host: string;
  taskId: number;
}

/** Isolation du worker (E11a, E11b) : limites de chaque agent, capacité, domaines autorisés et refus récents. */
export interface IsolationDto {
  capacity: { freeMemory: number; maxAgents: number; maxAgentsRange: [number, number]; reservedMemory: number };
  /** registries : domaines des registres du .npmrc choisi, autorisés d'office */
  domains: { added: string[]; locked: string[]; registries: string[] };
  /** Ce que chaque tâche reçoit (E11b) ; jamais les jetons eux-mêmes */
  secrets: WorkerSecretsDto;
  image: string;
  limits: { cpus: number; memory: number; processes: number };
  refusals: EgressRefusalDto[];
}

export type TestServicesModeDto = 'auto' | 'choose' | 'none';

/** Environnement de test d'un dépôt (E12a) : image de l'agent, services lus dans son fichier, dernier lancement. */
export interface TestEnvironmentDto {
  branch: null | string;
  defaultImage: string;
  excluded: { name: string; reason: string }[];
  file: null | string;
  image: null | string;
  lastRun: null | {
    at: string;
    launches: { error: null | string; image: string; name: string; readySeconds: null | number }[];
    removedAt: null | string;
    taskId: number;
  };
  launched: { image: string; name: string }[];
  limits: { cpus: number; memory: number; waitSeconds: number };
  mode: TestServicesModeDto;
  removed: string[];
  repository: string;
  selected: string[];
  services: { image: null | string; name: string }[];
}

export type PullRequestModeDto = 'always' | 'ask' | 'never';

/** Droits d'un dépôt pour ses agents (E8a). */
export interface RightsValuesDto {
  concurrency: number;
  deniedTools: string[];
  maxBudgetUsd: number;
  maxTurns: number;
  model: string;
  pullRequest: PullRequestModeDto;
  tools: string[];
}

export type RightsFieldDto = keyof RightsValuesDto;

/** Droits des agents (E8a) : le général, les valeurs du dépôt, et ce qui s'applique vraiment avec son origine. */
export interface RightsDto {
  effective: RightsValuesDto;
  general: RightsValuesDto;
  models: string[];
  origins: Record<RightsFieldDto, 'dépôt' | 'général' | 'général + dépôt'>;
  /** Tâches pas encore lancées du dépôt, qui appliqueront ces droits au lancement */
  pending: { id: number; state: TaskStateDto; title: string }[];
  /** null pour les réglages généraux */
  repository: null | Partial<RightsValuesDto>;
}

/** Diff d'une tâche depuis le point de départ de sa branche (E7a). */
export interface TaskChangesDto {
  diff: string;
  files: { added: number; path: string; removed: number }[];
  truncated: boolean;
}

/** Ce que la relecture propose à la validation (E7c). */
export interface TaskReviewDto {
  /** null si Bosco peut pousser ; sinon pourquoi seule « Valider sans pousser » reste proposée */
  blocked: null | string;
  commits: number;
  proposal: { body: string; title: string };
  pullRequest: PullRequestModeDto;
}

export interface ValidationDto {
  pullRequestError: null | string;
  task: TaskDto;
}

/** Secrets transmis à chaque tâche du worker (E11b) : abonnement Claude du profil choisi, .npmrc du poste. */
export interface WorkerSecretsDto {
  claude: {
    account: null | string;
    available: boolean;
    choices: { account: null | string; label: string; path: string }[];
    label: null | string;
    profile: null | string;
  };
  npmrc: { exists: boolean; path: string; registries: { host: string; scope: null | string }[] };
}
