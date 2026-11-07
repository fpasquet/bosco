/** Vues des sessions et des profils, telles que l'API les renvoie en JSON (dates en ISO 8601). */

export interface ProfileCandidateDto {
  lastSessionAt: null | string;
  path: string;
  repositoryCount: number;
}

export interface SourceDto {
  id: string;
  label: string;
  liveTracking: boolean;
  path: string;
  watched: boolean;
}

export interface SourcesDto {
  /** Dossiers trouvés sur le poste, proposés tant qu'aucun profil n'est choisi (premier lancement) */
  candidates: ProfileCandidateDto[];
  /** Dossier personnel, pour écrire les chemins comme le terminal (~/.claude) */
  home: string;
  sources: SourceDto[];
}

export type SessionStateDto = 'ended' | 'inactive' | 'running' | 'waiting';

/** Ce qu'attend une session qui t'attend : une autorisation (« Bash », « npm run db:migrate ») ou ta réponse au tour. */
export type WaitingDto =
  | { detail: null | string; kind: 'permission'; requestId: string; since: string; tool: string }
  | { kind: 'turn'; message: null | string; since: string };

export interface SessionDto {
  branch: null | string;
  /** Fichiers modifiés par l'agent, d'après ses appels d'outils ; une commande shell n'y figure pas */
  changedFiles: { added: number; path: string; removed: number }[];
  /** Coût estimé en dollars au tarif public des modèles ; unpriced : une part vient d'un modèle sans tarif connu */
  cost: { unpriced: boolean; usd: number };
  id: string;
  lastAction: null | string;
  lastEventAt: string;
  lastMessage: null | string;
  model: null | string;
  /** Trois dernières actions de l'agent, la plus récente en premier */
  recentActions: string[];
  repoPath: null | string;
  /** Dépôt : nom de la racine git et dossier de travail à l'intérieur (« labo-ia », « packages/bosco ») */
  repository: { folder: string; name: string; root: string } | null;
  sourceId: string;
  startedAt: string;
  state: SessionStateDto;
  title: null | string;
  /** Réponses de l'agent */
  turns: number;
  usage: { cacheCreation: number; cacheRead: number; input: number; output: number };
  waiting: null | WaitingDto;
}

/** Entrée du fil d'une session : ta demande, la réponse de l'agent, ou une de ses actions. */
export interface JournalEntryDto {
  at: string;
  kind: 'prompt' | 'reply' | 'tool';
  seq: number;
  text: string;
}

/** Détail d'une session (GET /api/sessions/:id). */
export interface SessionDetailDto {
  journal: JournalEntryDto[];
  session: SessionDto;
}

/** Avancement de la première lecture de l'historique ; null quand elle est finie. */
export interface ImportProgressDto {
  read: number;
  total: number;
}

/** Événements du flux en direct (GET /api/events) : un instantané d'abord, puis les changements. */
export type LiveEventDto =
  | { data: { progress: ImportProgressDto | null }; type: 'import.progress' }
  | {
      data: { outcome: 'allowed' | 'denied' | 'elsewhere'; sessionId: string; title: null | string };
      type: 'permission.settled';
    }
  | { data: { session: SessionDto }; type: 'session.updated' }
  | { data: { sessions: SessionDto[] }; type: 'sessions.snapshot' };

/** Un jour de l'historique (GET /api/history), avec son total (E3a, CA-SESS-49). */
export interface HistoryDayDto {
  costUsd: number;
  /** Jour local, AAAA-MM-JJ */
  date: string;
  sessions: SessionDto[];
}

/** Coûts de la période (GET /api/history/costs, E3b) ; tous les montants sont des estimations (RF-SESS-05). */
export interface CostReportDto {
  averagePerWorkingDayUsd: number;
  byModel: { model: null | string; share: number; usd: number }[];
  byRepository: { name: null | string; sessions: number; share: number; usd: number }[];
  cacheShare: number;
  days: { date: string; repositories: { name: null | string; sessions: number; usd: number }[] }[];
  sessions: number;
  totalUsd: number;
  workingDays: number;
}
