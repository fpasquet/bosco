import type { FileChange } from '../domain/file-change.ts';
import type { SessionState, Waiting } from '../domain/session.ts';
import type { JournalEntry, TranscriptEvent } from '../domain/transcript-event.ts';
import type { NotificationService } from './notification.service.ts';
import type { PilotView } from './pilot.service.ts';
import type {
  CatalogGroup,
  CatalogProject,
  Clock,
  ProjectCatalog,
  SessionEvents,
  SessionRegistry,
  SessionRepository,
} from './ports.ts';
import { ASKING } from '../domain/notification.ts';
import { DEFAULT_INACTIVITY_DELAY_MS, Session } from '../domain/session.ts';

/** Une question lue dans le transcript ne notifie que si elle vient d'être posée : jamais l'historique relu. */
const RECENT_QUESTION_MS = 2 * 60 * 1000;

/** Avant que les projets soient branchés, toutes les sessions sont hors projet. */
const NO_PROJECTS: ProjectCatalog = {
  adopt: () => Promise.resolve([]),
  groups: () => Promise.resolve([]),
  folderOf: (gitRoot, path) => gitRoot ?? path,
  list: () => [],
  placeOf: () => null,
  rememberPlace: () => Promise.resolve(),
};

export interface SessionView {
  /** Autres projets d'une session pilotée à plusieurs projets, qu'elle voit en plus de son projet principal */
  addedProjects: { id: null | number; name: string; root: string }[];
  branch: null | string;
  /** Fichiers modifiés par l'agent, d'après ses appels d'outils */
  changedFiles: FileChange[];
  /** Coût estimé en dollars ; unpriced : une partie des tokens vient d'un modèle sans tarif connu (« non chiffré ») */
  cost: { unpriced: boolean; usd: number };
  /** Dossier d'une session hors projet, où l'Usage range son coût ; null dans un projet ou sans dossier connu */
  folder: null | string;
  id: string;
  lastAction: null | string;
  lastEventAt: Date;
  recentActions: string[];
  lastMessage: null | string;
  model: null | string;
  projectPath: null | string;
  /** Projet qui contient le dossier de travail, et ce dossier à l'intérieur (« packages/budget ») ; null : hors projet */
  project: { folder: string; id: number; name: string; root: string } | null;
  sourceId: string;
  startedAt: Date;
  state: SessionState;
  /** Part des sous-agents de la session, comprise dans usage et cost ; null quand elle n'en a pas eu */
  subagents: null | { tokens: number; usd: number };
  title: null | string;
  usage: { cacheCreation: number; cacheRead: number; input: number; output: number };
  turns: number;
  /** Ce qu'attend la session tant qu'elle t'attend ; rien sinon */
  waiting: null | Waiting;
  /** Ouverte dans un terminal : Bosco ne lui écrit pas */
  openInTerminal: boolean;
  /** Session pilotée par Bosco ; null sinon */
  pilot: null | PilotView;
  /** Session du terminal lancée avec le canal de Bosco, ouvert : Bosco peut lui écrire */
  channel: boolean;
}

/** Sessions pilotées par Bosco, telles que la vue d'une session les montre. */
export interface PilotsView {
  channelOpen(sessionId: string): boolean;
  openInTerminal(sourceId: string, sessionId: string): boolean;
  pilotOf(sessionId: string): null | PilotView;
}

const NO_PILOTS: PilotsView = { channelOpen: () => false, openInTerminal: () => false, pilotOf: () => null };

/** Détail d'une session : sa vue et son journal, du plus ancien au plus récent. */
export interface SessionDetail {
  journal: JournalEntry[];
  session: SessionView;
}

/** Cas d'usage des sessions : une méthode par intention. */
export class SessionService {
  private notifications: null | Pick<NotificationService, 'notify' | 'settle'> = null;
  private pilots: PilotsView = NO_PILOTS;
  private projects: ProjectCatalog = NO_PROJECTS;
  /** Dernière écriture en cours du journal de chaque session */
  private readonly writing = new Map<string, Promise<void>>();

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly clock: Clock,
    private readonly sessionEvents: SessionEvents = {
      permissionSettled: () => undefined,
      sessionChanged: () => undefined,
    },
    private readonly registry: Pick<SessionRegistry, 'isOpen'> = { isOpen: () => null },
    /** Seuil d'inactivité réglé dans les sources */
    private readonly inactivityDelayMs: () => number = () => DEFAULT_INACTIVITY_DELAY_MS,
  ) {}

  /** Projets choisis par la personne, branchés au démarrage : le projet d'une session se calcule à l'affichage. */
  useProjects(projects: ProjectCatalog): void {
    this.projects = projects;
  }

  /** Projets où l'on démarre une session et dont on lit le contexte : ceux que la personne a ajoutés. */
  knownProjects(): Promise<CatalogProject[]> {
    return Promise.resolve(this.projects.list());
  }

  /** Groupes avec lesquels démarrer une session, et leurs valeurs par défaut. */
  knownGroups(): Promise<CatalogGroup[]> {
    return this.projects.groups();
  }

  /** « Où elle tourne » d'une session démarrée : la prochaine du même projet le reprend. */
  rememberPlace(root: string, place: 'sandbox' | 'workstation'): Promise<void> {
    return this.projects.rememberPlace(root, place);
  }

  /**
   * Session la plus récemment active dans un dossier : celle dont l'agent vient d'appeler le serveur MCP de Bosco
   * depuis ce dossier, pour nommer l'auteur d'une décision proposée.
   */
  async latestIn(path: string): Promise<null | { id: string; title: null | string }> {
    const sessions = await this.listSessions();
    const [latest] = sessions
      .filter((session) => session.projectPath === path)
      .toSorted((a, b) => b.lastEventAt.getTime() - a.lastEventAt.getTime());
    return latest ? { id: latest.id, title: latest.title } : null;
  }

  /** Dossiers de travail des sessions déjà lues, que les projets rangent et proposent. */
  async sessionFolders(): Promise<{ gitRoot: null | string; lastEventAt: Date; path: null | string }[]> {
    const sessions = await this.sessionRepository.list();
    return sessions.map((session) => {
      const { lastEventAt, projectPath, projectRoot } = session.toSnapshot();
      return { gitRoot: projectRoot, lastEventAt, path: projectPath };
    });
  }

  /** Sessions pilotées par Bosco, branchées au démarrage (le service de pilotage dépend de celui-ci). */
  usePilots(pilots: PilotsView): void {
    this.pilots = pilots;
  }

  /** Sessions entrées dans le registre des sessions ouvertes, ou sorties : leur état change sans nouvel événement. */
  async refreshSessions(sessionIds: string[]): Promise<void> {
    for (const id of sessionIds) {
      const session = await this.sessionRepository.find(id);
      if (session) this.sessionEvents.sessionChanged(this.view(session));
    }
  }

  /** Notifications des questions de l'agent lues dans les transcripts, branchées au démarrage. */
  useNotifications(notifications: Pick<NotificationService, 'notify' | 'settle'>): void {
    this.notifications = notifications;
  }

  /**
   * Une écriture du journal d'une session à la fois : la lecture du transcript et le pilotage y ajoutent chacun des
   * lignes, numérotées à la suite.
   */
  private exclusive<T>(sessionId: string, write: () => Promise<T>): Promise<T> {
    const previous = this.writing.get(sessionId) ?? Promise.resolve();
    const next = previous.then(write, write);
    const settled = next.then(
      () => undefined,
      () => undefined,
    );
    this.writing.set(sessionId, settled);
    void settled.then(() => {
      if (this.writing.get(sessionId) === settled) this.writing.delete(sessionId);
    });
    return next;
  }

  /** Claude Code a suspendu « Approuver pour moi » d'une session pilotée : son fil le dit, à son heure. */
  noteAutoModeSuspended(sessionId: string, count: number, total: boolean): Promise<void> {
    return this.exclusive(sessionId, async () => {
      const session = await this.sessionRepository.find(sessionId);
      if (!session) return;
      session.noteAutoModeSuspended(count, total, this.clock.now());
      await this.sessionRepository.save(session, session.pullJournal());
      this.sessionEvents.sessionChanged(this.view(session));
    });
  }

  /** Tient compte des lignes nouvellement lues dans le transcript d'une session, qu'elle soit connue ou non. */
  recordTranscript(sourceId: string, sessionId: string, events: TranscriptEvent[]): Promise<SessionView | null> {
    if (events.length === 0) return Promise.resolve(null);
    return this.exclusive(sessionId, () => this.readTranscript(sourceId, sessionId, events));
  }

  private async readTranscript(sourceId: string, sessionId: string, events: TranscriptEvent[]): Promise<SessionView> {
    const found = await this.sessionRepository.find(sessionId);
    const firstAt = events.find((event) => event.at)?.at ?? this.clock.now();
    const session = found ?? Session.discover(sessionId, sourceId, firstAt);
    for (const event of events) session.record(event);
    await this.sessionRepository.save(session, session.pullJournal());
    let view = this.view(session);
    if (view.folder) {
      // Un dépôt où une session tourne pour la première fois devient un projet ; ses autres sessions le rejoignent
      const { projectPath, projectRoot } = session.toSnapshot();
      const adopted = await this.projects.adopt(projectRoot, projectPath);
      if (adopted.length > 0) {
        view = this.view(session);
        await this.announceProjects(adopted, view.id);
      }
    }
    this.sessionEvents.sessionChanged(view);
    await this.notifyQuestions(view, events);
    return view;
  }

  /** Sessions déjà lues qui viennent de rejoindre des projets adoptés : leur vue change sans nouvel événement. */
  private async announceProjects(projects: number[], except: string): Promise<void> {
    const adopted = new Set(projects);
    for (const other of await this.sessionRepository.list()) {
      if (other.toSnapshot().id === except) continue;
      const view = this.view(other);
      if (view.project && adopted.has(view.project.id)) this.sessionEvents.sessionChanged(view);
    }
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
          { place: view.project?.name ?? null, sessionId: view.id, taskId: null, title, excerpt: event.question },
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
    const state = session.stateAt(this.clock.now(), open, this.inactivityDelayMs());
    const {
      branch,
      costMicros,
      id,
      lastAction,
      lastEventAt,
      lastMessage,
      model,
      projectPath,
      sourceId,
      startedAt,
      title,
    } = snapshot;
    const { usage } = snapshot;
    const project = this.projects.placeOf(snapshot.projectRoot, projectPath);
    return {
      addedProjects: (pilot?.projects ?? []).map((root) => {
        const place = this.projects.placeOf(root, root);
        return { id: place?.id ?? null, name: place?.name ?? root.split('/').at(-1) ?? root, root };
      }),
      branch,
      channel: this.pilots.channelOpen(snapshot.id),
      cost: { usd: costMicros / 1_000_000, unpriced: snapshot.unpricedTokens > 0 },
      folder: project ? null : this.projects.folderOf(snapshot.projectRoot, projectPath),
      id,
      lastAction,
      lastEventAt,
      lastMessage,
      model,
      openInTerminal,
      pilot,
      recentActions: snapshot.recentActions,
      projectPath,
      project,
      sourceId,
      startedAt,
      state,
      subagents:
        snapshot.subagentUsage.total > 0
          ? { tokens: snapshot.subagentUsage.total, usd: snapshot.subagentCostMicros / 1_000_000 }
          : null,
      waiting: state === 'waiting' ? snapshot.waiting : null,
      turns: snapshot.turns,
      changedFiles: snapshot.changedFiles,
      title,
      usage: {
        input: usage.input,
        output: usage.output,
        cacheCreation: usage.cacheCreation,
        cacheRead: usage.cacheRead,
      },
    };
  }
}
