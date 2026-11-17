import type { MikroORM } from '@mikro-orm/sqlite';
import type { QuotaWindows } from '../../../shared/domain/subscription-quota.ts';
import type { QuotaStore } from '../../application/quota.service.ts';
import type { QuotaScope, QuotaThresholds } from '../../domain/quota.ts';
import { SettingSchema } from '../../../shared/infrastructure/persistence/setting.schema.ts';

const THRESHOLDS = 'quota.thresholds';
const WINDOWS = 'quota.windows';
const SCOPE = 'quota.scope';

/** Seuils du quota, leur portée et dernier usage de chaque abonnement, dans la table des réglages du poste (DT-39). */
export class MikroOrmQuotaStore implements QuotaStore {
  constructor(private readonly orm: MikroORM) {}

  private async read(key: string): Promise<unknown> {
    const row = await this.orm.em.fork().findOne(SettingSchema, { key });
    try {
      return row ? (JSON.parse(row.value) as unknown) : null;
    } catch {
      return null;
    }
  }

  async thresholds(): Promise<null | QuotaThresholds> {
    const value = await this.read(THRESHOLDS);
    return value ? (value as QuotaThresholds) : null;
  }

  async saveThresholds(thresholds: QuotaThresholds): Promise<void> {
    await this.orm.em.fork().upsert(SettingSchema, { key: THRESHOLDS, value: JSON.stringify(thresholds) });
  }

  async scope(): Promise<null | QuotaScope> {
    const value = await this.read(SCOPE);
    return value === 'all' || value === 'sandbox' ? value : null;
  }

  async saveScope(scope: QuotaScope): Promise<void> {
    await this.orm.em.fork().upsert(SettingSchema, { key: SCOPE, value: JSON.stringify(scope) });
  }

  async windows(): Promise<Record<string, QuotaWindows>> {
    const value = (await this.read(WINDOWS)) as null | Record<
      string,
      Record<string, { resetsAt: string; utilization: number }>
    >;
    if (!value) return {};
    return Object.fromEntries(
      Object.entries(value).map(([profile, windows]) => [
        profile,
        Object.fromEntries(
          Object.entries(windows).map(([name, window]) => [
            name,
            { resetsAt: new Date(window.resetsAt), utilization: window.utilization },
          ]),
        ) as QuotaWindows,
      ]),
    );
  }

  async saveWindows(windows: Record<string, QuotaWindows>): Promise<void> {
    await this.orm.em.fork().upsert(SettingSchema, { key: WINDOWS, value: JSON.stringify(windows) });
  }
}
