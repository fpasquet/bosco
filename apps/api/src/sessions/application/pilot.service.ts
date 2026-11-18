import type { SessionDefaults } from '../../shared/domain/session-settings.ts';
import type { QuotaWindows } from '../../shared/domain/subscription-quota.ts';
import type { ChannelService } from './channel.service.ts';
import type { LiveSignalService, PermissionAnswer } from './live-signal.service.ts';
import type {
  CatalogProject,
  Clock,
  IdGenerator,
  SessionEvents,
  SessionRegistry,
  SessionRepository,
  SourceRepository,
  TranscriptFiles,
} from './ports.ts';
import type { SessionDefaultsService } from './session-defaults.service.ts';
import type { SessionService } from './session.service.ts';
import { TOKEN_VARIABLE } from '../../shared/domain/profile-access.ts';
import {
  type AgentQuestion,
  allowedByMode,
  answersOf,
  checkPilotMessage,
  DEFAULT_PILOT_SETTINGS,
  InvalidPilotMessage,
  joinMessages,
  NoPilotedTurn,
  otherProjects,
  type PilotMessage,
  type PilotSettings,
  PilotTargetNotFound,
  questionsOf,
  QuotaHeld,
  SessionErased,
  SessionOpenInTerminal,
} from '../domain/pilot.ts';
import {
  checkSandboxBranch,
  housekeepingOf,
  NO_SANDBOX_SERVICES,
  retrievedCopy,
  type SandboxBranch,
  sandboxBranches,
  sandboxBranchOf,
  SandboxError,
  type SandboxInfo,
  type SandboxServices,
  servicesNote,
  stopsAt,
  unretrieved,
} from '../domain/sandbox.ts';
import { settingsOf } from '../domain/session-defaults.ts';

/** Un tour à lancer : `claude -p` dans le dossier du projet, avec le profil, une session nouvelle ou reprise. */
export interface TurnRequest {
  /** Autres projets de la session, passés par --add-dir à chaque tour */
  addDirs: string[];
  /** Contexte des projets de la session, ajouté au prompt système ; null hors des projets connus */
  appendSystemPrompt: null | string;
  /** Dossier de configuration du profil Claude Code */
  configDir: string;
  cwd: string;
  message: PilotMessage;
  /** Commande d'un tour en bac à sable : l'agent tourne dans le conteneur de la session ; null : sur le poste */
  launch: null | TurnLaunch;
  /**
   * Fichier du jeton longue durée de l'abonnement du tour, lu au lancement et passé par CLAUDE_CODE_OAUTH_TOKEN ;
   * null : la connexion du profil. Le chemin seulement : le jeton ne passe jamais par ici
   */
  tokenFile: null | string;
  /** false : une nouvelle session, créée avec cet identifiant */
  resume: boolean;
  sessionId: string;
  settings: PilotSettings;
}

/** Exécution d'un tour ailleurs que sur le poste : le programme et ses premiers arguments, avant ceux du tour. */
/** Un bac à sable prêt pour un tour : la commande du tour (null : sur le poste, scénarios) et ses services de données */
export interface StartedSandbox {
  launch: null | TurnLaunch;
  services: SandboxServices;
}

export interface TurnLaunch {
  args: string[];
  file: string;
}

/** État du conteneur d'un bac à sable. */
export type SandboxState = 'missing' | 'running' | 'stopped';

/**
 * Bacs à sable des sessions : copie du projet sur la branche de la session et dossier personnel de
 * l'agent, gardés hors du conteneur ; conteneur isolé comme un agent du worker.
 */
export interface Sandboxes {
  /** Profil où les conversations des bacs à sable sont gardées, rangées avec leur projet : une source surveillée */
  readonly profile: string;
  currentBranch(projectRoot: string): Promise<null | string>;
  /**
   * Démarre le conteneur, le crée s'il manque, avec la copie de chaque projet montée à son chemin du poste (le
   * principal d'abord) ; la commande d'un tour, null : sur le poste (scénarios)
   */
  /** env : variables du tour à transmettre au conteneur (le jeton longue durée de l'abonnement) */
  ensure(sessionId: string, projectRoots: readonly string[], env?: readonly string[]): Promise<StartedSandbox>;
  /** Une copie par projet, le principal d'abord, toutes sur la même branche ; refusée si un projet a déjà la branche */
  prepare(input: {
    branch: string;
    profile: string;
    projects: readonly { root: string; startBranch: null | string }[];
    sessionId: string;
  }): Promise<{ base: string; from: string }[]>;
  refusals(sessionId: string): Promise<{ at: Date; host: string }[]>;
  remove(sessionId: string): Promise<void>;
  /** Enregistre le travail en cours d'une copie dans la branche, puis la rapatrie dans son projet ; la branche reçue */
  retrieve(input: { branch: string; copy: number; projectRoot: string; sessionId: string }): Promise<string>;
  /** Fichiers modifiés du poste, non commités, qu'une copie ne prend pas ; null hors de git */
  uncommitted(projectRoot: string): Promise<null | number>;
  /** Fichiers que la branche d'une copie a changés depuis son départ, travail en cours compris */
  work(input: { base: string; copy: number; sessionId: string }): Promise<number>;
  state(sessionId: string): Promise<SandboxState>;
  stop(sessionId: string): Promise<void>;
  /** null quand un bac à sable peut démarrer ; sinon la raison (« Docker ne répond pas ») */
  unavailable(): Promise<null | string>;
}

/** Ce que l'agent d'un tour demande ou signale, par le protocole de contrôle. */
export interface TurnListener {
  /** L'agent a abandonné une demande (après une interruption) */
  cancelled(requestId: string): void;
  /** Le processus est sorti ; error : il s'est arrêté sans rendre de résultat */
  exited(error: null | string): void;
  permission(requestId: string, tool: string, input: Record<string, unknown>): void;
  /**
   * « Approuver pour moi » suspendu par Claude Code : `count` refus de suite, ou au total (`total`) ; la demande qui
   * suit arrive par `permission`
   */
  suspended(count: number, total: boolean): void;
  question(requestId: string, input: Record<string, unknown>): void;
  /** Usage de l'abonnement, donné à chaque tour */
  quota(windows: QuotaWindows): void;
  /** L'agent a rendu la main : son dernier message */
  result(message: null | string): void;
}

export interface RunningTurn {
  allow(requestId: string, input: Record<string, unknown>): void;
  deny(requestId: string, message: string): void;
  /** Fin du tour : l'entrée se ferme et l'agent s'arrête */
  finish(): void;
  /** « Arrêter » : interrompt le tour, comme Échap dans le terminal */
  interrupt(): void;
  /** Processus de l'agent sur le poste, pour mesurer ce qu'il consomme ; null s'il n'a pas démarré */
  pid: null | number;
  /** Change le mode d'autorisations du tour en cours */
  setPermissionMode(mode: PilotSettings['permissionMode']): void;
}

export interface TurnRunner {
  start(request: TurnRequest, listener: TurnListener): RunningTurn;
}

/** Une session pilotée par Bosco : où elle tourne et ses réglages, gardés d'un tour à l'autre. */
export interface PilotRecord {
  /**
   * Contexte transmis au premier tour lancé par Bosco, repris tel quel aux suivants : les décisions acceptées ensuite
   * n'atteignent que les sessions lancées après. null : pas encore fixé, ou hors des projets connus
   */
  context?: null | string;
  /** Projet principal : le dossier de travail de la session */
  cwd: string;
  /** Autres projets de la session, passés par --add-dir à chaque tour ; [] : un seul projet */
  projects: string[];
  /** Bac à sable de la session ; null : elle tourne sur le poste */
  sandbox: null | SandboxInfo;
  sessionId: string;
  settings: PilotSettings;
  since: Date;
  sourceId: string;
}

/** Contexte des projets d'une session : instructions des groupes, décisions acceptées, place dans l'architecture. */
export interface PilotContext {
  /** Le projet principal d'abord, puis les autres, coupé à 10 000 caractères ; null hors des projets connus */
  textOf(cwd: string, projects: readonly string[]): Promise<null | string>;
}

export interface PilotRepository {
  list(): Promise<PilotRecord[]>;
  save(record: PilotRecord): Promise<void>;
}

/** Profil qui a un accès à l'abonnement : sa connexion, ou le fichier de son jeton longue durée. */
export interface PilotSubscription {
  access: 'login' | 'token';
  account: null | string;
  label: string;
  path: string;
  tokenFile: null | string;
}

/** Abonnements Claude : les profils qui ont un accès, ceux qui n'en ont pas (grisés), et celui par défaut. */
export interface PilotProfiles {
  subscriptions(): Promise<{
    choices: PilotSubscription[];
    effective: null | string;
    unavailable?: { label: string; path: string; problem: null | string; tokenFile: null | string }[];
  }>;
}

/** Quota de l'abonnement : l'usage lu à chaque tour, et les seuils qui retiennent puis arrêtent un tour. */
export interface PilotQuota {
  /** Pourquoi un tour de cet abonnement ne part pas ; null s'il peut partir */
  holdReason(profile: string, sandboxed: boolean): null | string;
  record(profile: string, windows: QuotaWindows): void;
  /** Pourquoi le tour en cours s'arrête ; null s'il peut continuer */
  stopReason(profile: string, sandboxed: boolean): null | string;
}

/** Ce que l'interface voit d'une session pilotée. */
export interface PilotView {
  pending: null | { images: number; text: string };
  /** Autres projets de la session, que l'agent voit en plus de son projet principal */
  projects: string[];
  running: boolean;
  sandbox: null | {
    branch: string;
    /** Copies des autres projets : d'où part leur branche, et leur dernière récupération */
    copies: { from: string; retrievedAt: Date | null; root: string }[];
    from: string;
    removed: boolean;
    retrievedAt: Date | null;
    /** Services de données du projet, démarrés avec le bac à sable */
    services: SandboxServices;
    state: SandboxState;
    stopsAt: Date;
  };
  settings: PilotSettings;
  since: Date;
}

interface Turn {
  /** Demandes en cours (autorisation, question) et ce qui les abandonne si le tour s'arrête */
  abandons: Map<string, () => void>;
  /** Outil de l'autorisation qui attend la personne : un changement de mode peut la régler */
  asking: null | string;
  /** Écriture en cours d'une suspension dans le journal : la demande qui la suit attend qu'elle soit enregistrée */
  noting: Promise<void>;
  process: RunningTurn;
  result: boolean;
  startedAt: Date;
  /** Arrêté par le quota de l'abonnement : la raison, dite à la fin du tour */
  stopped: null | string;
}

type Signals = Pick<LiveSignalService, 'allowPending' | 'receive' | 'requestAnswers' | 'requestPermission'>;

const NO_PROFILES: PilotProfiles = { subscriptions: () => Promise.resolve({ choices: [], effective: null }) };

const NO_QUOTA: PilotQuota = { holdReason: () => null, record: () => undefined, stopReason: () => null };

/** Ce que le bac à sable demande en plus au démarrage : la source de ses conversations, et la notification de la veille. */
interface SandboxDeps {
  ensureSource: (path: string) => Promise<{ id: string }>;
  sandboxes: Sandboxes;
  /** La branche a du travail non récupéré : le bac à sable sera supprimé demain */
  warn: (sessionId: string, branch: string) => Promise<void>;
}

/** Ce que l'agent veut faire, comme le montre la carte d'autorisation : la commande, le fichier ou l'adresse. */
function detailOf(input: Record<string, unknown>): null | string {
  for (const key of ['command', 'file_path', 'notebook_path', 'url', 'pattern']) {
    const value = input[key];
    if (typeof value === 'string' && value) return value;
  }
  return null;
}

/**
 * Sessions pilotées par Bosco : démarrer une session, lui écrire, mettre un message
 * en attente pendant un tour, arrêter un tour, répondre à ses autorisations et à ses questions depuis Bosco.
 */
export class PilotService {
  private readonly records = new Map<string, PilotRecord>();
  private readonly turns = new Map<string, Turn>();
  private readonly pending = new Map<string, PilotMessage>();
  private defaults: null | Pick<SessionDefaultsService, 'resolveDefaults'> = null;
  private context: PilotContext = { textOf: () => Promise.resolve(null) };
  private profiles: PilotProfiles = NO_PROFILES;
  private sandbox: null | SandboxDeps = null;
  /** Usage de l'abonnement lu dans le flux d'un tour, rangé par profil Claude, et ses seuils */
  private quota: PilotQuota = NO_QUOTA;
  /** État de chaque conteneur, relu par l'entretien : la vue de la session le montre sans attendre Docker */
  private readonly sandboxStates = new Map<string, SandboxState>();
  /** Services de données de chaque bac à sable, tels que son dernier démarrage les a laissés */
  private readonly sandboxServices = new Map<string, SandboxServices>();
  private channel: Pick<ChannelService, 'isConnected' | 'send'> = { isConnected: () => false, send: () => false };

  constructor(
    private readonly repository: PilotRepository,
    private readonly runner: TurnRunner,
    private readonly signals: Signals,
    private readonly sessions: Pick<
      SessionService,
      'knownProjects' | 'noteAutoModeSuspended' | 'rememberPlace' | 'viewOf'
    >,
    private readonly sessionRepository: Pick<SessionRepository, 'find'>,
    private readonly sources: Pick<SourceRepository, 'list'>,
    private readonly registry: Pick<SessionRegistry, 'isOpen'>,
    private readonly events: Pick<SessionEvents, 'sessionChanged'>,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly transcripts: TranscriptFiles = { exists: () => Promise.resolve(true) },
  ) {}

  /** Sessions pilotées connues, lues au démarrage (et après une remise à zéro des scénarios). */
  async load(): Promise<void> {
    this.records.clear();
    for (const record of await this.repository.list()) this.records.set(record.sessionId, record);
  }

  /** Quota de l'abonnement, branché au démarrage : chaque tour piloté le tient à jour, ses seuils le retiennent. */
  useQuota(quota: PilotQuota): void {
    this.quota = quota;
  }

  /** Bacs à sable des sessions, branchés au démarrage. */
  useSandboxes(deps: SandboxDeps): void {
    this.sandbox = deps;
  }

  /** Valeurs par défaut des nouvelles sessions, branchées au démarrage. */
  /** Contexte des projets, branché au démarrage : chaque session pilotée le reçoit dès son premier tour. */
  useContext(context: PilotContext): void {
    this.context = context;
  }

  useDefaults(defaults: Pick<SessionDefaultsService, 'resolveDefaults'>): void {
    this.defaults = defaults;
  }

  /** Abonnements Claude et celui par défaut, branchés au démarrage. */
  useProfiles(profiles: PilotProfiles): void {
    this.profiles = profiles;
  }

  isRunning(sessionId: string): boolean {
    return this.turns.has(sessionId);
  }

  /** Sessions dont le bac à sable existe encore : le panneau des conteneurs les nomme. */
  sandboxedSessions(): string[] {
    return [...this.records.values()]
      .filter(({ sandbox }) => sandbox !== null && sandbox.removedAt === null)
      .map(({ sessionId }) => sessionId);
  }

  /**
   * Tours en cours, avec le processus de leur agent : le panneau des conteneurs mesure ceux du poste. Celui d'un bac à
   * sable tourne dans son conteneur : son processus sur le poste n'est que `docker exec`.
   */
  runningTurns(): { pid: null | number; sandboxed: boolean; sessionId: string; since: Date }[] {
    return [...this.turns].map(([sessionId, turn]) => ({
      pid: turn.process.pid,
      sandboxed: Boolean(this.records.get(sessionId)?.sandbox),
      sessionId,
      since: turn.startedAt,
    }));
  }

  pilotOf(sessionId: string): null | PilotView {
    const record = this.records.get(sessionId);
    if (!record) return null;
    const pending = this.pending.get(sessionId);
    const { sandbox } = record;
    return {
      pending: pending ? { images: pending.images.length, text: pending.text } : null,
      projects: [...record.projects],
      running: this.turns.has(sessionId),
      sandbox: sandbox && {
        branch: sandbox.branch,
        copies: sandbox.copies.map(({ from, retrievedAt, root }) => ({ from, retrievedAt, root })),
        from: sandbox.from,
        removed: sandbox.removedAt !== null,
        retrievedAt: sandbox.retrievedAt,
        services: sandbox.removedAt
          ? NO_SANDBOX_SERVICES
          : (this.sandboxServices.get(sessionId) ?? NO_SANDBOX_SERVICES),
        state: sandbox.removedAt ? 'missing' : (this.sandboxStates.get(sessionId) ?? 'stopped'),
        stopsAt: stopsAt(sandbox),
      },
      settings: record.settings,
      since: record.since,
    };
  }

  /** Ouverte dans un terminal : le registre de Claude Code la dit ouverte, sans tour piloté en cours. */
  openInTerminal(sourceId: string, sessionId: string): boolean {
    if (this.records.get(sessionId)?.sandbox) return false;
    return !this.turns.has(sessionId) && this.registry.isOpen(sourceId, sessionId) === true;
  }

  /** Formulaire d'une nouvelle session : projets connus, abonnements et celui par défaut. */
  async options(): Promise<{
    profiles: { access: 'login' | 'token'; account: null | string; label: string; path: string }[];
    projects: {
      branch: null | string;
      /** Fichiers modifiés du poste, non commités, qu'un bac à sable ne copie pas ; null sans git */
      changes: null | number;
      domains: string[];
      git: boolean;
      id: number;
      name: string;
      place: 'sandbox' | 'workstation' | null;
      root: string;
      startBranch: null | string;
    }[];
    sandboxUnavailable: null | string;
    /** Profils surveillés sans accès utilisable : grisés, avec la raison et la source pour aller les régler */
    unavailableProfiles: { label: string; path: string; problem: null | string; sourceId: string }[];
  }> {
    const sources = await this.sources.list();
    const watched = new Set(sources.filter((source) => source.watched).map(({ path }) => path));
    const known = await this.sessions.knownProjects();
    const { choices, unavailable = [] } = await this.profiles.subscriptions();
    const profiles = choices
      .filter(({ path }) => watched.has(path))
      .map(({ access, account, label, path }) => ({ access, account, label, path }));
    const unavailableProfiles = unavailable.flatMap(({ label, path, problem }) => {
      const source = sources.find((candidate) => candidate.path === path && candidate.watched);
      return source ? [{ label, path, problem, sourceId: source.id }] : [];
    });
    const projects = [];
    for (const { domains, git, id, name, place, root, startBranch } of known) {
      const sandboxes = this.sandbox && git ? this.sandbox.sandboxes : null;
      const [branch, changes] = sandboxes
        ? await Promise.all([
            sandboxes.currentBranch(root).catch(() => null),
            sandboxes.uncommitted(root).catch(() => null),
          ])
        : [null, null];
      projects.push({ branch, changes, domains, git, id, name, place, root, startBranch });
    }
    const sandboxUnavailable = this.sandbox
      ? await this.sandbox.sandboxes.unavailable()
      : 'Bac à sable indisponible sur ce poste';
    return { profiles, projects, sandboxUnavailable, unavailableProfiles };
  }

  /**
   * « Démarrer la session » : une nouvelle session dans le dossier du projet principal, qui
   * voit aussi les autres projets choisis. Son profil, son mode, son modèle et son effort sont ceux choisis
   * pour elle, sinon ceux du groupe, du projet principal, du profil, puis du profil Claude Code.
   */
  async start(input: {
    /** Groupe choisi : ses valeurs par défaut passent avant celles du projet principal */
    group?: null | number;
    message: PilotMessage;
    profile: null | string;
    /** Projet principal (sa racine) : le dossier de travail de la session */
    project: string;
    /** Autres projets de la session, dans l'ordre ; absent : un seul projet */
    projects?: readonly string[];
    /**
     * Dans un bac à sable : branche de la session (null : proposée) et branche de départ de chaque
     * projet (null : celle réglée pour le projet, sinon la courante) ; startBranch vaut pour le projet principal
     */
    sandbox?: null | {
      branch: null | string;
      startBranch: null | string;
      startBranches?: Readonly<Record<string, null | string>>;
    };
    /** Réglages choisis pour la session ; null : selon les valeurs par défaut */
    settings: SessionDefaults;
  }): Promise<string> {
    const message = checkPilotMessage(input.message);
    const known = await this.sessions.knownProjects();
    const projectOf = (root: string) => {
      const found = known.find((candidate) => candidate.root === root);
      if (!found) throw new PilotTargetNotFound(`Bosco ne connaît pas le projet ${root}.`);
      return found;
    };
    const project = projectOf(input.project);
    const others = otherProjects(project.root, input.projects ?? []).map(projectOf);
    // Un bac à sable copie le dépôt git de chaque projet : un dossier sans git tourne seulement sur le poste
    const withoutGit = [project, ...others].find(({ git }) => !git);
    if (input.sandbox && withoutGit)
      throw new SandboxError(
        'projectWithoutGit',
        `Le projet ${withoutGit.name} n’est pas un dépôt git : pas de bac à sable.`,
      );
    const resolved = await this.resolveStart(input, project.root);
    const profile = input.profile ?? resolved.profile;
    const sources = await this.sources.list();
    const source = sources.find(({ path, watched }) => watched && path === profile);
    if (!source)
      throw new PilotTargetNotFound('Choisis un abonnement Claude parmi les profils surveillés par Bosco (Sources).');
    this.checkQuota(source.path, Boolean(input.sandbox));
    const sessionId = this.ids.next();
    const record: PilotRecord = input.sandbox
      ? await this.sandboxed(sessionId, [project, ...others], source.path, message, input.sandbox)
      : {
          cwd: project.root,
          projects: others.map(({ root }) => root),
          sandbox: null,
          sessionId,
          settings: resolved.settings,
          since: this.clock.now(),
          sourceId: source.id,
        };
    record.settings = resolved.settings;
    await this.keep(record);
    await this.sessions.rememberPlace(project.root, input.sandbox ? 'sandbox' : 'workstation');
    await this.run(record, message, false);
    return record.sessionId;
  }

  /** Profil et réglages du premier tour : le choix de la session, sinon les valeurs par défaut. */
  private async resolveStart(
    input: { group?: null | number; profile: null | string; sandbox?: unknown; settings: SessionDefaults },
    project: string,
  ): Promise<{ profile: null | string; settings: PilotSettings }> {
    const sandboxed = Boolean(input.sandbox);
    if (!this.defaults) {
      // Sans valeurs par défaut branchées : le choix de la session, sinon l'abonnement par défaut et « Demander »
      const accounts = await this.profiles.subscriptions();
      const { effort, model, permissionMode } = input.settings;
      const mode = permissionMode ?? (sandboxed ? 'acceptEdits' : 'ask');
      return { profile: accounts.effective, settings: { effort, model, permissionMode: mode } };
    }
    const resolved = await this.defaults.resolveDefaults({
      chosen: input.settings,
      group: input.group ?? null,
      profile: input.profile,
      project,
      sandboxed,
    });
    return { profile: resolved.profile.value, settings: settingsOf(resolved) };
  }

  /**
   * Prépare le bac à sable d'une nouvelle session : la copie du projet sur sa branche, l'accès à
   * l'abonnement du profil choisi ; ses conversations rejoignent le profil des bacs à sable, une source surveillée.
   */
  private async sandboxed(
    sessionId: string,
    projects: readonly CatalogProject[],
    profile: string,
    message: PilotMessage,
    choice: {
      branch: null | string;
      startBranch: null | string;
      startBranches?: Readonly<Record<string, null | string>>;
    },
  ): Promise<PilotRecord> {
    const deps = this.sandbox;
    const unavailable = deps ? await deps.sandboxes.unavailable() : 'Bac à sable indisponible sur ce poste';
    if (!deps || unavailable) throw new SandboxError('sandboxUnavailable', unavailable ?? 'Bac à sable indisponible');
    const branch = checkSandboxBranch(choice.branch ?? sandboxBranchOf(message.text));
    // Branche de départ de chaque projet : celle choisie, sinon celle réglée pour le projet, sinon la courante
    const starts = [];
    for (const [index, { root, startBranch }] of projects.entries()) {
      const chosen = index === 0 ? choice.startBranch : choice.startBranches?.[root];
      starts.push({
        root,
        startBranch: chosen?.trim() || startBranch || (await deps.sandboxes.currentBranch(root)),
      });
    }
    const [principal, ...copies] = await deps.sandboxes.prepare({ branch, profile, projects: starts, sessionId });
    // La source des bacs à sable se surveille une fois son dossier des conversations créé : sinon le premier bac à
    // sable du poste ne serait lu qu'au redémarrage de Bosco
    const source = await deps.ensureSource(deps.sandboxes.profile);
    const root = projects[0]?.root ?? '';
    const now = this.clock.now();
    return {
      cwd: root,
      projects: projects.slice(1).map((project) => project.root),
      sandbox: {
        base: principal?.base ?? '',
        branch,
        copies: copies.map(({ base, from }, index) => ({
          base,
          from,
          retrievedAt: null,
          root: projects[index + 1]?.root ?? '',
        })),
        from: principal?.from ?? '',
        lastMessageAt: now,
        profile,
        removedAt: null,
        retrievedAt: null,
        warnedAt: null,
      },
      sessionId,
      settings: DEFAULT_PILOT_SETTINGS,
      since: now,
      sourceId: source.id,
    };
  }

  /** Le bac à sable de la session, encore là ; sinon une erreur qui dit pourquoi. */
  private sandboxOf(sessionId: string): { deps: SandboxDeps; record: PilotRecord; sandbox: SandboxInfo } {
    const record = this.records.get(sessionId);
    const sandbox = record?.sandbox;
    if (!record || !sandbox || !this.sandbox)
      throw new PilotTargetNotFound(`La session ${sessionId} ne tourne pas dans un bac à sable.`);
    if (sandbox.removedAt)
      throw new SandboxError('sandboxRemoved', 'Ce bac à sable a été supprimé : la session ne se reprend plus.');
    return { deps: this.sandbox, record, sandbox };
  }

  /** Entre deux tours seulement : un tour en cours écrit encore dans la copie. */
  private idleSandbox(sessionId: string) {
    const found = this.sandboxOf(sessionId);
    if (this.turns.has(sessionId))
      throw new SandboxError('sandboxBusy', 'Un tour est en cours : attends qu’il finisse.');
    return found;
  }

  /**
   * « Récupérer la branche » : le travail rejoint le dépôt du poste, sans toucher à sa branche courante.
   * « Récupérer les branches » : un projet à la fois, ou toutes celles qui ont du travail, les projets
   * sans changement étant laissés. Les branches reçues, projet par projet.
   */
  async retrieve(sessionId: string, project: null | string = null): Promise<{ branch: string; project: string }[]> {
    const { deps, record } = this.idleSandbox(sessionId);
    let sandbox = record.sandbox as SandboxInfo;
    const all = sandboxBranches(sandbox, record.cwd);
    const asked = project === null ? all : all.filter(({ root }) => root === project);
    if (asked.length === 0) throw new PilotTargetNotFound(`Le projet ${project} n’est pas dans ce bac à sable.`);
    // Avec un seul projet, la branche se récupère toujours ; avec plusieurs, seules celles qui ont du travail
    const chosen = project !== null || all.length === 1 ? asked : await this.withWork(deps.sandboxes, sessionId, asked);
    const retrieved = [];
    for (const { copy, root } of chosen) {
      const branch = await deps.sandboxes.retrieve({ branch: sandbox.branch, copy, projectRoot: root, sessionId });
      sandbox = retrievedCopy(sandbox, copy, this.clock.now());
      retrieved.push({ branch, project: root });
    }
    await this.keep({ ...record, sandbox });
    await this.publish(sessionId);
    return retrieved;
  }

  private async withWork(sandboxes: Sandboxes, sessionId: string, copies: SandboxBranch[]): Promise<SandboxBranch[]> {
    const found = [];
    for (const copy of copies) if ((await sandboxes.work({ ...copy, sessionId })) > 0) found.push(copy);
    return found;
  }

  /** Branches du bac à sable, une par projet, avec ce qu'elles contiennent : la carte « Branches ». */
  async branches(
    sessionId: string,
  ): Promise<{ files: number; from: string; project: string; retrievedAt: Date | null }[]> {
    const record = this.records.get(sessionId);
    if (!record?.sandbox || !this.sandbox) return [];
    const { sandboxes } = this.sandbox;
    const branches = [];
    for (const copy of sandboxBranches(record.sandbox, record.cwd)) {
      const files = record.sandbox.removedAt ? 0 : await sandboxes.work({ ...copy, sessionId }).catch(() => 0);
      branches.push({ files, from: copy.from, project: copy.root, retrievedAt: copy.retrievedAt });
    }
    return branches;
  }

  /** « Arrêter le bac à sable » : le conteneur s'arrête, la copie reste ; le message suivant le relance. */
  async stopSandbox(sessionId: string): Promise<void> {
    const { deps } = this.idleSandbox(sessionId);
    await deps.sandboxes.stop(sessionId);
    this.sandboxStates.set(sessionId, 'stopped');
    await this.publish(sessionId);
  }

  /** « Supprimer le bac à sable » : conteneur et copie effacés ; la session reste lisible. */
  async removeSandbox(sessionId: string): Promise<void> {
    const { deps, record, sandbox } = this.idleSandbox(sessionId);
    await deps.sandboxes.remove(sessionId);
    this.sandboxStates.set(sessionId, 'missing');
    this.sandboxServices.delete(sessionId);
    await this.keep({ ...record, sandbox: { ...sandbox, removedAt: this.clock.now() } });
    await this.publish(sessionId);
  }

  /** Sorties réseau refusées du bac à sable, lues à la demande. */
  async refusals(sessionId: string): Promise<{ at: Date; host: string }[]> {
    const record = this.records.get(sessionId);
    if (!record?.sandbox || !this.sandbox) return [];
    return this.sandbox.sandboxes.refusals(sessionId);
  }

  /**
   * Entretien des bacs à sable : l'état de chaque conteneur est relu ; un conteneur sans message depuis
   * 30 min s'arrête, la veille de la suppression une notification part si la branche a du travail, puis le bac à
   * sable est supprimé au bout de 7 jours.
   */
  async housekeeping(): Promise<void> {
    const deps = this.sandbox;
    if (!deps) return;
    const now = this.clock.now();
    for (const record of this.records.values()) {
      const { sandbox, sessionId } = record;
      if (!sandbox || sandbox.removedAt) continue;
      const state = await deps.sandboxes.state(sessionId).catch((): SandboxState => 'missing');
      this.sandboxStates.set(sessionId, state);
      const action = housekeepingOf(sandbox, now, { running: state === 'running', turn: this.turns.has(sessionId) });
      if (action === 'stop') {
        await deps.sandboxes.stop(sessionId).catch(() => undefined);
        this.sandboxStates.set(sessionId, 'stopped');
      } else if (action === 'warn') {
        // Seule une branche qui a avancé depuis sa dernière récupération mérite l'avertissement
        if (unretrieved(sandbox)) await deps.warn(sessionId, sandbox.branch).catch(() => undefined);
        await this.keep({ ...record, sandbox: { ...sandbox, warnedAt: now } });
      } else if (action === 'remove') {
        await deps.sandboxes.remove(sessionId).catch(() => undefined);
        this.sandboxStates.set(sessionId, 'missing');
        await this.keep({ ...record, sandbox: { ...sandbox, removedAt: now } });
      }
      if (action) await this.publish(sessionId);
    }
  }

  /**
   * Un message à une session : il lance un tour, ou attend la fin du tour en cours.
   * Une session close, du terminal ou de Bosco, reprend dans Bosco et devient pilotée. Une session ouverte dans un
   * terminal le reçoit par le canal de Bosco, si elle a été lancée avec lui.
   */
  async send(
    sessionId: string,
    input: { message: PilotMessage; settings: PilotSettings },
  ): Promise<'channel' | 'queued' | 'sent'> {
    const message = checkPilotMessage(input.message);
    const record = await this.recordOf(sessionId);
    if (record.sandbox) this.sandboxOf(sessionId);
    // Sans registre des sessions ouvertes, une session du terminal qui tourne ou attend y est encore ouverte
    const inTerminal =
      this.openInTerminal(record.sourceId, sessionId) ||
      (!this.records.has(sessionId) && (await this.isLive(sessionId)));
    if (inTerminal) return this.throughChannel(sessionId, message);
    if (!this.turns.has(sessionId)) await this.checkResumable(record);
    await this.checkQuotaOf(record);
    // Un message repousse l'arrêt et la suppression du bac à sable
    const sandbox = record.sandbox && { ...record.sandbox, lastMessageAt: this.clock.now(), warnedAt: null };
    await this.keep({ ...record, sandbox, settings: input.settings });
    if (this.turns.has(sessionId)) {
      this.pending.set(sessionId, joinMessages(this.pending.get(sessionId) ?? null, message));
      await this.publish(sessionId);
      return 'queued';
    }
    await this.run(this.records.get(sessionId) ?? record, message, true);
    return 'sent';
  }

  /** Canal de Bosco, branché au démarrage. */
  useChannel(channel: Pick<ChannelService, 'isConnected' | 'send'>): void {
    this.channel = channel;
  }

  /** Le canal de la session est ouvert : l'étiquette « Canal de Bosco » et la zone réduite. */
  channelOpen(sessionId: string): boolean {
    return this.channel.isConnected(sessionId);
  }

  /** Message à une session du terminal : par son canal, en texte seulement ; sans canal, on y répond dans le terminal. */
  private throughChannel(sessionId: string, message: PilotMessage): 'channel' {
    if (!this.channel.isConnected(sessionId)) throw new SessionOpenInTerminal(sessionId);
    if (message.images.length > 0)
      throw new InvalidPilotMessage('Le canal de Bosco ne transmet que du texte : retire les images.');
    this.channel.send(sessionId, message.text);
    return 'channel';
  }

  /** « Annuler » le message en attente. */
  async cancelPending(sessionId: string): Promise<void> {
    if (!this.pending.delete(sessionId)) throw new NoPilotedTurn(sessionId);
    await this.publish(sessionId);
  }

  /**
   * Réglages changés dans la barre d'outils : ils valent pour les tours suivants, et le mode d'autorisations aussi pour
   * le tour en cours. La demande qui attend passe d'elle-même si le nouveau mode l'autorise (Accès complet, ou une
   * modification de fichier en Accepter les modifications).
   */
  async changeSettings(sessionId: string, settings: PilotSettings): Promise<void> {
    const record = await this.recordOf(sessionId);
    await this.keep({ ...record, settings });
    const turn = this.turns.get(sessionId);
    if (turn && settings.permissionMode !== record.settings.permissionMode) {
      turn.process.setPermissionMode(settings.permissionMode);
      if (turn.asking && allowedByMode(settings.permissionMode, turn.asking))
        await this.signals.allowPending(sessionId, 'Autorisé par le changement de mode');
    }
    await this.publish(sessionId);
  }

  /** « Arrêter » : le tour s'interrompt, le message en attente reste. */
  interrupt(sessionId: string): void {
    const turn = this.turns.get(sessionId);
    if (!turn) throw new NoPilotedTurn(sessionId);
    turn.process.interrupt();
  }

  /**
   * Profil retiré : les sessions en bac à sable qui tournaient sur son abonnement prennent l'abonnement par défaut
   * pour leurs prochains tours.
   */
  async replaceProfile(path: string): Promise<void> {
    const { effective } = await this.profiles.subscriptions();
    if (!effective || effective === path) return;
    for (const record of [...this.records.values()])
      if (record.sandbox?.profile === path)
        await this.keep({ ...record, sandbox: { ...record.sandbox, profile: effective } });
  }

  /** Branches de bac à sable qui ont du travail pas encore récupéré, que la réinitialisation perdrait. */
  unretrievedBranches(): string[] {
    const branches: string[] = [];
    for (const { sandbox } of this.records.values())
      if (sandbox && !sandbox.removedAt && unretrieved(sandbox)) branches.push(sandbox.branch);
    return branches;
  }

  /** Réinitialisation : les tours s'arrêtent, chaque bac à sable est supprimé (conteneur et copies). */
  async removeAllSandboxes(): Promise<void> {
    this.stopAll();
    const deps = this.sandbox;
    if (!deps) return;
    for (const record of this.records.values())
      if (record.sandbox && !record.sandbox.removedAt)
        await deps.sandboxes.remove(record.sessionId).catch(() => undefined);
    this.sandboxStates.clear();
    this.sandboxServices.clear();
  }

  /** Arrête tous les tours (arrêt de Bosco, remise à zéro des scénarios). */
  stopAll(): void {
    for (const turn of this.turns.values()) turn.process.finish();
    this.turns.clear();
    this.pending.clear();
  }

  /** Au-delà du seuil d'attente, aucun tour ne part : le message est refusé avec la raison. */
  private checkQuota(profile: string, sandboxed: boolean): void {
    const held = this.quota.holdReason(profile, sandboxed);
    if (held) throw new QuotaHeld(held);
  }

  private async checkQuotaOf(record: PilotRecord): Promise<void> {
    const profile = await this.profileOf(record);
    if (profile) this.checkQuota(profile, record.sandbox !== null);
  }

  /** Abonnement d'une session : celui choisi pour son bac à sable, sinon celui du profil de la session. */
  private async profileOf(record: PilotRecord): Promise<null | string> {
    if (record.sandbox) return record.sandbox.profile;
    const sources = await this.sources.list();
    return sources.find(({ id }) => id === record.sourceId)?.path ?? null;
  }

  private async recordOf(sessionId: string): Promise<PilotRecord> {
    const known = this.records.get(sessionId);
    if (known) return known;
    const session = await this.sessionRepository.find(sessionId);
    const snapshot = session?.toSnapshot();
    const cwd = snapshot?.projectPath ?? snapshot?.projectRoot;
    if (!snapshot || !cwd) throw new PilotTargetNotFound(`Bosco ne connaît pas la session ${sessionId}.`);
    return {
      cwd,
      projects: [],
      sandbox: null,
      sessionId,
      settings: DEFAULT_PILOT_SETTINGS,
      since: this.clock.now(),
      sourceId: snapshot.sourceId,
    };
  }

  /**
   * Contexte transmis à la session, fixé à son premier tour lancé par Bosco, sur le poste comme en bac à sable : une
   * session en bac à sable n'a pas le serveur MCP de Bosco pour le lire.
   */
  private async launchContext(record: PilotRecord): Promise<null | string> {
    if (record.context) return record.context;
    const context = await this.context.textOf(record.cwd, record.projects);
    if (context) await this.keep({ ...(this.records.get(record.sessionId) ?? record), context });
    return context;
  }

  /** Fichier du jeton longue durée d'un abonnement, déclaré dans ses réglages ; null : sa connexion. */
  private async tokenFileOf(profile: string): Promise<null | string> {
    const { choices, unavailable = [] } = await this.profiles.subscriptions();
    const chosen = choices.find(({ path }) => path === profile) ?? unavailable.find(({ path }) => path === profile);
    return chosen?.tokenFile ?? null;
  }

  /** Une session dont Claude Code a effacé le transcript ne se reprend plus : le refus le dit, sans lancer de tour. */
  private async checkResumable(record: PilotRecord): Promise<void> {
    const sources = await this.sources.list();
    const source = sources.find(({ id }) => id === record.sourceId);
    if (!source) return;
    const kept = await this.transcripts.exists(source.path, record.sessionId);
    if (!kept) throw new SessionErased(record.sessionId);
  }

  private async isLive(sessionId: string): Promise<boolean> {
    const session = await this.sessionRepository.find(sessionId);
    if (!session) return false;
    const { state } = this.sessions.viewOf(session);
    return state === 'running' || state === 'waiting';
  }

  private async keep(record: PilotRecord): Promise<void> {
    this.records.set(record.sessionId, record);
    await this.repository.save(record);
  }

  private async run(record: PilotRecord, message: PilotMessage, resume: boolean): Promise<void> {
    const sources = await this.sources.list();
    const source = sources.find(({ id }) => id === record.sourceId);
    if (!source) throw new PilotTargetNotFound(`Le profil de la session ${record.sessionId} n'est plus surveillé.`);
    const origin = { cwd: record.cwd, sessionId: record.sessionId, sourceId: record.sourceId };
    // Le conteneur du bac à sable démarre (ou se recrée) avant le tour ; ses hooks ne joignent pas Bosco : c'est le
    // flux du tour qui dit sa fin
    const profile = record.sandbox?.profile ?? source.path;
    const tokenFile = await this.tokenFileOf(profile);
    const env = tokenFile ? [TOKEN_VARIABLE] : [];
    const started =
      record.sandbox && this.sandbox
        ? await this.sandbox.sandboxes.ensure(record.sessionId, [record.cwd, ...record.projects], env)
        : null;
    const launch = started?.launch ?? null;
    if (record.sandbox) this.sandboxStates.set(record.sessionId, 'running');
    if (started) this.sandboxServices.set(record.sessionId, started.services);
    const liveTracking = source.liveTracking && !record.sandbox;
    // Le tour commence : la session apparaît (ou reprend) tout de suite, sans attendre les hooks ni le transcript
    await this.signals.receive(origin, { kind: 'prompt' }, 'pilot');
    const turn: Turn = {
      abandons: new Map(),
      asking: null,
      noting: Promise.resolve(),
      process: undefined as unknown as RunningTurn,
      result: false,
      startedAt: this.clock.now(),
      stopped: null,
    };
    const sandboxed = record.sandbox !== null;
    // En bac à sable, l'agent apprend où il travaille : sans Docker, avec les services de données du projet à côté
    const context =
      [await this.launchContext(record), started ? servicesNote(started.services) : null]
        .filter(Boolean)
        .join('\n\n') || null;
    const request: TurnRequest = {
      // Les autres projets sont rejoués à chaque tour : une reprise ne les garde pas d'elle-même
      addDirs: [...record.projects],
      // Le même texte à chaque tour : Claude Code garde le premier, et le reprend si la conversation est compactée
      appendSystemPrompt: context,
      configDir: source.path,
      cwd: record.cwd,
      launch,
      message,
      resume,
      tokenFile,
      sessionId: record.sessionId,
      settings: record.settings,
    };
    turn.process = this.runner.start(request, {
      permission: (requestId, tool, input) => this.permission(origin, turn, requestId, tool, input),
      // Le journal de la session garde la suspension, à son heure dans le fil, d'un démarrage de Bosco à l'autre
      suspended: (count, total) => {
        turn.noting = turn.noting
          .then(() => this.sessions.noteAutoModeSuspended(record.sessionId, count, total))
          .catch(() => undefined);
      },
      question: (requestId, input) => this.question(origin, turn, requestId, input),
      cancelled: (requestId) => turn.abandons.get(requestId)?.(),
      // L'abonnement d'un bac à sable est celui choisi au démarrage ; sinon celui du profil de la session. Au-delà du
      // seuil d'arrêt, le tour s'interrompt, comme avec « Arrêter »
      quota: (windows) => {
        this.quota.record(profile, windows);
        const stop = this.quota.stopReason(profile, sandboxed);
        if (!stop || turn.stopped) return;
        turn.stopped = stop;
        turn.process.interrupt();
      },
      result: (last) => {
        turn.result = true;
        // Sans suivi en direct, c'est Bosco qui signale la fin du tour ; avec, le hook Stop le fait déjà
        const message = turn.stopped ? `Tour arrêté : ${turn.stopped}` : last;
        if (!liveTracking || turn.stopped) void this.signals.receive(origin, { kind: 'stop', message }, 'pilot');
        turn.process.finish();
      },
      exited: (error) => void this.exited(origin, turn, error, liveTracking),
    });
    this.turns.set(record.sessionId, turn);
    await this.publish(record.sessionId);
  }

  private permission(
    origin: { cwd: string; sessionId: string; sourceId: string },
    turn: Turn,
    requestId: string,
    tool: string,
    input: Record<string, unknown>,
  ): void {
    // Passée à l'accès complet pendant le tour : si Claude Code demande encore, Bosco autorise sans te solliciter
    const mode = this.records.get(origin.sessionId)?.settings.permissionMode;
    if (mode === 'bypassPermissions') {
      turn.process.allow(requestId, input);
      return;
    }
    void turn.noting
      .then(() => {
        turn.asking = tool;
        return this.signals.requestPermission(
          origin,
          { tool, detail: detailOf(input) },
          (onAbandon) => turn.abandons.set(requestId, () => onAbandon('Tour arrêté')),
          'pilot',
        );
      })
      .then((answer: null | PermissionAnswer) => {
        turn.asking = null;
        turn.abandons.delete(requestId);
        if (answer?.behavior === 'allow') turn.process.allow(requestId, input);
        else if (answer) turn.process.deny(requestId, answer.reason ?? 'Refusé dans Bosco.');
        else turn.process.deny(requestId, 'Tour arrêté.');
      });
  }

  private question(
    origin: { cwd: string; sessionId: string; sourceId: string },
    turn: Turn,
    requestId: string,
    input: Record<string, unknown>,
  ): void {
    const questions: AgentQuestion[] = questionsOf(input);
    void this.signals
      .requestAnswers(origin, questions, (onAbandon) => turn.abandons.set(requestId, onAbandon))
      .then((answers) => {
        turn.abandons.delete(requestId);
        if (answers) turn.process.allow(requestId, { ...input, answers: answersOf(questions, answers) });
        else turn.process.deny(requestId, 'La personne a passé la question.');
      });
  }

  private async exited(
    origin: { cwd: string; sessionId: string; sourceId: string },
    turn: Turn,
    error: null | string,
    liveTracking: boolean,
  ): Promise<void> {
    if (this.turns.get(origin.sessionId) !== turn) return;
    this.turns.delete(origin.sessionId);
    for (const abandon of turn.abandons.values()) abandon();
    // Un agent arrêté sans résultat rend quand même la main, avec la raison
    if (!turn.result && (error || !liveTracking))
      await this.signals.receive(
        origin,
        { kind: 'stop', message: error ? `L'agent s'est arrêté : ${error}` : null },
        'pilot',
      );
    const next = this.pending.get(origin.sessionId);
    const record = this.records.get(origin.sessionId);
    if (next && record) {
      this.pending.delete(origin.sessionId);
      // Le message en attente ne part pas au-delà du seuil d'attente du quota : il est rendu avec la raison
      const profile = await this.profileOf(record);
      const held = profile ? this.quota.holdReason(profile, record.sandbox !== null) : null;
      if (!held) {
        await this.run(record, next, true);
        return;
      }
      await this.signals.receive(origin, { kind: 'stop', message: `Message non envoyé : ${held}` }, 'pilot');
    }
    await this.publish(origin.sessionId);
  }

  private async publish(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.find(sessionId);
    if (session) this.events.sessionChanged(this.sessions.viewOf(session));
  }
}
