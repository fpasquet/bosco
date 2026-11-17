import type { MikroORM } from '@mikro-orm/sqlite';
import type { RightsStore } from '../../application/rights.service.ts';
import type { RepositoryRights } from '../../domain/rights.ts';
import { SettingSchema } from '../../../shared/infrastructure/persistence/setting.schema.ts';

const GENERAL = 'rights.general';

/** Droits des agents dans la table des réglages du poste : le général, puis une clé par dépôt. */
export class MikroOrmRightsStore implements RightsStore {
  constructor(private readonly orm: MikroORM) {}

  general(): Promise<null | Partial<RepositoryRights>> {
    return this.read(GENERAL);
  }

  async repository(name: string): Promise<Partial<RepositoryRights>> {
    const own = await this.read(`rights.repository.${name}`);
    return own ?? {};
  }

  saveGeneral(rights: RepositoryRights): Promise<void> {
    return this.write(GENERAL, rights);
  }

  saveRepository(name: string, rights: Partial<RepositoryRights>): Promise<void> {
    return this.write(`rights.repository.${name}`, rights);
  }

  private async read(key: string): Promise<null | Partial<RepositoryRights>> {
    const row = await this.orm.em.fork().findOne(SettingSchema, { key });
    return row ? (JSON.parse(row.value) as Partial<RepositoryRights>) : null;
  }

  private async write(key: string, value: unknown): Promise<void> {
    await this.orm.em.fork().upsert(SettingSchema, { key, value: JSON.stringify(value) });
  }
}
