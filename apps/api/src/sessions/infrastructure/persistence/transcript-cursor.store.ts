import type { MikroORM } from '@mikro-orm/sqlite';
import { TranscriptCursorSchema } from './sessions.schema.ts';

/** Positions de lecture des transcripts, propres à l'adaptateur de lecture : le domaine ne les voit pas. */
export class TranscriptCursorStore {
  constructor(private readonly orm: MikroORM) {}

  async offsetOf(path: string): Promise<number> {
    const row = await this.orm.em.fork().findOne(TranscriptCursorSchema, { path });
    return row?.offset ?? 0;
  }

  async moveTo(path: string, offset: number): Promise<void> {
    await this.orm.em.fork().upsert(TranscriptCursorSchema, { path, offset });
  }
}
