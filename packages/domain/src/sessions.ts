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
  /** Question à choix de l'agent d'une session pilotée par Bosco (E2f) */
  | { kind: 'question'; questions: AgentQuestionDto[]; requestId: string; since: string }
  | { kind: 'turn'; message: null | string; since: string };

/** Question à choix posée par l'agent (E2f) ; multiSelect : plusieurs choix possibles. */
export interface AgentQuestionDto {
  header: string;
  multiSelect: boolean;
  options: { description: string; label: string }[];
  question: string;
}

export type PermissionModeDto = 'acceptEdits' | 'ask' | 'plan';
export type EffortDto = 'high' | 'low' | 'max' | 'medium' | 'xhigh';

/** Réglages d'un tour piloté : mode d'autorisations, modèle (null : celui du profil), effort (null : celui du profil). */
export interface PilotSettingsDto {
  effort: EffortDto | null;
  model: null | string;
  permissionMode: PermissionModeDto;
}

/** Session pilotée par Bosco (E2e) : ses réglages, son tour en cours et le message qui attend la fin du tour. */
export interface PilotDto {
  /** Message qui partira à la fin du tour (CA-SESS-93) */
  pending: null | { images: number; text: string };
  running: boolean;
  settings: PilotSettingsDto;
  since: string;
}

/** Une image jointe à un message, en base64 (5 au plus, 5 Mo chacune). */
export interface PilotImageDto {
  data: string;
  mediaType: string;
  name: string;
}

/** Message envoyé à une session pilotée : texte (fichiers en `@chemin`, commande en tête), images, réglages du tour. */
export interface PilotMessageDto {
  images: PilotImageDto[];
  settings: PilotSettingsDto;
  text: string;
}

/** Nouvelle session (E16a) : dépôt (sa racine), profil Claude Code (son dossier ; null : celui du dépôt), premier message. */
export interface StartSessionDto extends PilotMessageDto {
  profile: null | string;
  repository: string;
}

/** Ce que propose le formulaire d'une nouvelle session (E16a) : les dépôts et les abonnements Claude. */
export interface PilotOptionsDto {
  /** Profils Claude Code surveillés qui ont un accès, et celui du dépôt choisi */
  profiles: { account: null | string; label: string; path: string }[];
  repositories: { defaultProfile: null | string; name: string; root: string }[];
}

/** Suggestion de l'éditeur (E2h) : un fichier du dépôt après « @ », une commande ou un skill après « / ». */
export interface SuggestionDto {
  description: null | string;
  /** Origine d'une commande : « commande », « skill · profil perso », « dépôt api-voix » */
  origin: null | string;
  value: string;
}

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
  /**
   * Dépôt : nom de la racine git et dossier de travail à l'intérieur (« labo-ia », « packages/bosco ») ; hidden : masqué
   * des listes dans les réglages (E4d), ses sessions restent visibles
   */
  repository: { folder: string; hidden: boolean; name: string; root: string } | null;
  sourceId: string;
  startedAt: string;
  state: SessionStateDto;
  title: null | string;
  /** Ouverte dans un terminal : Bosco ne lui écrit pas, on y répond dans le terminal (CA-SESS-98) */
  openInTerminal: boolean;
  /** Session pilotée par Bosco ; null pour une session du terminal ou du worker */
  pilot: null | PilotDto;
  /** Session du terminal lancée avec le canal de Bosco, ouvert : Bosco peut lui écrire, en texte (E2i) */
  channel: boolean;
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
  /** Demande écrite dans Bosco et arrivée par le canal de Bosco (E2i) */
  viaChannel?: boolean;
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
/** Une notification du centre de notifications (E15a). */
export interface NotificationDto {
  at: string;
  excerpt: null | string;
  id: number;
  kind: 'ended' | 'failed' | 'long-turn' | 'permission' | 'question' | 'review' | 'turn-question';
  /** Dépôt de la session ou de la tâche (« api-voix ») */
  place: null | string;
  readAt: null | string;
  sessionId: null | string;
  /** Traitée (« Autorisé dans Bosco », « Répondu dans le terminal », « Validée ») : elle sort de « À traiter » */
  settled: null | string;
  taskId: null | number;
  title: string;
  turnMinutes: null | number;
}

export type LiveEventDto =
  | { data: { progress: ImportProgressDto | null }; type: 'import.progress' }
  | { data: { inApp: boolean; notification: NotificationDto }; type: 'notification.created' }
  | { data: Record<string, never>; type: 'notifications.changed' }
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

/** Réglages des dépôts découverts (E4d). */
export interface DiscoverySettingsDto {
  attachWorktrees: boolean;
  excluded: string[];
  gitOnly: boolean;
  /** Racines des dépôts masqués */
  hidden: string[];
  roots: string[];
}

/** Réglages › Dépôts (E4d) : réglages, dépôts trouvés (les plus récents d'abord) et sessions hors dépôt git. */
export interface RepositorySettingsDto {
  home: string;
  outside: number;
  repositories: { git: boolean; hidden: boolean; lastActivityAt: string; name: string; root: string }[];
  settings: DiscoverySettingsDto;
}

/** Canal de Bosco dans un profil surveillé (E4f) : installé ou non, et la commande qui lance une session avec lui. */
export interface ChannelProfileDto {
  command: string;
  installed: boolean;
  label: string;
  path: string;
}
