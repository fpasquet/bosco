import type { MikroORM } from '@mikro-orm/sqlite';
import type { LinkRepository } from '../../application/links.service.ts';
import type { LinkService, LinkSnapshot } from '../../domain/link.ts';
import { LinkSchema } from './context.schema.ts';

export class MikroOrmLinkRepository implements LinkRepository {
  constructor(private readonly orm: MikroORM) {}

  async all(): Promise<LinkSnapshot[]> {
    const rows = await this.orm.em.fork().find(LinkSchema, {}, { orderBy: { id: 'asc' } });
    return rows.map((row) => ({ ...row, service: row.service as LinkService }));
  }

  async nextId(): Promise<number> {
    const rows = await this.orm.em.fork().find(LinkSchema, {}, { orderBy: { id: 'desc' }, limit: 1 });
    return (rows[0]?.id ?? 0) + 1;
  }

  async save(link: LinkSnapshot): Promise<void> {
    await this.orm.em.fork().upsert(LinkSchema, { ...link });
  }

  async remove(id: number): Promise<void> {
    await this.orm.em.fork().nativeDelete(LinkSchema, { id });
  }
}
