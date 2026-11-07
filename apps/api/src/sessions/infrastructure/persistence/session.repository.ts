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
