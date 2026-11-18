import type { QuotaWindows } from '../../shared/domain/subscription-quota.ts';
import type { ChannelService } from './channel.service.ts';
import type { LiveSignalService, PermissionAnswer } from './live-signal.service.ts';
import type {
  Clock,
  IdGenerator,
  SessionEvents,
  SessionRegistry,
  SessionRepository,
  SourceRepository,
} from './ports.ts';
import type { SessionService } from './session.service.ts';
import {
  type AgentQuestion,
  answersOf,
  checkPilotMessage,
  DEFAULT_PILOT_SETTINGS,
  InvalidPilotMessage,
  joinMessages,
  NoPilotedTurn,
  type PilotMessage,
  type PilotSettings,
  PilotTargetNotFound,
  questionsOf,
  QuotaHeld,
  SessionOpenInTerminal,
} from '../domain/pilot.ts';
import {
  checkSandboxBranch,
  housekeepingOf,
  sandboxBranchOf,
  SandboxError,
  type SandboxInfo,
  stopsAt,
} from '../domain/sandbox.ts';

/** Un tour à lancer : `claude -p` dans le dossier du projet, avec le profil, une session nouvelle ou reprise (DT-31). */
export interface TurnRequest {
  /** Dossier de configuration du profil Claude Code */
  configDir: string;
  cwd: string;
  message: PilotMessage;
  /** Commande d'un tour en bac à sable (DT-37) : l'agent tourne dans le conteneur de la session ; null : sur le poste */
  launch: null | TurnLaunch;
  /** false : une nouvelle session, créée avec cet identifiant */
  resume: boolean;
  sessionId: string;
  settings: PilotSettings;
}

/** Exécution d'un tour ailleurs que sur le poste : le programme et ses premiers arguments, avant ceux du tour. */
export interface TurnLaunch {
  args: string[];
  file: string;
}

/** État du conteneur d'un bac à sable. */
export type SandboxState = 'missing' | 'running' | 'stopped';

/**
 * Bacs à sable des sessions (règle 12, DT-37) : copie du projet sur la branche de la session et dossier personnel de
 * l'agent, gardés hors du conteneur ; conteneur isolé comme un agent du worker.
 */
export interface Sandboxes {
  /** Profil où les conversations des bacs à sable sont gardées, rangées avec leur projet : une source surveillée */
  readonly profile: string;
  currentBranch(projectRoot: string): Promise<null | string>;
  /** Démarre le conteneur, le crée s'il manque ; la commande d'un tour, null : sur le poste (scénarios) */
  ensure(sessionId: string, projectRoot: string): Promise<null | TurnLaunch>;
  prepare(input: {
    branch: string;
    profile: string;
    projectRoot: string;
    sessionId: string;
    startBranch: null | string;
  }): Promise<{ base: string; from: string }>;
  refusals(sessionId: string): Promise<{ at: Date; host: string }[]>;
  remove(sessionId: string): Promise<void>;
  /** Enregistre le travail en cours dans la branche, puis la rapatrie dans le projet ; la branche reçue */
  retrieve(input: { branch: string; projectRoot: string; sessionId: string }): Promise<string>;
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
  question(requestId: string, input: Record<string, unknown>): void;
  /** Usage de l'abonnement, donné à chaque tour (DT-39) */
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
  /** Processus de l'agent sur le poste, pour mesurer ce qu'il consomme (E19a) ; null s'il n'a pas démarré */
  pid: null | number;
}

export interface TurnRunner {
  start(request: TurnRequest, listener: TurnListener): RunningTurn;
}

/** Une session pilotée par Bosco : où elle tourne et ses réglages, gardés d'un tour à l'autre. */
export interface PilotRecord {
  cwd: string;
  /** Bac à sable de la session (règle 12) ; null : elle tourne sur le poste */
  sandbox: null | SandboxInfo;
  sessionId: string;
  settings: PilotSettings;
  since: Date;
  sourceId: string;
}

export interface PilotRepository {
  list(): Promise<PilotRecord[]>;
  save(record: PilotRecord): Promise<void>;
}

/** Abonnements Claude (E11) : les profils qui ont un accès, et celui par défaut. */
export interface PilotProfiles {
  subscriptions(): Promise<{
    choices: { account: null | string; label: string; path: string }[];
    effective: null | string;
  }>;
}

/** Quota de l'abonnement (DT-39) : l'usage lu à chaque tour, et les seuils qui retiennent puis arrêtent un tour. */
export interface PilotQuota {
  /** Pourquoi un tour de cet abonnement ne part pas ; null s'il peut partir */
  holdReason(profile: string, sandboxed: boolean): null | string;
  record(profile: string, windows: QuotaWindows): void;
  /** Pourquoi le tour en cours s'arrête ; null s'il peut continuer */
  stopReason(profile: string, sandboxed: boolean): null | string;
}

/** Ce que l'interface voit d'une session pilotée (E2e). */
export interface PilotView {
  pending: null | { images: number; text: string };
  running: boolean;
  sandbox: null | {
    branch: string;
    from: string;
    removed: boolean;
    retrievedAt: Date | null;
    state: SandboxState;
    stopsAt: Date;
  };
  settings: PilotSettings;
  since: Date;
}

interface Turn {
  /** Demandes en cours (autorisation, question) et ce qui les abandonne si le tour s'arrête */
  abandons: Map<string, () => void>;
  process: RunningTurn;
  result: boolean;
  startedAt: Date;
  /** Arrêté par le quota de l'abonnement : la raison, dite à la fin du tour */
  stopped: null | string;
}

type Signals = Pick<LiveSignalService, 'receive' | 'requestAnswers' | 'requestPermission'>;

const NO_PROFILES: PilotProfiles = { subscriptions: () => Promise.resolve({ choices: [], effective: null }) };

const NO_QUOTA: PilotQuota = { holdReason: () => null, record: () => undefined, stopReason: () => null };

/** Ce que le bac à sable demande en plus au démarrage : la source de ses conversations, et la notification de la veille. */
interface SandboxDeps {
  ensureSource: (path: string) => Promise<{ id: string }>;
  sandboxes: Sandboxes;
  /** La branche a du travail non récupéré : le bac à sable sera supprimé demain (CA-SESS-115) */
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
 * Sessions pilotées par Bosco (E2e à E2h, E16a, règle 4, DT-31) : démarrer une session, lui écrire, mettre un message
 * en attente pendant un tour, arrêter un tour, répondre à ses autorisations et à ses questions depuis Bosco.
 */
export class PilotService {
  private readonly records = new Map<string, PilotRecord>();
  private readonly turns = new Map<string, Turn>();
  private readonly pending = new Map<string, PilotMessage>();
  private profiles: PilotProfiles = NO_PROFILES;
  private sandbox: null | SandboxDeps = null;
  /** Usage de l'abonnement lu dans le flux d'un tour, rangé par profil Claude, et ses seuils (DT-39) */
  private quota: PilotQuota = NO_QUOTA;
  /** État de chaque conteneur, relu par l'entretien : la vue de la session le montre sans attendre Docker */
  private readonly sandboxStates = new Map<string, SandboxState>();
  private channel: Pick<ChannelService, 'isConnected' | 'send'> = { isConnected: () => false, send: () => false };

  constructor(
    private readonly repository: PilotRepository,
    private readonly runner: TurnRunner,
    private readonly signals: Signals,
    private readonly sessions: Pick<SessionService, 'knownProjects' | 'viewOf'>,
    private readonly sessionRepository: Pick<SessionRepository, 'find'>,
    private readonly sources: Pick<SourceRepository, 'list'>,
    private readonly registry: Pick<SessionRegistry, 'isOpen'>,
    private readonly events: Pick<SessionEvents, 'sessionChanged'>,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  /** Sessions pilotées connues, lues au démarrage (et après une remise à zéro des scénarios). */
  async load(): Promise<void> {
    this.records.clear();
    for (const record of await this.repository.list()) this.records.set(record.sessionId, record);
  }

  /** Quota de l'abonnement, branché au démarrage : chaque tour piloté le tient à jour, ses seuils le retiennent (DT-39). */
  useQuota(quota: PilotQuota): void {
    this.quota = quota;
  }

  /** Bacs à sable des sessions (DT-37), branchés au démarrage. */
  useSandboxes(deps: SandboxDeps): void {
    this.sandbox = deps;
  }

  /** Abonnements Claude et celui par défaut (E11), branchés au démarrage. */
  useProfiles(profiles: PilotProfiles): void {
    this.profiles = profiles;
  }

  isRunning(sessionId: string): boolean {
    return this.turns.has(sessionId);
  }

  /** Sessions dont le bac à sable existe encore : le panneau des conteneurs les nomme (E19a). */
  sandboxedSessions(): string[] {
    return [...this.records.values()]
      .filter(({ sandbox }) => sandbox !== null && sandbox.removedAt === null)
      .map(({ sessionId }) => sessionId);
  }

  /** Tours en cours, avec le processus de leur agent : le panneau des conteneurs les mesure (E19a). */
  runningTurns(): { pid: null | number; sessionId: string; since: Date }[] {
    return [...this.turns].map(([sessionId, turn]) => ({ pid: turn.process.pid, sessionId, since: turn.startedAt }));
  }

  pilotOf(sessionId: string): null | PilotView {
    const record = this.records.get(sessionId);
    if (!record) return null;
    const pending = this.pending.get(sessionId);
    const { sandbox } = record;
    return {
      pending: pending ? { images: pending.images.length, text: pending.text } : null,
      running: this.turns.has(sessionId),
      sandbox: sandbox && {
        branch: sandbox.branch,
        from: sandbox.from,
        removed: sandbox.removedAt !== null,
        retrievedAt: sandbox.retrievedAt,
        state: sandbox.removedAt ? 'missing' : (this.sandboxStates.get(sessionId) ?? 'stopped'),
        stopsAt: stopsAt(sandbox),
      },
      settings: record.settings,
      since: record.since,
    };
  }

  /** Ouverte dans un terminal : le registre de Claude Code la dit ouverte, sans tour piloté en cours (CA-SESS-98). */
  openInTerminal(sourceId: string, sessionId: string): boolean {
    if (this.records.get(sessionId)?.sandbox) return false;
    return !this.turns.has(sessionId) && this.registry.isOpen(sourceId, sessionId) === true;
  }

  /** Formulaire d'une nouvelle session (E16a) : projets connus, abonnements et celui par défaut. */
  async options(): Promise<{
    profiles: { account: null | string; label: string; path: string }[];
    projects: { branch: null | string; defaultProfile: null | string; name: string; root: string }[];
    sandboxUnavailable: null | string;
  }> {
    const sources = await this.sources.list();
    const watched = new Set(sources.filter((source) => source.watched).map(({ path }) => path));
    const known = await this.sessions.knownProjects();
    const { choices, effective } = await this.profiles.subscriptions();
    const profiles = choices.filter(({ path }) => watched.has(path));
    const defaultProfile = effective && watched.has(effective) ? effective : null;
    const projects = [];
    for (const { name, root } of known) {
      const branch = this.sandbox ? await this.sandbox.sandboxes.currentBranch(root).catch(() => null) : null;
      projects.push({ branch, defaultProfile, name, root });
    }
    const sandboxUnavailable = this.sandbox
      ? await this.sandbox.sandboxes.unavailable()
      : 'Bac à sable indisponible sur ce poste';
    return { profiles, projects, sandboxUnavailable };
  }

  /** « Démarrer la session » (CA-SESS-91) : une nouvelle session dans le dossier du projet, avec le profil choisi. */
  async start(input: {
    message: PilotMessage;
    profile: null | string;
    project: string;
    /** Dans un bac à sable (E16b) : branche de départ et branche de la session, null : proposées */
    sandbox?: null | { branch: null | string; startBranch: null | string };
    settings: PilotSettings;
  }): Promise<string> {
    const message = checkPilotMessage(input.message);
    const known = await this.sessions.knownProjects();
    const project = known.find(({ root }) => root === input.project);
    if (!project) throw new PilotTargetNotFound(`Bosco ne connaît pas le projet ${input.project}.`);
    const accounts = await this.profiles.subscriptions();
    const profile = input.profile ?? accounts.effective;
    const sources = await this.sources.list();
    const source = sources.find(({ path, watched }) => watched && path === profile);
    if (!source)
      throw new PilotTargetNotFound('Choisis un abonnement Claude parmi les profils surveillés par Bosco (Sources).');
    this.checkQuota(source.path, Boolean(input.sandbox));
    const sessionId = this.ids.next();
    const record: PilotRecord = input.sandbox
      ? await this.sandboxed(sessionId, project.root, source.path, message, input.sandbox)
      : {
          cwd: project.root,
          sandbox: null,
          sessionId,
          settings: input.settings,
          since: this.clock.now(),
          sourceId: source.id,
        };
    record.settings = input.settings;
    await this.keep(record);
    await this.run(record, message, false);
    return record.sessionId;
  }

  /**
   * Prépare le bac à sable d'une nouvelle session (CA-SESS-106) : la copie du projet sur sa branche, l'accès à
   * l'abonnement du profil choisi ; ses conversations rejoignent le profil des bacs à sable, une source surveillée.
   */
  private async sandboxed(
    sessionId: string,
    root: string,
    profile: string,
    message: PilotMessage,
    choice: { branch: null | string; startBranch: null | string },
  ): Promise<PilotRecord> {
    const deps = this.sandbox;
    const unavailable = deps ? await deps.sandboxes.unavailable() : 'Bac à sable indisponible sur ce poste';
    if (!deps || unavailable) throw new SandboxError('sandboxUnavailable', unavailable ?? 'Bac à sable indisponible');
    const branch = checkSandboxBranch(choice.branch ?? sandboxBranchOf(message.text));
    const source = await deps.ensureSource(deps.sandboxes.profile);
    const startBranch = choice.startBranch?.trim() || (await deps.sandboxes.currentBranch(root));
    const { base, from } = await deps.sandboxes.prepare({
      branch,
      profile,
      projectRoot: root,
      sessionId,
      startBranch,
    });
    const now = this.clock.now();
    return {
      cwd: root,
      sandbox: { base, branch, from, lastMessageAt: now, profile, removedAt: null, retrievedAt: null, warnedAt: null },
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

  /** « Récupérer la branche » (CA-SESS-112) : le travail rejoint le dépôt du poste, sans toucher à sa branche courante. */
  async retrieve(sessionId: string): Promise<string> {
    const { deps, record, sandbox } = this.idleSandbox(sessionId);
    const branch = await deps.sandboxes.retrieve({ branch: sandbox.branch, projectRoot: record.cwd, sessionId });
    await this.keep({ ...record, sandbox: { ...sandbox, retrievedAt: this.clock.now() } });
    await this.publish(sessionId);
    return branch;
  }

  /** « Arrêter le bac à sable » : le conteneur s'arrête, la copie reste ; le message suivant le relance. */
  async stopSandbox(sessionId: string): Promise<void> {
    const { deps } = this.idleSandbox(sessionId);
    await deps.sandboxes.stop(sessionId);
    this.sandboxStates.set(sessionId, 'stopped');
    await this.publish(sessionId);
  }

  /** « Supprimer le bac à sable » (CA-SESS-114) : conteneur et copie effacés ; la session reste lisible. */
  async removeSandbox(sessionId: string): Promise<void> {
    const { deps, record, sandbox } = this.idleSandbox(sessionId);
    await deps.sandboxes.remove(sessionId);
    this.sandboxStates.set(sessionId, 'missing');
    await this.keep({ ...record, sandbox: { ...sandbox, removedAt: this.clock.now() } });
    await this.publish(sessionId);
  }

  /** Sorties réseau refusées du bac à sable, lues à la demande (CA-SESS-108). */
  async refusals(sessionId: string): Promise<{ at: Date; host: string }[]> {
    const record = this.records.get(sessionId);
    if (!record?.sandbox || !this.sandbox) return [];
    return this.sandbox.sandboxes.refusals(sessionId);
  }

  /**
   * Entretien des bacs à sable (règle 12) : l'état de chaque conteneur est relu ; un conteneur sans message depuis
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
        const unretrieved = !sandbox.retrievedAt || sandbox.retrievedAt < sandbox.lastMessageAt;
        if (unretrieved) await deps.warn(sessionId, sandbox.branch).catch(() => undefined);
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
   * Un message à une session (CA-SESS-92, CA-SESS-93, CA-SESS-97) : il lance un tour, ou attend la fin du tour en cours.
   * Une session close, du terminal ou de Bosco, reprend dans Bosco et devient pilotée. Une session ouverte dans un
   * terminal le reçoit par le canal de Bosco, si elle a été lancée avec lui (CA-SESS-101).
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
    await this.checkQuotaOf(record);
    // Un message repousse l'arrêt et la suppression du bac à sable (règle 12)
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

  /** Le canal de la session est ouvert : l'étiquette « Canal de Bosco » et la zone réduite (E2i). */
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

  /** « Annuler » le message en attente (CA-SESS-93). */
  async cancelPending(sessionId: string): Promise<void> {
    if (!this.pending.delete(sessionId)) throw new NoPilotedTurn(sessionId);
    await this.publish(sessionId);
  }

  /** « Arrêter » (CA-SESS-93) : le tour s'interrompt, le message en attente reste. */
  interrupt(sessionId: string): void {
    const turn = this.turns.get(sessionId);
    if (!turn) throw new NoPilotedTurn(sessionId);
    turn.process.interrupt();
  }

  /** Arrête tous les tours (arrêt de Bosco, remise à zéro des scénarios). */
  stopAll(): void {
    for (const turn of this.turns.values()) turn.process.finish();
    this.turns.clear();
    this.pending.clear();
  }

  /** Au-delà du seuil d'attente, aucun tour ne part : le message est refusé avec la raison (DT-39). */
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
      sandbox: null,
      sessionId,
      settings: DEFAULT_PILOT_SETTINGS,
      since: this.clock.now(),
      sourceId: snapshot.sourceId,
    };
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
    // flux du tour qui dit sa fin (CA-SESS-109, CA-SESS-111)
    const launch =
      record.sandbox && this.sandbox ? await this.sandbox.sandboxes.ensure(record.sessionId, record.cwd) : null;
    if (record.sandbox) this.sandboxStates.set(record.sessionId, 'running');
    const liveTracking = source.liveTracking && !record.sandbox;
    // Le tour commence : la session apparaît (ou reprend) tout de suite, sans attendre les hooks ni le transcript
    await this.signals.receive(origin, { kind: 'prompt' }, 'pilot');
    const turn: Turn = {
      abandons: new Map(),
      process: undefined as unknown as RunningTurn,
      result: false,
      startedAt: this.clock.now(),
      stopped: null,
    };
    const profile = record.sandbox?.profile ?? source.path;
    const sandboxed = record.sandbox !== null;
    const request: TurnRequest = {
      configDir: source.path,
      cwd: record.cwd,
      launch,
      message,
      resume,
      sessionId: record.sessionId,
      settings: record.settings,
    };
    turn.process = this.runner.start(request, {
      permission: (requestId, tool, input) => this.permission(origin, turn, requestId, tool, input),
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
    void this.signals
      .requestPermission(
        origin,
        { tool, detail: detailOf(input) },
        (onAbandon) => turn.abandons.set(requestId, () => onAbandon('Tour arrêté')),
        'pilot',
      )
      .then((answer: null | PermissionAnswer) => {
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
