/** Vues des sessions et des profils, telles que l'API les renvoie en JSON (dates en ISO 8601). */

export interface ProfileCandidateDto {
  lastSessionAt: null | string;
  path: string;
  projectCount: number;
}

export interface SourceDto {
  id: string;
  label: string;
  liveTracking: boolean;
  /** Tenue par Bosco (« Bacs à sable ») : toujours lue, sans interrupteur, suivi en direct ni canal */
  managed: boolean;
  path: string;
  /** Fichier du jeton longue durée déclaré pour ce profil (`claude setup-token`) ; null : sa connexion */
  tokenFile: null | string;
  /** Bosco ne sait plus lire le format de ses nouvelles sessions : « À mettre à jour », elles ne se lisent plus */
  unreadable: boolean;
  watched: boolean;
}

export interface SourcesDto {
  /** Dossiers trouvés sur le poste, proposés tant qu'aucun profil n'est choisi (premier lancement) */
  candidates: ProfileCandidateDto[];
  /** Dossier personnel, pour écrire les chemins comme le terminal (~/.claude) */
  home: string;
  sources: SourceDto[];
}

/**
 * Réglages d'un profil : son compte, les valeurs par défaut des sessions lancées dans Bosco avec lui (null :
 * celle du profil Claude Code), ce que dit son settings.json, et ce qui l'utilise.
 */
export interface ProfileSettingsDto {
  /**
   * Accès du profil à son abonnement : sa connexion (/login), un jeton longue durée lu dans le fichier déclaré, ou aucun ;
   * problem dit pourquoi le fichier d'un jeton déclaré ne sert pas. Jamais le jeton lui-même
   */
  access: { kind: 'login' | 'none' | 'token'; problem: null | string; tokenFile: null | string };
  /** Compte de l'abonnement Claude ; null sans accès ou sans adresse connue */
  account: null | string;
  /** Ce que dit le profil Claude Code (permissions.defaultMode, model, effortLevel), lu sans être modifié */
  claude: Omit<SessionDefaultsDto, 'profile'>;
  /** Réglés dans Bosco pour ce profil ; null : celui du profil Claude Code */
  defaults: Omit<SessionDefaultsDto, 'profile'>;
  /** Profil par défaut de Bosco, proposé à chaque nouvelle session */
  isDefault: boolean;
  source: Omit<SourceDto, 'unreadable'>;
  /** Groupes dont il est le profil par défaut, et sessions ouvertes avec lui */
  usedBy: { groups: { id: number; name: string }[]; openSessions: number };
}

export type SessionStateDto = 'ended' | 'inactive' | 'running' | 'waiting';

/** Ce qu'attend une session qui t'attend : une autorisation (« Bash », « npm run db:migrate ») ou ta réponse au tour. */
export type WaitingDto =
  | { detail: null | string; kind: 'permission'; requestId: string; since: string; tool: string }
  /** Question à choix de l'agent d'une session pilotée par Bosco */
  | { kind: 'question'; questions: AgentQuestionDto[]; requestId: string; since: string }
  | { kind: 'turn'; message: null | string; since: string };

/** Question à choix posée par l'agent ; multiSelect : plusieurs choix possibles. */
export interface AgentQuestionDto {
  header: string;
  multiSelect: boolean;
  options: { description: string; label: string }[];
  question: string;
}

/** Demander, Accepter les modifications, Plan, Approuver pour moi (auto), Accès complet (bypassPermissions). */
export type PermissionModeDto = 'acceptEdits' | 'ask' | 'auto' | 'bypassPermissions' | 'plan';
export type EffortDto = 'high' | 'low' | 'max' | 'medium' | 'xhigh';

/** Valeurs par défaut d'une nouvelle session réglées à un niveau (profil, projet, groupe) ; null : hériter. */
export interface SessionDefaultsDto {
  effort: EffortDto | null;
  model: null | string;
  permissionMode: null | PermissionModeDto;
  /** Profil Claude Code (son dossier) ; jamais réglé au niveau d'un profil */
  profile: null | string;
}

/**
 * D'où vient une valeur d'une nouvelle session : le choix fait pour elle, le groupe, le projet principal, les réglages
 * du profil dans Bosco, le profil Claude Code, le défaut d'un bac à sable ou le profil par défaut de Bosco.
 */
export type DefaultOriginDto =
  | { level: 'claudeProfile' | 'defaultProfile' | 'none' | 'sandbox' | 'session' }
  | { level: 'group' | 'profile' | 'project'; name: string };

export interface ResolvedDto<T> {
  origin: DefaultOriginDto;
  value: T;
}

/** Valeurs d'une nouvelle session avant tout choix, chacune avec son origine (GET /api/pilot/defaults). */
export interface SessionDefaultsResolvedDto {
  effort: ResolvedDto<EffortDto | null>;
  model: ResolvedDto<null | string>;
  permissionMode: ResolvedDto<PermissionModeDto>;
  /** Profil (son dossier), et son nom court pour dire l'origine des autres valeurs */
  profile: ResolvedDto<null | string>;
}

/** Réglages d'un tour piloté : mode d'autorisations, modèle (null : celui du profil), effort (null : celui du profil). */
export interface PilotSettingsDto {
  effort: EffortDto | null;
  model: null | string;
  permissionMode: PermissionModeDto;
}

/** Session pilotée par Bosco : ses réglages, son tour en cours et le message qui attend la fin du tour. */
export interface PilotDto {
  /** Message qui partira à la fin du tour */
  pending: null | { images: number; text: string };
  /** Autres projets de la session (leur racine), que l'agent voit en plus de son projet principal */
  projects: string[];
  running: boolean;
  /** Bac à sable de la session ; null : elle tourne sur le poste */
  sandbox: null | PilotSandboxDto;
  settings: PilotSettingsDto;
  since: string;
}

/** Bac à sable d'une session pilotée : sa branche, l'état de son conteneur et sa récupération. */
export interface PilotSandboxDto {
  branch: string;
  /** Copies des autres projets d'une session à plusieurs projets, sur la même branche */
  copies: { from: string; retrievedAt: null | string; root: string }[];
  from: string;
  /** Supprimé : la session reste lisible, mais ne se reprend plus */
  removed: boolean;
  retrievedAt: null | string;
  /** Services de données du projet (base, cache…), démarrés avec le bac à sable ; error : fichier Compose illisible */
  services: { error: null | string; services: SandboxServiceDto[] };
  state: 'missing' | 'running' | 'stopped';
  /** Arrêt du conteneur sans nouveau message */
  stopsAt: string;
}

/** Un service de données du bac à sable, joint par l'agent sous son nom (« db ») */
export interface SandboxServiceDto {
  error: null | string;
  image: string;
  name: string;
  state: 'failed' | 'ready' | 'starting';
}

/** Branches d'un bac à sable, une par projet, le principal d'abord, avec les fichiers qu'elles ont changés. */
export interface SandboxBranchesDto {
  branches: { files: number; from: string; project: string; retrievedAt: null | string }[];
}

/** Branches récupérées dans les dépôts du poste, projet par projet ; branch : la première, null s'il n'y en a pas. */
export interface RetrievedBranchesDto {
  branch: null | string;
  branches: { branch: string; project: string }[];
}

/** Ce que le détail d'un bac à sable lit à la demande : les sorties réseau refusées. */
export interface SandboxRefusalsDto {
  refusals: { at: string; host: string }[];
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

/**
 * Nouvelle session : projet (sa racine), profil Claude Code (son dossier ; null : selon les valeurs par défaut),
 * premier message, et les réglages choisis pour elle (null : selon les valeurs par défaut).
 */
/** Où une session travaille dans un projet : une branche du dépôt, ou un de ses worktrees (son dossier). */
export type CheckoutChoiceDto = { branch: string; kind: 'branch' } | { kind: 'worktree'; path: string };

/**
 * Branches et worktrees d'un projet, proposés au démarrage d'une session : la branche active de son dossier, ses
 * worktrees (dossier et branche, null : détaché) et les branches locales ouvertes dans aucun worktree.
 */
export interface ProjectCheckoutsDto {
  active: null | string;
  branches: string[];
  worktrees: { branch: null | string; path: string }[];
}

export interface StartSessionDto extends Omit<PilotMessageDto, 'settings'> {
  /** Groupe choisi : ses valeurs par défaut passent avant celles du projet principal */
  group?: null | number;
  profile: null | string;
  settings: Omit<SessionDefaultsDto, 'profile'>;
  /** Projet principal (sa racine) : le dossier de travail de la session */
  project: string;
  /** Autres projets de la session, qu'elle voit en plus du principal */
  projects?: string[];
  /**
   * Branche ou worktree choisi pour chaque projet, par racine ; absent : la branche active (sur le poste, le dossier du
   * projet ; en bac à sable, la branche de départ réglée pour le projet, sinon la courante)
   */
  checkouts?: Record<string, CheckoutChoiceDto>;
  /**
   * Dans un bac à sable : branche de la session (null : proposée), branche de départ du principal et des
   * autres projets, par racine (null : celle réglée pour le projet, sinon la courante)
   */
  sandbox?: null | {
    branch: null | string;
    startBranch: null | string;
    startBranches?: Record<string, null | string>;
  };
}

/** Ce que propose le formulaire d'une nouvelle session : les projets et les abonnements Claude. */
export interface PilotOptionsDto {
  /** Profils Claude Code surveillés qui ont un accès (connexion ou jeton longue durée), et celui du projet choisi */
  profiles: { access: 'login' | 'token'; account: null | string; label: string; path: string }[];
  /**
   * Projets ajoutés : branche courante (départ proposé d'un bac à sable, sauf branche réglée pour le projet), git (sans
   * git, pas de bac à sable) et dernier « Où elle tourne » choisi pour le projet
   */
  projects: {
    branch: null | string;
    /** Fichiers modifiés du poste, non commités, qu'un bac à sable ne copie pas ; null sans git */
    changes: null | number;
    /** Domaines propres au projet, ajoutés à la liste générale pour ses bacs à sable */
    domains: string[];
    git: boolean;
    id: number;
    name: string;
    place: 'sandbox' | 'workstation' | null;
    root: string;
    startBranch: null | string;
  }[];
  /** null : le bac à sable est disponible ; sinon la raison (« Docker ne répond pas ») */
  sandboxUnavailable: null | string;
  /** Profils surveillés sans accès utilisable : grisés dans le choix, avec la raison et leur source pour les régler */
  unavailableProfiles: { label: string; path: string; problem: null | string; sourceId: string }[];
}

/** Suggestion de l'éditeur : un fichier du projet après « @ », une commande ou un skill après « / ». */
export interface SuggestionDto {
  description: null | string;
  /** Origine d'une commande : « commande », « skill · profil perso », « projet site-perso » */
  origin: null | string;
  value: string;
}

export interface SessionDto {
  /** Autres projets d'une session pilotée à plusieurs projets, qu'elle voit en plus de son projet principal */
  addedProjects: { id: null | number; name: string; root: string }[];
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
  projectPath: null | string;
  /** Projet qui contient le dossier de travail, et ce dossier à l'intérieur (« packages/budget ») ; null : hors projet */
  project: { folder: string; id: number; name: string; root: string } | null;
  sourceId: string;
  startedAt: string;
  state: SessionStateDto;
  /** Part des sous-agents de la session, comprise dans usage et cost (tokens, dollars) ; null quand elle n'en a pas eu */
  subagents: null | { tokens: number; usd: number };
  title: null | string;
  /** Ouverte dans un terminal : Bosco ne lui écrit pas, on y répond dans le terminal */
  openInTerminal: boolean;
  /** Session pilotée par Bosco ; null pour une session du terminal ou du worker */
  pilot: null | PilotDto;
  /** Session du terminal lancée avec le canal de Bosco, ouvert : Bosco peut lui écrire, en texte */
  channel: boolean;
  /** Réponses de l'agent */
  turns: number;
  usage: { cacheCreation: number; cacheRead: number; input: number; output: number };
  waiting: null | WaitingDto;
}

/** Entrée du fil d'une session : ta demande, la réponse de l'agent, ou une de ses actions. */
/**
 * Entrée du journal d'une session : ce que dit le transcript, ou « Approuver pour moi » suspendu par Claude Code après
 * des refus de suite ou au total (les demandes reviennent alors dans Bosco).
 */
export type JournalEntryDto =
  | { at: string; count: number; kind: 'autoModeSuspended'; seq: number; total: boolean }
  | { at: string; kind: 'prompt' | 'reply' | 'tool'; seq: number; text: string };

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
  /** Demande écrite dans Bosco et arrivée par le canal de Bosco */
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
/** Une notification du centre de notifications. */
export interface NotificationDto {
  at: string;
  /** Décision proposée par un agent, à valider : la notification l'ouvre */
  decisionId: null | number;
  excerpt: null | string;
  id: number;
  kind:
    'decision' | 'ended' | 'failed' | 'long-turn' | 'permission' | 'question' | 'review' | 'sandbox' | 'turn-question';
  /** Projet de la session ou de la tâche (« site-perso ») */
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

/** Un jour de l'historique (GET /api/history), avec son total. */
export interface HistoryDayDto {
  costUsd: number;
  /** Jour local, AAAA-MM-JJ */
  date: string;
  sessions: SessionDto[];
}

/** Canal de Bosco dans un profil surveillé : installé ou non, et la commande qui lance une session avec lui. */
export interface ChannelProfileDto {
  command: string;
  installed: boolean;
  label: string;
  path: string;
}

/** Période des sessions importées dans l'historique : les 30 derniers jours, ou tout l'historique des profils. */
export type HistoryPeriodDto = '30-days' | 'all';

/** Ce que retirer une source changerait, pour la fenêtre de confirmation. */
export interface SourceRemovalDto {
  /** Canal de Bosco installé dans le profil : il est retiré */
  channel: boolean;
  /** Abonnement par défaut de Bosco : il revient à celui de Claude Code */
  defaultSubscription: boolean;
  /** Groupes et projets dont c'est le profil par défaut : ils reprennent l'abonnement par défaut */
  groups: string[];
  label: string;
  /** Suivi en direct (et serveur MCP de Bosco) installé dans le profil : il est retiré, réglages d'avant remis */
  liveTracking: boolean;
  path: string;
  projects: string[];
  /** Sessions du profil dont un tour tourne : le retrait attend qu'ils finissent */
  running: number;
  /** Sessions que Bosco oublie ; les transcripts restent dans le profil */
  sessions: number;
  /** Abonnement par défaut après le retrait (le profil surveillé suivant s'il l'était) ; null sans abonnement */
  subscription: null | string;
}

/** Réglages › Données : l'historique importé, la base de Bosco et ce que la réinitialisation effacerait. */
export interface DataDto {
  /** Dossier des données de Bosco et sa taille en octets, copies des bacs à sable comprises */
  database: { bytes: number; dataDir: string };
  /** Dossier personnel, pour écrire les chemins comme le terminal (~/.local/share/bosco) */
  home: string;
  history: {
    /** Lecture en cours des transcripts plus anciens, après le passage à tout l'historique */
    importing: boolean;
    /** Date de début de la plus ancienne session gardée ; null sans session */
    oldestSessionAt: null | string;
    /** Sessions plus anciennes que la période, encore dans les profils surveillés, et les profils qui les gardent */
    older: { profiles: string[]; sessions: number };
    period: HistoryPeriodDto;
    sessions: number;
  };
  /** Ce que la réinitialisation effacerait, retirerait des profils et perdrait */
  reset: {
    /** Branches de bac à sable pas encore récupérées : elles seraient perdues */
    branches: string[];
    groups: number;
    /** Profils dont le suivi en direct, le canal ou le serveur de Bosco seraient retirés */
    profiles: string[];
    projects: number;
    sessions: number;
    sources: number;
  };
}
