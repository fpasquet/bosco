import type { MikroORM } from '@mikro-orm/sqlite';
import type { HistoryPeriodStore } from '../../application/ports.ts';
import { type HistoryPeriod, historyPeriodOf } from '../../../shared/domain/history-period.ts';
import { SettingSchema } from '../../../shared/infrastructure/persistence/setting.schema.ts';

const KEY = 'sessions.history';

/** Période de l'historique importé, dans la table des réglages du poste. */
export class MikroOrmHistoryPeriodStore implements HistoryPeriodStore {
  constructor(private readonly orm: MikroORM) {}

  async load(): Promise<HistoryPeriod> {
    const row = await this.orm.em.fork().findOne(SettingSchema, { key: KEY });
    return historyPeriodOf(row?.value);
  }

  async save(period: HistoryPeriod): Promise<void> {
    await this.orm.em.fork().upsert(SettingSchema, { key: KEY, value: period });
  }
}
