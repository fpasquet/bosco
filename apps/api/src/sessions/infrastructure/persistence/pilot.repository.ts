import type { MikroORM } from '@mikro-orm/sqlite';
import { EntitySchema } from '@mikro-orm/core';
import type { PilotRecord, PilotRepository } from '../../application/pilot.service.ts';
import type { PilotSettings } from '../../domain/pilot.ts';

export interface PilotRow {
  cwd: string;
  sessionId: string;
  /** Réglages du dernier message, en JSON */
  settings: PilotSettings;
  since: Date;
  sourceId: string;
}

/** Sessions pilotées par Bosco (E2e) : où elles tournent et leurs réglages, gardés d'un tour à l'autre. */
export const PilotSchema = new EntitySchema<PilotRow>({
  name: 'Pilot',
  tableName: 'pilot',
  properties: {
    sessionId: { type: 'string', fieldName: 'session_id', primary: true },
    sourceId: { type: 'string', fieldName: 'source_id' },
    cwd: { type: 'text' },
    settings: { type: 'json' },
    since: { type: 'datetime' },
  },
});

export class MikroOrmPilotRepository implements PilotRepository {
  constructor(private readonly orm: MikroORM) {}

  async list(): Promise<PilotRecord[]> {
    return this.orm.em.fork().find(PilotSchema, {});
  }

  async save(record: PilotRecord): Promise<void> {
    await this.orm.em.fork().upsert(PilotSchema, { ...record });
  }
}
