import type { MikroORM } from '@mikro-orm/sqlite';
import type { SessionRepository } from '../../application/ports.ts';
import type { JournalEntry } from '../../domain/transcript-event.ts';
import { Session, type Waiting } from '../../domain/session.ts';
import { TokenUsage } from '../../domain/token-usage.ts';
import { SessionEventSchema, type SessionRow, SessionSchema } from './sessions.schema.ts';

export class MikroOrmSessionRepository implements SessionRepository {
  constructor(private readonly orm: MikroORM) {}

  async find(id: string): Promise<null | Session> {
    const row = await this.orm.em.fork().findOne(SessionSchema, { id });
    return row ? toSession(row) : null;
  }

  async journal(id: string): Promise<JournalEntry[]> {
    const rows = await this.orm.em.fork().find(SessionEventSchema, { sessionId: id }, { orderBy: { seq: 'asc' } });
    return rows.map(({ at, kind, seq, text }) => ({ at, kind: kind as JournalEntry['kind'], seq, text }));
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
    if (journal.length) {
      await em.insertMany(
        SessionEventSchema,
        journal.map((entry) => ({
          sessionId: snapshot.id,
          seq: entry.seq,
          at: entry.at,
          kind: entry.kind,
          text: entry.text,
        })),
      );
      // Index de recherche de l'historique (E3a), alimenté avec le journal
      const connection = em.getConnection();
      for (const entry of journal)
        await connection.execute('insert into session_search (session_id, text) values (?, ?)', [
          snapshot.id,
          entry.text,
        ]);
    }
  }
}

function toSession(row: SessionRow): Session {
  const { inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens, waiting, ...snapshot } = row;
  return Session.restore({
    ...snapshot,
    waiting: waiting ? ({ ...waiting, since: new Date(String(waiting.since)) } as unknown as Waiting) : null,
    usage: new TokenUsage(inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens),
  });
}
