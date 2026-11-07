import type { SessionState } from '../domain/session.ts';
import type { TranscriptEvent } from '../domain/transcript-event.ts';
import type { Clock, SessionEvents, SessionRepository } from './ports.ts';
import { Session } from '../domain/session.ts';

export interface SessionView {
  branch: null | string;
  /** Coût estimé en dollars ; unpriced : une partie des tokens vient d'un modèle sans tarif connu (« non chiffré ») */
  cost: { unpriced: boolean; usd: number };
  id: string;
  lastAction: null | string;
  lastEventAt: Date;
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
}

/** Cas d'usage des sessions : une méthode par intention. */
export class SessionService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly clock: Clock,
    private readonly sessionEvents: SessionEvents = { sessionChanged: () => undefined },
  ) {}

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

  async listSessions(): Promise<SessionView[]> {
    const sessions = await this.sessionRepository.list();
    return sessions.map((session) => this.view(session));
  }

  private view(session: Session): SessionView {
    const snapshot = session.toSnapshot();
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
      repoPath,
      repository: repositoryOf(snapshot.repoRoot, repoPath),
      sourceId,
      startedAt,
      state: session.stateAt(this.clock.now()),
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

/** Dépôt d'une session : sa racine git si elle est connue, sinon son dossier de travail. */
function repositoryOf(root: null | string, path: null | string): SessionView['repository'] {
  const base = root ?? path;
  if (!base) return null;
  const name = base.split('/').filter(Boolean).pop() ?? base;
  const folder = path && path.startsWith(`${base}/`) ? path.slice(base.length + 1) : '';
  return { name, root: base, folder };
}
