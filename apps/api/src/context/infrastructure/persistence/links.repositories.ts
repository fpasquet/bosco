import type { MikroORM } from '@mikro-orm/sqlite';
import type { IntegrationSettings, IntegrationStore, LinkRepository } from '../../application/links.service.ts';
import type { LinkService, LinkSnapshot } from '../../domain/link.ts';
import { SettingSchema } from '../../../shared/infrastructure/persistence/setting.schema.ts';
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

const KEY = 'integrations.atlassian';

/** Accès de Jira et Confluence, dans la table des réglages du poste : jamais renvoyés par l'API ni aux agents. */
export class MikroOrmIntegrationStore implements IntegrationStore {
  constructor(private readonly orm: MikroORM) {}

  async load(): Promise<IntegrationSettings> {
    const row = await this.orm.em.fork().findOne(SettingSchema, { key: KEY });
    return row ? (JSON.parse(row.value) as IntegrationSettings) : { jira: null, confluence: null };
  }

  async save(settings: IntegrationSettings): Promise<void> {
    await this.orm.em.fork().upsert(SettingSchema, { key: KEY, value: JSON.stringify(settings) });
  }
}
