import type { MikroORM } from '@mikro-orm/sqlite';
import type { IsolationStore } from '../../application/isolation.service.ts';
import { SettingSchema } from '../../../shared/infrastructure/persistence/setting.schema.ts';

const DOMAINS = 'isolation.domains';
/** L'abonnement par défaut garde la clé des secrets du worker : le choix fait avant le bac à sable reste */
const SECRETS = 'isolation.secrets';

/** Réglages de l'isolation dans la table des réglages du poste. */
export class MikroOrmIsolationStore implements IsolationStore {
  constructor(private readonly orm: MikroORM) {}

  async addedDomains(): Promise<string[]> {
    const row = await this.orm.em.fork().findOne(SettingSchema, { key: DOMAINS });
    if (!row) return [];
    const parsed: unknown = JSON.parse(row.value);
    return Array.isArray(parsed) ? parsed.filter((domain): domain is string => typeof domain === 'string') : [];
  }

  async saveAddedDomains(domains: readonly string[]): Promise<void> {
    await this.orm.em.fork().upsert(SettingSchema, { key: DOMAINS, value: JSON.stringify(domains) });
  }

  async subscription(): Promise<null | string> {
    const row = await this.orm.em.fork().findOne(SettingSchema, { key: SECRETS });
    try {
      const parsed = JSON.parse(row?.value ?? '{}') as Record<string, unknown>;
      return typeof parsed.profile === 'string' ? parsed.profile : null;
    } catch {
      return null;
    }
  }

  async saveSubscription(profile: null | string): Promise<void> {
    await this.orm.em.fork().upsert(SettingSchema, { key: SECRETS, value: JSON.stringify({ profile }) });
  }
}
