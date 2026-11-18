import type { EntityManager, MikroORM } from '@mikro-orm/sqlite';
import type {
  RecordedPullRequest,
  RecordedTurn,
  SessionRepository,
  UsageBackfillRepository,
  UsageRepository,
} from '../../application/ports.ts';
import type { CreatedPullRequest, JournalEntry, TurnUsage } from '../../domain/transcript-event.ts';
import { Session, type Waiting } from '../../domain/session.ts';
import { TokenUsage } from '../../domain/token-usage.ts';
import {
  type SessionEventRow,
  SessionEventSchema,
  SessionPullRequestSchema,
  type SessionRow,
  SessionSchema,
  type SessionTurnRow,
  SessionTurnSchema,
} from './sessions.schema.ts';

export class MikroOrmSessionRepository implements SessionRepository, UsageBackfillRepository, UsageRepository {
  constructor(private readonly orm: MikroORM) {}

  async find(id: string): Promise<null | Session> {
    const row = await this.orm.em.fork().findOne(SessionSchema, { id });
    return row ? toSession(row) : null;
  }

  async journal(id: string): Promise<JournalEntry[]> {
    const rows = await this.orm.em.fork().find(SessionEventSchema, { sessionId: id }, { orderBy: { seq: 'asc' } });
    return rows.map(toEntry);
  }

  async search(text: string): Promise<Set<string>> {
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) return new Set();
    // Chaque mot est cherché en début de mot, sans opérateur FTS5 : les guillemets sont doublés
    const match = words.map((word) => `"${word.replaceAll('"', '""')}"*`).join(' ');
    const connection = this.orm.em.getConnection();
    const events = await connection.execute<{ session_id: string }[]>(
      'select distinct session_id from session_search where session_search match ?',
      [match],
    );
    const titled = await this.orm.em
      .fork()
      .find(SessionSchema, { $and: words.map((word) => ({ title: { $like: `%${word.replaceAll(/[%_]/g, '')}%` } })) });
    return new Set([...events.map((row) => row.session_id), ...titled.map((row) => row.id)]);
  }

  async list(): Promise<Session[]> {
    const rows = await this.orm.em.fork().find(SessionSchema, {}, { orderBy: { lastEventAt: 'desc' } });
    return rows.map(toSession);
  }

  async save(session: Session, journal: JournalEntry[]): Promise<void> {
    const em = this.orm.em.fork();
    const { usage, waiting, ...snapshot } = session.toSnapshot();
    await em.upsert(SessionSchema, {
      ...snapshot,
      waiting: waiting ? { ...waiting, since: waiting.since.toISOString() } : null,
      inputTokens: usage.input,
      outputTokens: usage.output,
      cacheCreationTokens: usage.cacheCreation,
      cacheReadTokens: usage.cacheRead,
    });
    await this.saveUsage(em, snapshot.id, session.pullUsage());
    if (journal.length) {
      await em.insertMany(
        SessionEventSchema,
        journal.map((entry) => ({
          sessionId: snapshot.id,
          seq: entry.seq,
          at: entry.at,
          kind: entry.kind,
          text:
            entry.kind === 'autoModeSuspended'
              ? JSON.stringify({ count: entry.count, total: entry.total })
              : entry.text,
        })),
      );
      // Index de recherche de l'historique (E3a), alimenté avec ce que disent le transcript et la personne
      const connection = em.getConnection();
      for (const entry of journal)
        if (entry.kind !== 'autoModeSuspended')
          await connection.execute('insert into session_search (session_id, text) values (?, ?)', [
            snapshot.id,
            entry.text,
          ]);
    }
  }

  /** Usage des tours et PR créées lus avec le transcript ; une PR déjà notée ne compte pas deux fois. */
  private async saveUsage(
    em: EntityManager,
    sessionId: string,
    { pullRequests, turns }: { pullRequests: CreatedPullRequest[]; turns: TurnUsage[] },
  ): Promise<void> {
    if (turns.length)
      await em.insertMany(
        SessionTurnSchema,
        turns.map((turn) => toTurnRow(sessionId, turn)),
      );
    if (pullRequests.length)
      await em.upsertMany(
        SessionPullRequestSchema,
        pullRequests.map(({ at, url }) => ({ at, sessionId, url })),
        { onConflictAction: 'ignore', onConflictFields: ['url'] },
      );
  }

  async listTurns(from: Date | null): Promise<RecordedTurn[]> {
    const rows = await this.orm.em
      .fork()
      .find(SessionTurnSchema, from ? { at: { $gte: from } } : {}, { orderBy: { at: 'asc' } });
    return rows.map((row) => ({
      at: row.at,
      model: row.model,
      sessionId: row.sessionId,
      usage: new TokenUsage(row.inputTokens, row.outputTokens, row.cacheCreationTokens, row.cacheReadTokens),
    }));
  }

  async listPullRequests(from: Date | null): Promise<RecordedPullRequest[]> {
    const rows = await this.orm.em.fork().find(SessionPullRequestSchema, from ? { at: { $gte: from } } : {});
    return rows.map(({ at, sessionId, url }) => ({ at, sessionId, url }));
  }

  async listActivity(from: Date | null): Promise<{ at: Date; kind: string; sessionId: string }[]> {
    const rows = await this.orm.em.fork().find(SessionEventSchema, from ? { at: { $gte: from } } : {}, {
      fields: ['at', 'kind', 'sessionId', 'seq'],
      orderBy: { sessionId: 'asc', seq: 'asc' },
    });
    return rows.map(({ at, kind, sessionId }) => ({ at, kind, sessionId }));
  }

  async firstTurnAt(): Promise<Date | null> {
    const [first] = await this.orm.em.fork().find(SessionTurnSchema, {}, { orderBy: { at: 'asc' }, limit: 1 });
    return first?.at ?? null;
  }

  async replaceUsage(session: Session): Promise<void> {
    const em = this.orm.em.fork();
    const { id } = session.toSnapshot();
    await em.nativeDelete(SessionTurnSchema, { sessionId: id });
    await this.saveUsage(em, id, session.pullUsage());
    await em.nativeUpdate(SessionSchema, { id }, { usageComplete: session.toSnapshot().usageComplete });
  }

  async listIncompleteUsage(): Promise<Session[]> {
    const rows = await this.orm.em.fork().find(SessionSchema, { usageComplete: false });
    return rows.map(toSession);
  }
}

/** Une suspension d'« Approuver pour moi » garde son nombre de refus en JSON dans le texte de sa ligne. */
function toEntry({ at, kind, seq, text }: SessionEventRow): JournalEntry {
  if (kind !== 'autoModeSuspended') return { at, kind: kind as 'prompt' | 'reply' | 'tool', seq, text };
  const { count, total } = JSON.parse(text) as { count: number; total: boolean };
  return { at, count, kind, seq, total };
}

function toTurnRow(sessionId: string, { at, model, usage }: TurnUsage): SessionTurnRow {
  return {
    sessionId,
    at,
    model,
    inputTokens: usage.input,
    outputTokens: usage.output,
    cacheCreationTokens: usage.cacheCreation,
    cacheReadTokens: usage.cacheRead,
  };
}

function toSession(row: SessionRow): Session {
  const { inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens, waiting, ...snapshot } = row;
  return Session.restore({
    ...snapshot,
    waiting: waiting ? ({ ...waiting, since: new Date(String(waiting.since)) } as unknown as Waiting) : null,
    usage: new TokenUsage(inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens),
  });
}
