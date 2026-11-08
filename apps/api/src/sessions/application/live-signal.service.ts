import type { NotificationService } from './notification.service.ts';
import type { Clock, IdGenerator, SessionEvents, SessionRepository } from './ports.ts';
import type { SessionService } from './session.service.ts';
import { DomainError } from '../../shared/domain/domain-error.ts';
import { ASKING, messageExcerpt } from '../domain/notification.ts';
import { type AgentQuestion, answersOf } from '../domain/pilot.ts';
import { Session } from '../domain/session.ts';

/** Signal du suivi en direct, traduit depuis un hook de Claude Code par l'interface (DT-05). */
export type LiveSignal =
  | { kind: 'end' }
  | { kind: 'prompt' }
  | { kind: 'start' }
  | { kind: 'stop'; message: null | string }
  | { kind: 'tool' };

export interface SignalOrigin {
  cwd: null | string;
  sessionId: string;
  sourceId: string;
}

/** Réponse donnée dans Bosco à une autorisation : valable pour cette seule commande (CA-SESS-35). */
export type PermissionAnswer = { behavior: 'allow' } | { behavior: 'deny'; reason: null | string };

interface PendingPermission {
  requestId: string;
  resolve: (answer: null | PermissionAnswer) => void;
}

interface PendingQuestion {
  questions: AgentQuestion[];
  requestId: string;
  resolve: (answers: null | string[][]) => void;
}

/** Tours pilotés par Bosco en cours : leurs autorisations passent par Bosco, pas par les hooks (DT-31). */
export interface PilotedTurns {
  isRunning(sessionId: string): boolean;
}

/** D'où vient un signal : un hook du suivi en direct, ou un tour piloté par Bosco */
type Via = 'hook' | 'pilot';

function titleOf(session: Session): string {
  return session.toSnapshot().title ?? `Session ${session.id.slice(0, 8)}`;
}

/** Dépôt de la session, d'après son dossier : il titre la notification du bureau */
function placeOf(session: Session): null | string {
  const { repoPath, repoRoot } = session.toSnapshot();
  const folder = repoRoot ?? repoPath;
  return folder ? (folder.split('/').findLast(Boolean) ?? null) : null;
}

/** L'outil par lequel l'agent pose une question à choix : Claude Code demande aussi son « autorisation » */
const QUESTION_TOOL = 'AskUserQuestion';

type Notifications = Pick<NotificationService, 'notify' | 'settle'>;

const SILENT: Notifications = { notify: () => Promise.resolve(null), settle: () => Promise.resolve() };

/** L'autorisation a déjà reçu sa réponse, ici ou dans le terminal : la première réponse l'emporte (RF-SESS-03). */
export class PermissionAlreadySettled extends DomainError {
  constructor(sessionId: string) {
    super('permissionAlreadySettled', `The permission of session ${sessionId} was already answered`);
  }
}

/**
 * Cas d'usage du suivi en direct : les signaux des hooks font vivre l'état des sessions en temps réel, et une
 * autorisation demandée attend la première réponse, de Bosco ou du terminal.
 */
export class LiveSignalService {
  private readonly lastSignals = new Map<string, Date>();
  private readonly pending = new Map<string, PendingPermission>();
  private readonly questions = new Map<string, PendingQuestion>();
  private pilots: PilotedTurns = { isRunning: () => false };
  /** Début du tour en cours de chaque session : ta dernière demande, pour savoir si un tour a été long (E15b) */
  private readonly turnStarts = new Map<string, Date>();

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly sessionService: Pick<SessionService, 'viewOf'>,
    private readonly sessionEvents: SessionEvents,
    private readonly clock: Clock,
    private readonly idGenerator: IdGenerator,
    /** Notifications (E15) : ce qui attend une réponse, ce qui est fini, selon les réglages */
    private readonly notifications: Notifications = SILENT,
  ) {}

  /** Tours pilotés par Bosco, branchés au démarrage (le service de pilotage dépend de celui-ci). */
  usePilots(pilots: PilotedTurns): void {
    this.pilots = pilots;
  }

  /** Dernier signal reçu d'un profil : la vérification de l'installation repose sur un vrai signal (CA-SESS-64). */
  lastSignalAt(sourceId: string): Date | null {
    return this.lastSignals.get(sourceId) ?? null;
  }

  async receive(origin: SignalOrigin, signal: LiveSignal, via: Via = 'hook'): Promise<void> {
    // Chaque tour piloté est un lancement de l'agent qui se ferme à la fin du tour : la session, elle, reste ouverte
    if (signal.kind === 'end' && this.pilots.isRunning(origin.sessionId)) return;
    const at = this.clock.now();
    const session = await this.sessionOf(origin, at, via);
    const subject = { place: placeOf(session), sessionId: session.id, taskId: null, title: titleOf(session) };
    if (signal.kind === 'stop') {
      session.endTurn(signal.message, at);
      await this.publish(session);
      const started = this.turnStarts.get(session.id);
      this.turnStarts.delete(session.id);
      const minutes = started ? Math.floor((at.getTime() - started.getTime()) / 60_000) : null;
      await this.notifications.notify(
        { kind: 'turn', message: signal.message, minutes },
        { ...subject, excerpt: messageExcerpt(signal.message), turnMinutes: minutes },
      );
      return;
    }
    if (signal.kind === 'end') session.end(at);
    else session.resume(at);
    // Ta demande ouvre un nouveau tour ; une demande ou une action de l'agent montre que l'attente a eu sa réponse
    if (signal.kind === 'prompt') this.turnStarts.set(session.id, at);
    await this.publish(session);
    if (signal.kind === 'end') {
      await this.notifications.notify(
        { kind: 'ended' },
        { ...subject, excerpt: messageExcerpt(session.toSnapshot().lastMessage) },
      );
      await this.notifications.settle({ sessionId: session.id, kinds: ASKING }, 'Session terminée');
    } else if (signal.kind === 'prompt' || signal.kind === 'tool')
      await this.notifications.settle({ sessionId: session.id, kinds: ASKING }, 'Répondu');
  }

  /**
   * Autorisation demandée : la session t'attend jusqu'à la première réponse. Résout la réponse donnée dans Bosco, ou
   * null quand Claude Code abandonne la demande (réponse dans le terminal, délai du hook écoulé).
   */
  async requestPermission(
    origin: SignalOrigin,
    action: { detail: null | string; tool: string },
    abandoned: (onAbandon: (note?: string) => void) => void,
    via: Via = 'hook',
  ): Promise<null | PermissionAnswer> {
    // Une question de l'agent passe aussi par ce hook : c'est une question (lue dans le transcript), pas une autorisation
    if (action.tool === QUESTION_TOOL) return null;
    // Pendant un tour piloté, Bosco reçoit la demande par le protocole de contrôle : le hook ne répond rien (DT-31)
    if (via === 'hook' && this.pilots.isRunning(origin.sessionId)) return null;
    const at = this.clock.now();
    const session = await this.sessionOf(origin, at, via);
    const requestId = this.idGenerator.next();
    // Une demande précédente encore ouverte pour la même session est caduque : Claude Code n'en pose qu'une à la fois
    this.pending.get(origin.sessionId)?.resolve(null);
    session.awaitPermission(requestId, action.tool, action.detail, at);
    await this.publish(session);
    await this.notifications.notify(
      { kind: 'permission' },
      {
        place: placeOf(session),
        sessionId: session.id,
        taskId: null,
        title: titleOf(session),
        excerpt: [action.tool, action.detail].filter(Boolean).join(' · '),
      },
    );
    return new Promise((resolve) => {
      this.pending.set(origin.sessionId, { requestId, resolve });
      abandoned((note) => void this.abandon(origin.sessionId, requestId, note));
    });
  }

  /**
   * Question à choix de l'agent d'une session pilotée (E2f) : la session t'attend jusqu'à ta réponse. Résout les
   * réponses (une liste de choix par question), ou null pour « Passer » et quand le tour s'arrête.
   */
  async requestAnswers(
    origin: SignalOrigin,
    questions: AgentQuestion[],
    abandoned: (onAbandon: () => void) => void,
  ): Promise<null | string[][]> {
    const at = this.clock.now();
    const session = await this.sessionOf(origin, at, 'pilot');
    const requestId = this.idGenerator.next();
    this.questions.get(origin.sessionId)?.resolve(null);
    session.awaitQuestion(requestId, questions, at);
    await this.publish(session);
    return new Promise((resolve) => {
      this.questions.set(origin.sessionId, { questions, requestId, resolve });
      abandoned(() => void this.answerQuestion(origin.sessionId, requestId, null).catch(() => undefined));
    });
  }

  /** Réponses données dans Bosco, ou null pour « Passer » ; refusées si la question n'attend plus (CA-SESS-96). */
  async answerQuestion(sessionId: string, requestId: string, answers: null | string[][]): Promise<void> {
    const entry = this.questions.get(sessionId);
    if (entry?.requestId !== requestId) throw new PermissionAlreadySettled(sessionId);
    // Une réponse incomplète est refusée avant de libérer la question
    if (answers) answersOf(entry.questions, answers);
    this.questions.delete(sessionId);
    const session = await this.sessionRepository.find(sessionId);
    if (session?.settleQuestion(requestId, this.clock.now())) await this.publish(session);
    entry.resolve(answers);
    await this.notifications.settle({ sessionId, kinds: ['question'] }, answers ? 'Répondu dans Bosco' : 'Passée');
  }

  /** Réponse donnée dans Bosco ; refusée si le terminal a répondu le premier. */
  async answerPermission(sessionId: string, requestId: string, answer: PermissionAnswer): Promise<void> {
    const entry = this.pending.get(sessionId);
    const session = await this.sessionRepository.find(sessionId);
    if (entry?.requestId !== requestId || !session?.settlePermission(requestId, this.clock.now()))
      throw new PermissionAlreadySettled(sessionId);
    this.pending.delete(sessionId);
    await this.publish(session);
    this.sessionEvents.permissionSettled({
      sessionId,
      title: session.toSnapshot().title,
      outcome: answer.behavior === 'allow' ? 'allowed' : 'denied',
    });
    entry.resolve(answer);
    await this.notifications.settle(
      { sessionId, kinds: ['permission'] },
      answer.behavior === 'allow' ? 'Autorisé dans Bosco' : 'Refusé dans Bosco',
    );
  }

  /** Oublie les demandes en cours et les derniers signaux (remise à zéro des scénarios). */
  forget(): void {
    for (const entry of this.pending.values()) entry.resolve(null);
    this.pending.clear();
    for (const entry of this.questions.values()) entry.resolve(null);
    this.questions.clear();
    this.lastSignals.clear();
    this.turnStarts.clear();
  }

  /** Au démarrage : une autorisation restée en attente lors de l'arrêt ne peut plus se donner que dans le terminal. */
  async dropStalePermissions(): Promise<void> {
    for (const session of await this.sessionRepository.list()) {
      if (session.dropStalePermission()) await this.sessionRepository.save(session, []);
    }
  }

  private async abandon(sessionId: string, requestId: string, note = 'Répondu dans le terminal'): Promise<void> {
    const entry = this.pending.get(sessionId);
    if (entry?.requestId !== requestId) return;
    this.pending.delete(sessionId);
    entry.resolve(null);
    const session = await this.sessionRepository.find(sessionId);
    if (!session?.settlePermission(requestId, this.clock.now())) return;
    await this.publish(session);
    this.sessionEvents.permissionSettled({ sessionId, title: session.toSnapshot().title, outcome: 'elsewhere' });
    await this.notifications.settle({ sessionId, kinds: ['permission'] }, note);
  }

  private async sessionOf(origin: SignalOrigin, at: Date, via: Via = 'hook'): Promise<Session> {
    // Seul un vrai hook prouve que le suivi en direct est installé (CA-SESS-64)
    if (via === 'hook') this.lastSignals.set(origin.sourceId, at);
    const session =
      (await this.sessionRepository.find(origin.sessionId)) ?? Session.discover(origin.sessionId, origin.sourceId, at);
    session.placeIn(origin.cwd);
    return session;
  }

  private async publish(session: Session): Promise<void> {
    await this.sessionRepository.save(session, session.pullJournal());
    this.sessionEvents.sessionChanged(this.sessionService.viewOf(session));
  }
}
