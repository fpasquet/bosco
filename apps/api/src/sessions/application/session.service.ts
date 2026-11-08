import type { FileChange } from '../domain/file-change.ts';
import type { SessionState, Waiting } from '../domain/session.ts';
import type { JournalEntry, TranscriptEvent } from '../domain/transcript-event.ts';
import type { NotificationService } from './notification.service.ts';
import type { PilotView } from './pilot.service.ts';
import type { Clock, SessionEvents, SessionRegistry, SessionRepository } from './ports.ts';
import { ASKING } from '../domain/notification.ts';
import { LEGACY_DISCOVERY, RepositoryDiscovery, type RepositoryPlace } from '../domain/repository-discovery.ts';
import { DEFAULT_INACTIVITY_DELAY_MS, Session } from '../domain/session.ts';

/** Une question lue dans le transcript ne notifie que si elle vient d'être posée : jamais l'historique relu. */
const RECENT_QUESTION_MS = 2 * 60 * 1000;

/** Range une session dans son dépôt (E4d) : racine git notée à la lecture, dossier de travail. */
export type RepositoryPlaces = (gitRoot: null | string, path: null | string) => null | RepositoryPlace;

const LEGACY_PLACES: RepositoryPlaces = (gitRoot, path) =>
  new RepositoryDiscovery(LEGACY_DISCOVERY, '', () => null).placeOf(gitRoot, path);

/** Dépôt trouvé (E4d), avec la dernière activité de ses sessions. */
export interface DiscoveredRepository {
  git: boolean;
  hidden: boolean;
  lastActivityAt: Date;
  name: string;
  root: string;
}

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
  /**
   * Dépôt de la session : nom de la racine git et dossier de travail à l'intérieur (« labo-ia », « packages/bosco ») ;
   * hidden : masqué des listes (E4d), ses sessions restent visibles
   */
  repository: { folder: string; hidden: boolean; name: string; root: string } | null;
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
  /** Ouverte dans un terminal : Bosco ne lui écrit pas (CA-SESS-98) */
  openInTerminal: boolean;
  /** Session pilotée par Bosco (E2e) ; null sinon */
  pilot: null | PilotView;
  /** Session du terminal lancée avec le canal de Bosco, ouvert : Bosco peut lui écrire (E2i) */
  channel: boolean;
}

/** Sessions pilotées par Bosco, telles que la vue d'une session les montre. */
export interface PilotsView {
  channelOpen(sessionId: string): boolean;
  openInTerminal(sourceId: string, sessionId: string): boolean;
  pilotOf(sessionId: string): null | PilotView;
}

const NO_PILOTS: PilotsView = { channelOpen: () => false, openInTerminal: () => false, pilotOf: () => null };

/** Détail d'une session (E2) : sa vue et son journal, du plus ancien au plus récent. */
export interface SessionDetail {
  journal: JournalEntry[];
  session: SessionView;
}

/** Cas d'usage des sessions : une méthode par intention. */
export class SessionService {
  private taskLinks = new Map<string, TaskLink>();
  private linkStore: null | TaskLinkStore = null;
  private notifications: null | Pick<NotificationService, 'notify' | 'settle'> = null;
  private pilots: PilotsView = NO_PILOTS;

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
    /** Réglages des dépôts découverts (E4d), lus à chaque affichage (DT-27) */
    private readonly places: RepositoryPlaces = LEGACY_PLACES,
  ) {}

  /**
   * Dépôts où l'on prépare du travail (E6a, E9a) : les dépôts git affichés, d'après les sessions des profils
   * surveillés, les plus récents d'abord (CA-SESS-81).
   */
  async knownRepositories(): Promise<{ name: string; root: string }[]> {
    const { repositories } = await this.discoveredRepositories();
    return repositories.filter(({ git, hidden }) => git && !hidden).map(({ name, root }) => ({ name, root }));
  }

  /** Dépôts trouvés (E4d), masqués compris, les plus récents d'abord ; outside : sessions hors dépôt git. */
  async discoveredRepositories(): Promise<{ outside: number; repositories: DiscoveredRepository[] }> {
    const sessions = await this.sessionRepository.list();
    const found = new Map<string, DiscoveredRepository>();
    let outside = 0;
    for (const session of sessions) {
      const { lastEventAt, repoPath, repoRoot } = session.toSnapshot();
      const place = this.places(repoRoot, repoPath);
      if (!place) {
        outside += 1;
        continue;
      }
      const known = found.get(place.root);
      if (!known || known.lastActivityAt < lastEventAt)
        found.set(place.root, {
          git: place.git,
          hidden: place.hidden,
          lastActivityAt: lastEventAt,
          name: place.name,
          root: place.root,
        });
    }
    const repositories = [...found.values()].toSorted(
      (a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime() || a.name.localeCompare(b.name, 'fr'),
    );
    return { outside, repositories };
  }

  /** Sessions pilotées par Bosco, branchées au démarrage (le service de pilotage dépend de celui-ci). */
  usePilots(pilots: PilotsView): void {
    this.pilots = pilots;
  }

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

  /** Notifications des questions de l'agent lues dans les transcripts (E15), branchées au démarrage. */
  useNotifications(notifications: Pick<NotificationService, 'notify' | 'settle'>): void {
    this.notifications = notifications;
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
    await this.notifyQuestions(view, events);
    return view;
  }

  /** Une question de l'agent qui vient d'être posée notifie ; ta demande suivante règle ce qui attendait. */
  private async notifyQuestions(view: SessionView, events: TranscriptEvent[]): Promise<void> {
    if (!this.notifications) return;
    const now = this.clock.now().getTime();
    const title = view.title ?? `Session ${view.id.slice(0, 8)}`;
    for (const event of events) {
      if (event.question && event.at && now - event.at.getTime() < RECENT_QUESTION_MS)
        await this.notifications.notify(
          { kind: 'question' },
          { place: view.repository?.name ?? null, sessionId: view.id, taskId: null, title, excerpt: event.question },
        );
      else if (event.kind === 'prompt' && event.at && now - event.at.getTime() < RECENT_QUESTION_MS)
        await this.notifications.settle({ sessionId: view.id, kinds: ASKING }, 'Répondu');
    }
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
    const pilot = this.pilots.pilotOf(snapshot.id);
    const openInTerminal = this.pilots.openInTerminal(snapshot.sourceId, snapshot.id);
    // Entre deux tours, une session pilotée est close sans être terminée : elle attend ton prochain message
    const open = pilot && !openInTerminal ? null : this.registry.isOpen(snapshot.sourceId, snapshot.id);
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
      channel: this.pilots.channelOpen(snapshot.id),
      cost: { usd: costMicros / 1_000_000, unpriced: snapshot.unpricedTokens > 0 },
      id,
      lastAction,
      lastEventAt,
      lastMessage,
      model,
      openInTerminal,
      pilot,
      recentActions: snapshot.recentActions,
      repoPath,
      repository: repositoryOf(this.places(snapshot.repoRoot, repoPath)),
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

/** Dépôt d'une session tel que les écrans le montrent. */
function repositoryOf(place: null | RepositoryPlace): SessionView['repository'] {
  return place && { folder: place.folder, hidden: place.hidden, name: place.name, root: place.root };
}
