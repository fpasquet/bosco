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
  /** Tâche du worker qui a lancé la session (E2c, E2d) ; null pour une session interactive */
  task: null | { failure: null | string; id: number; state: string; title: string };
  waiting: null | WaitingDto;
}

/** Entrée du fil d'une session : ta demande, la réponse de l'agent, ou une de ses actions. */
export interface JournalEntryDto {
  at: string;
  kind: 'prompt' | 'reply' | 'tool';
  seq: number;
  text: string;
}

/**
 * Étape d'un tour de l'agent : une réflexion (texte vide quand le modèle la garde pour lui), ou un appel d'outil avec
 * son entrée et son résultat. Un outil sans résultat est en cours, ou interrompu si la session ne tourne plus.
 */
export type ConversationStepDto =
  | { at: string; kind: 'reasoning'; seconds: null | number; text: string }
  | {
      at: string;
      /** Fin de l'outil ; null tant qu'il n'a pas rendu son résultat */
      endedAt: null | string;
      error: boolean;
      id: string;
      /** Entrée de l'outil, chaque texte coupé au-delà de quelques milliers de caractères */
      input: Record<string, unknown>;
      kind: 'tool';
      name: string;
      output: null | string;
      /** Sous-agent lancé par cet appel (Agent, Task), lu dans son propre transcript */
      subagent?: SubagentDto;
      /** Résumé d'une ligne, celui du journal : « Bash · yarn lint » */
      summary: string;
    };

/** Sous-agent : sa consigne, son modèle, ses étapes et son résultat, une fois fini. */
export interface SubagentDto {
  agentType: null | string;
  description: null | string;
  endedAt: null | string;
  finished: boolean;
  model: null | string;
  parts: ConversationPartDto[];
  /** Ses premières étapes ne sont pas rendues : seules les dernières le sont */
  partial: boolean;
  prompt: null | string;
  result: null | string;
  startedAt: null | string;
}

/** Partie d'un tour : du texte en Markdown, ou une étape. */
export type ConversationPartDto = ConversationStepDto | { at: string; kind: 'text'; text: string };

/** Tour d'une conversation : ta demande, ou tout ce que l'agent a fait jusqu'à la suivante. */
export interface ConversationTurnDto {
  at: string;
  id: string;
  parts: ConversationPartDto[];
  role: 'assistant' | 'user';
}

/** Conversation complète d'une session, lue dans son transcript (GET /api/sessions/:id/conversation). */
export interface SessionConversationDto {
  /** Vrai quand le début d'une longue session n'est pas lu : seuls ses derniers échanges sont rendus */
  partial: boolean;
  turns: ConversationTurnDto[];
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
