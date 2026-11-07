import type { SessionState } from '../domain/session.ts';
import type { TranscriptEvent } from '../domain/transcript-event.ts';
import type { Clock, SessionRepository } from './ports.ts';
import { Session } from '../domain/session.ts';

export interface SessionView {
  branch: null | string;
  id: string;
  lastEventAt: Date;
  lastMessage: null | string;
  model: null | string;
  repoPath: null | string;
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
  ) {}

  /** Tient compte des lignes nouvellement lues dans le transcript d'une session, qu'elle soit connue ou non. */
  async recordTranscript(sourceId: string, sessionId: string, events: TranscriptEvent[]): Promise<SessionView | null> {
    if (events.length === 0) return null;
    const found = await this.sessionRepository.find(sessionId);
    const firstAt = events.find((event) => event.at)?.at ?? this.clock.now();
    const session = found ?? Session.discover(sessionId, sourceId, firstAt);
    for (const event of events) session.record(event);
    await this.sessionRepository.save(session, session.pullJournal());
    return this.view(session);
  }

  async listSessions(): Promise<SessionView[]> {
    const sessions = await this.sessionRepository.list();
    return sessions.map((session) => this.view(session));
  }

  private view(session: Session): SessionView {
    const { branch, id, lastEventAt, lastMessage, model, repoPath, sourceId, startedAt, title, usage } =
      session.toSnapshot();
    return {
      branch,
      id,
      lastEventAt,
      lastMessage,
      model,
      repoPath,
      sourceId,
      startedAt,
      title,
      state: session.stateAt(this.clock.now()),
      usage: {
        input: usage.input,
        output: usage.output,
        cacheCreation: usage.cacheCreation,
        cacheRead: usage.cacheRead,
      },
    };
  }
}
