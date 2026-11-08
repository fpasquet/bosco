import type { NotificationService } from './notification.service.ts';
import type { Clock, IdGenerator, SessionEvents, SessionRepository } from './ports.ts';
import type { SessionService } from './session.service.ts';
import { DomainError } from '../../shared/domain/domain-error.ts';
import { ASKING } from '../domain/notification.ts';
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

function titleOf(session: Session): string {
  return session.toSnapshot().title ?? `Session ${session.id.slice(0, 8)}`;
}

const EXCERPT = 180;

/** Fin d'un message, là où l'agent conclut ou pose sa question : sa dernière partie, sur une ligne. */
function excerptOf(message: null | string): null | string {
  if (!message) return null;
  const line = message.replaceAll(/\s+/g, ' ').trim();
  return line.length > EXCERPT ? `…${line.slice(-EXCERPT + 1).trimStart()}` : line;
}

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

  /** Dernier signal reçu d'un profil : la vérification de l'installation repose sur un vrai signal (CA-SESS-64). */
  lastSignalAt(sourceId: string): Date | null {
    return this.lastSignals.get(sourceId) ?? null;
  }

  async receive(origin: SignalOrigin, signal: LiveSignal): Promise<void> {
    const at = this.clock.now();
    const session = await this.sessionOf(origin, at);
    const subject = { sessionId: session.id, taskId: null, title: titleOf(session) };
    if (signal.kind === 'stop') {
      session.endTurn(signal.message, at);
      await this.publish(session);
      const started = this.turnStarts.get(session.id);
      this.turnStarts.delete(session.id);
      const minutes = started ? Math.floor((at.getTime() - started.getTime()) / 60_000) : null;
      await this.notifications.notify(
        { kind: 'turn', message: signal.message, minutes },
        { ...subject, excerpt: excerptOf(signal.message), turnMinutes: minutes },
      );
      return;
    }
    if (signal.kind === 'end') session.end(at);
    else session.resume(at);
    // Ta demande ouvre un nouveau tour ; une demande ou une action de l'agent montre que l'attente a eu sa réponse
    if (signal.kind === 'prompt') this.turnStarts.set(session.id, at);
    await this.publish(session);
    if (signal.kind === 'end') {
      await this.notifications.notify({ kind: 'ended' }, { ...subject, excerpt: session.toSnapshot().lastMessage });
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
    abandoned: (onAbandon: () => void) => void,
  ): Promise<null | PermissionAnswer> {
    const at = this.clock.now();
    const session = await this.sessionOf(origin, at);
    const requestId = this.idGenerator.next();
    // Une demande précédente encore ouverte pour la même session est caduque : Claude Code n'en pose qu'une à la fois
    this.pending.get(origin.sessionId)?.resolve(null);
    session.awaitPermission(requestId, action.tool, action.detail, at);
    await this.publish(session);
    await this.notifications.notify(
      { kind: 'permission' },
      {
        sessionId: session.id,
        taskId: null,
        title: titleOf(session),
        excerpt: [action.tool, action.detail].filter(Boolean).join(' · '),
      },
    );
    return new Promise((resolve) => {
      this.pending.set(origin.sessionId, { requestId, resolve });
      abandoned(() => void this.abandon(origin.sessionId, requestId));
    });
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
    this.lastSignals.clear();
    this.turnStarts.clear();
  }

  /** Au démarrage : une autorisation restée en attente lors de l'arrêt ne peut plus se donner que dans le terminal. */
  async dropStalePermissions(): Promise<void> {
    for (const session of await this.sessionRepository.list()) {
      if (session.dropStalePermission()) await this.sessionRepository.save(session, []);
    }
  }

  private async abandon(sessionId: string, requestId: string): Promise<void> {
    const entry = this.pending.get(sessionId);
    if (entry?.requestId !== requestId) return;
    this.pending.delete(sessionId);
    entry.resolve(null);
    const session = await this.sessionRepository.find(sessionId);
    if (!session?.settlePermission(requestId, this.clock.now())) return;
    await this.publish(session);
    this.sessionEvents.permissionSettled({ sessionId, title: session.toSnapshot().title, outcome: 'elsewhere' });
    await this.notifications.settle({ sessionId, kinds: ['permission'] }, 'Répondu dans le terminal');
  }

  private async sessionOf(origin: SignalOrigin, at: Date): Promise<Session> {
    this.lastSignals.set(origin.sourceId, at);
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
