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
  SessionOpenInTerminal,
} from '../domain/pilot.ts';

/** Un tour à lancer : `claude -p` dans le dossier du dépôt, avec le profil, une session nouvelle ou reprise (DT-31). */
export interface TurnRequest {
  /** Dossier de configuration du profil Claude Code */
  configDir: string;
  cwd: string;
  message: PilotMessage;
  /** false : une nouvelle session, créée avec cet identifiant */
  resume: boolean;
  sessionId: string;
  settings: PilotSettings;
}

/** Ce que l'agent d'un tour demande ou signale, par le protocole de contrôle. */
export interface TurnListener {
  /** L'agent a abandonné une demande (après une interruption) */
  cancelled(requestId: string): void;
  /** Le processus est sorti ; error : il s'est arrêté sans rendre de résultat */
  exited(error: null | string): void;
  permission(requestId: string, tool: string, input: Record<string, unknown>): void;
  question(requestId: string, input: Record<string, unknown>): void;
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
  sessionId: string;
  settings: PilotSettings;
  since: Date;
  sourceId: string;
}

export interface PilotRepository {
  list(): Promise<PilotRecord[]>;
  save(record: PilotRecord): Promise<void>;
}

/** Abonnements Claude d'un dépôt (E8a) : les profils qui ont un accès, et celui du dépôt (ou le général). */
export interface PilotProfiles {
  of(
    repository: string,
  ): Promise<{ choices: { account: null | string; label: string; path: string }[]; effective: null | string }>;
}

/** Ce que l'interface voit d'une session pilotée (E2e). */
export interface PilotView {
  pending: null | { images: number; text: string };
  running: boolean;
  settings: PilotSettings;
  since: Date;
}

interface Turn {
  /** Demandes en cours (autorisation, question) et ce qui les abandonne si le tour s'arrête */
  abandons: Map<string, () => void>;
  process: RunningTurn;
  result: boolean;
  startedAt: Date;
}

type Signals = Pick<LiveSignalService, 'receive' | 'requestAnswers' | 'requestPermission'>;

const NO_PROFILES: PilotProfiles = { of: () => Promise.resolve({ choices: [], effective: null }) };

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
  private channel: Pick<ChannelService, 'isConnected' | 'send'> = { isConnected: () => false, send: () => false };

  constructor(
    private readonly repository: PilotRepository,
    private readonly runner: TurnRunner,
    private readonly signals: Signals,
    private readonly sessions: Pick<SessionService, 'knownRepositories' | 'viewOf'>,
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

  /** Abonnements par dépôt, tenus par les droits des agents (E8a), branchés au démarrage. */
  useProfiles(profiles: PilotProfiles): void {
    this.profiles = profiles;
  }

  isRunning(sessionId: string): boolean {
    return this.turns.has(sessionId);
  }

  /** Tours en cours, avec le processus de leur agent : le panneau des conteneurs les mesure (E19a). */
  runningTurns(): { pid: null | number; sessionId: string; since: Date }[] {
    return [...this.turns].map(([sessionId, turn]) => ({ pid: turn.process.pid, sessionId, since: turn.startedAt }));
  }

  pilotOf(sessionId: string): null | PilotView {
    const record = this.records.get(sessionId);
    if (!record) return null;
    const pending = this.pending.get(sessionId);
    return {
      pending: pending ? { images: pending.images.length, text: pending.text } : null,
      running: this.turns.has(sessionId),
      settings: record.settings,
      since: record.since,
    };
  }

  /** Ouverte dans un terminal : le registre de Claude Code la dit ouverte, sans tour piloté en cours (CA-SESS-98). */
  openInTerminal(sourceId: string, sessionId: string): boolean {
    return !this.turns.has(sessionId) && this.registry.isOpen(sourceId, sessionId) === true;
  }

  /** Formulaire d'une nouvelle session (E16a) : dépôts connus, abonnements et celui de chaque dépôt. */
  async options(): Promise<{
    profiles: { account: null | string; label: string; path: string }[];
    repositories: { defaultProfile: null | string; name: string; root: string }[];
  }> {
    const sources = await this.sources.list();
    const watched = new Set(sources.filter((source) => source.watched).map(({ path }) => path));
    const known = await this.sessions.knownRepositories();
    let profiles: { account: null | string; label: string; path: string }[] = [];
    const repositories = [];
    for (const { name, root } of known) {
      const { choices, effective } = await this.profiles.of(name);
      profiles = choices.filter(({ path }) => watched.has(path));
      repositories.push({ defaultProfile: effective && watched.has(effective) ? effective : null, name, root });
    }
    if (known.length === 0) {
      const general = await this.profiles.of('');
      profiles = general.choices.filter(({ path }) => watched.has(path));
    }
    return { profiles, repositories };
  }

  /** « Démarrer la session » (CA-SESS-91) : une nouvelle session dans le dossier du dépôt, avec le profil choisi. */
  async start(input: {
    message: PilotMessage;
    profile: null | string;
    repository: string;
    settings: PilotSettings;
  }): Promise<string> {
    const message = checkPilotMessage(input.message);
    const known = await this.sessions.knownRepositories();
    const repository = known.find(({ root }) => root === input.repository);
    if (!repository) throw new PilotTargetNotFound(`Bosco ne connaît pas le dépôt ${input.repository}.`);
    const accounts = await this.profiles.of(repository.name);
    const profile = input.profile ?? accounts.effective;
    const sources = await this.sources.list();
    const source = sources.find(({ path, watched }) => watched && path === profile);
    if (!source)
      throw new PilotTargetNotFound('Choisis un abonnement Claude parmi les profils surveillés par Bosco (Sources).');
    const record: PilotRecord = {
      cwd: repository.root,
      sessionId: this.ids.next(),
      settings: input.settings,
      since: this.clock.now(),
      sourceId: source.id,
    };
    await this.keep(record);
    await this.run(record, message, false);
    return record.sessionId;
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
    // Sans registre des sessions ouvertes, une session du terminal qui tourne ou attend y est encore ouverte
    const inTerminal =
      this.openInTerminal(record.sourceId, sessionId) ||
      (!this.records.has(sessionId) && (await this.isLive(sessionId)));
    if (inTerminal) return this.throughChannel(sessionId, message);
    await this.keep({ ...record, settings: input.settings });
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

  private async recordOf(sessionId: string): Promise<PilotRecord> {
    const known = this.records.get(sessionId);
    if (known) return known;
    const session = await this.sessionRepository.find(sessionId);
    const snapshot = session?.toSnapshot();
    const cwd = snapshot?.repoPath ?? snapshot?.repoRoot;
    if (!snapshot || !cwd) throw new PilotTargetNotFound(`Bosco ne connaît pas la session ${sessionId}.`);
    return { cwd, sessionId, settings: DEFAULT_PILOT_SETTINGS, since: this.clock.now(), sourceId: snapshot.sourceId };
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
    // Le tour commence : la session apparaît (ou reprend) tout de suite, sans attendre les hooks ni le transcript
    await this.signals.receive(origin, { kind: 'prompt' }, 'pilot');
    const turn: Turn = {
      abandons: new Map(),
      process: undefined as unknown as RunningTurn,
      result: false,
      startedAt: this.clock.now(),
    };
    const request: TurnRequest = {
      configDir: source.path,
      cwd: record.cwd,
      message,
      resume,
      sessionId: record.sessionId,
      settings: record.settings,
    };
    turn.process = this.runner.start(request, {
      permission: (requestId, tool, input) => this.permission(origin, turn, requestId, tool, input),
      question: (requestId, input) => this.question(origin, turn, requestId, input),
      cancelled: (requestId) => turn.abandons.get(requestId)?.(),
      result: (last) => {
        turn.result = true;
        // Sans suivi en direct, c'est Bosco qui signale la fin du tour ; avec, le hook Stop le fait déjà
        if (!source.liveTracking) void this.signals.receive(origin, { kind: 'stop', message: last }, 'pilot');
        turn.process.finish();
      },
      exited: (error) => void this.exited(origin, turn, error, source.liveTracking),
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
      await this.run(record, next, true);
      return;
    }
    await this.publish(origin.sessionId);
  }

  private async publish(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.find(sessionId);
    if (session) this.events.sessionChanged(this.sessions.viewOf(session));
  }
}
