import type { FileChange } from '../domain/file-change.ts';
import type { SessionState, Waiting } from '../domain/session.ts';
import type { JournalEntry, TranscriptEvent } from '../domain/transcript-event.ts';
import type { Clock, SessionEvents, SessionRegistry, SessionRepository } from './ports.ts';
import { DEFAULT_INACTIVITY_DELAY_MS, Session } from '../domain/session.ts';

/** Tâche d'une session du worker (E2c, E2d) : la relecture ou la relance se font depuis la tâche. */
export interface TaskLink {
  failure: null | string;
  id: number;
  state: string;
  /** Titre de la tâche : celui de la session, plutôt que la consigne complète transmise à l'agent */
  title: string;
}

/** Liens des sessions vers leur tâche, gardés pour l'historique. */
export interface TaskLinkStore {
  load(): Promise<Map<string, TaskLink>>;
  save(sessionId: string, link: TaskLink): Promise<void>;
}

export interface SessionView {
  branch: null | string;
  /** Fichiers modifiés par l'agent, d'après ses appels d'outils */
  changedFiles: FileChange[];
  /** Coût estimé en dollars ; unpriced : une partie des tokens vient d'un modèle sans tarif connu (« non chiffré ») */
  cost: { unpriced: boolean; usd: number };
  id: string;
  lastAction: null | string;
  lastEventAt: Date;
  recentActions: string[];
  lastMessage: null | string;
  model: null | string;
  repoPath: null | string;
  /** Dépôt de la session : nom de la racine git et dossier de travail à l'intérieur (« labo-ia », « packages/bosco ») */
  repository: { folder: string; name: string; root: string } | null;
  sourceId: string;
  startedAt: Date;
  state: SessionState;
  title: null | string;
  usage: { cacheCreation: number; cacheRead: number; input: number; output: number };
  turns: number;
  /** Tâche du worker qui a lancé la session ; null pour une session interactive */
  task: null | TaskLink;
  /** Ce qu'attend la session tant qu'elle t'attend ; rien sinon */
  waiting: null | Waiting;
}

/** Détail d'une session (E2) : sa vue et son journal, du plus ancien au plus récent. */
export interface SessionDetail {
  journal: JournalEntry[];
  session: SessionView;
}

/** Cas d'usage des sessions : une méthode par intention. */
export class SessionService {
  private taskLinks = new Map<string, TaskLink>();
  private linkStore: null | TaskLinkStore = null;

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly clock: Clock,
    private readonly sessionEvents: SessionEvents = {
      permissionSettled: () => undefined,
      sessionChanged: () => undefined,
    },
    private readonly registry: Pick<SessionRegistry, 'isOpen'> = { isOpen: () => null },
    /** Seuil d'inactivité réglé dans les sources (CA-SESS-59) */
    private readonly inactivityDelayMs: () => number = () => DEFAULT_INACTIVITY_DELAY_MS,
  ) {}

  /** Liens vers les tâches, lus au démarrage, et relus après une remise à zéro des scénarios. */
  async useTaskLinks(store: TaskLinkStore | null = this.linkStore): Promise<void> {
    this.linkStore = store;
    this.taskLinks = store ? await store.load() : new Map<string, TaskLink>();
  }

  /** Une tâche du worker change : sa session, même pas encore lue, prend son état (À relire, En échec). */
  async linkTask(sessionId: string, link: TaskLink): Promise<void> {
    const known = this.taskLinks.get(sessionId);
    if (known?.state === link.state && known.failure === link.failure && known.title === link.title) return;
    this.taskLinks.set(sessionId, link);
    await this.linkStore?.save(sessionId, link);
    const session = await this.sessionRepository.find(sessionId);
    if (session) this.sessionEvents.sessionChanged(this.view(session));
  }

  /** Sessions entrées dans le registre des sessions ouvertes, ou sorties : leur état change sans nouvel événement. */
  async refreshSessions(sessionIds: string[]): Promise<void> {
    for (const id of sessionIds) {
      const session = await this.sessionRepository.find(id);
      if (session) this.sessionEvents.sessionChanged(this.view(session));
    }
  }

  /** Tient compte des lignes nouvellement lues dans le transcript d'une session, qu'elle soit connue ou non. */
  async recordTranscript(sourceId: string, sessionId: string, events: TranscriptEvent[]): Promise<SessionView | null> {
    if (events.length === 0) return null;
    const found = await this.sessionRepository.find(sessionId);
    const firstAt = events.find((event) => event.at)?.at ?? this.clock.now();
    const session = found ?? Session.discover(sessionId, sourceId, firstAt);
    for (const event of events) session.record(event);
    await this.sessionRepository.save(session, session.pullJournal());
    const view = this.view(session);
    this.sessionEvents.sessionChanged(view);
    return view;
  }

  async sessionDetail(id: string): Promise<null | SessionDetail> {
    const session = await this.sessionRepository.find(id);
    if (!session) return null;
    const journal = await this.sessionRepository.journal(id);
    return { session: this.view(session), journal };
  }

  async listSessions(): Promise<SessionView[]> {
    const sessions = await this.sessionRepository.list();
    return sessions.map((session) => this.view(session));
  }

  /** Vue d'une session à l'instant présent, avec son état. */
  viewOf(session: Session): SessionView {
    return this.view(session);
  }

  private view(session: Session): SessionView {
    const snapshot = session.toSnapshot();
    const open = this.registry.isOpen(snapshot.sourceId, snapshot.id);
    const link = this.taskLinks.get(snapshot.id) ?? null;
    // L'agent d'une tâche qui ne tourne plus a fini : sa session est terminée, sans attendre l'inactivité
    const state =
      link && link.state !== 'running' ? 'ended' : session.stateAt(this.clock.now(), open, this.inactivityDelayMs());
    const {
      branch,
      costMicros,
      id,
      lastAction,
      lastEventAt,
      lastMessage,
      model,
      repoPath,
      sourceId,
      startedAt,
      title,
    } = snapshot;
    const { usage } = snapshot;
    return {
      branch,
      cost: { usd: costMicros / 1_000_000, unpriced: snapshot.unpricedTokens > 0 },
      id,
      lastAction,
      lastEventAt,
      lastMessage,
      model,
      recentActions: snapshot.recentActions,
      repoPath,
      repository: repositoryOf(snapshot.repoRoot, repoPath),
      sourceId,
      startedAt,
      state,
      task: link,
      waiting: state === 'waiting' ? snapshot.waiting : null,
      turns: snapshot.turns,
      changedFiles: snapshot.changedFiles,
      title: link?.title ?? title,
      usage: {
        input: usage.input,
        output: usage.output,
        cacheCreation: usage.cacheCreation,
        cacheRead: usage.cacheRead,
      },
    };
  }
}

/** Dépôt d'une session : sa racine git si elle est connue, sinon son dossier de travail. */
function repositoryOf(root: null | string, path: null | string): SessionView['repository'] {
  const base = root ?? path;
  if (!base) return null;
  const name = base.split('/').filter(Boolean).pop() ?? base;
  const folder = path && path.startsWith(`${base}/`) ? path.slice(base.length + 1) : '';
  return { name, root: base, folder };
}
