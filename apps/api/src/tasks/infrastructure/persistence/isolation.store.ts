import type { MikroORM } from '@mikro-orm/sqlite';
import type { IsolationStore, SecretsChoice } from '../../application/isolation.service.ts';
import type { EgressRefusal } from '../../domain/egress.ts';
import { SettingSchema } from '../../../shared/infrastructure/persistence/setting.schema.ts';
import { EgressRefusalSchema } from './egress-refusal.schema.ts';

const DOMAINS = 'isolation.domains';
const MAX_AGENTS = 'isolation.maxAgents';
const SECRETS = 'isolation.secrets';

/** Réglages de l'isolation dans la table des réglages du poste ; refus dans leur table. */
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

  async maxAgents(): Promise<null | number> {
    const row = await this.orm.em.fork().findOne(SettingSchema, { key: MAX_AGENTS });
    const agents = Number(row?.value);
    return row && Number.isInteger(agents) ? agents : null;
  }

  async saveMaxAgents(agents: number): Promise<void> {
    await this.orm.em.fork().upsert(SettingSchema, { key: MAX_AGENTS, value: String(agents) });
  }

  async secrets(): Promise<SecretsChoice> {
    const row = await this.orm.em.fork().findOne(SettingSchema, { key: SECRETS });
    try {
      const parsed = JSON.parse(row?.value ?? '{}') as Record<string, unknown>;
      const text = (key: string) => (typeof parsed[key] === 'string' ? parsed[key] : null);
      return { github: text('github'), npmrc: text('npmrc'), profile: text('profile') };
    } catch {
      return { github: null, npmrc: null, profile: null };
    }
  }

  async saveSecrets(choice: SecretsChoice): Promise<void> {
    await this.orm.em.fork().upsert(SettingSchema, { key: SECRETS, value: JSON.stringify(choice) });
  }

  async record(refusal: EgressRefusal): Promise<void> {
    await this.orm.em.fork().upsert(EgressRefusalSchema, { ...refusal });
  }

  async refusals(limit: number): Promise<EgressRefusal[]> {
    const rows = await this.orm.em.fork().find(EgressRefusalSchema, {}, { orderBy: { at: 'desc' }, limit });
    return rows.map(({ at, host, taskId }) => ({ at, host, taskId }));
  }
}
