import type { MikroORM } from '@mikro-orm/sqlite';
import { Source, type SourceRepository } from '@bosco/core/sessions';
import { SourceSchema } from './sessions.schema.ts';

export class MikroOrmSourceRepository implements SourceRepository {
  constructor(private readonly orm: MikroORM) {}

  async list(): Promise<Source[]> {
    const rows = await this.orm.em.fork().find(SourceSchema, {}, { orderBy: { path: 'asc' } });
    return rows.map((row) => Source.restore(row));
  }

  async save(sources: Source[]): Promise<void> {
    const em = this.orm.em.fork();
    for (const source of sources) await em.upsert(SourceSchema, source.toSnapshot(), { onConflictFields: ['path'] });
  }
}
