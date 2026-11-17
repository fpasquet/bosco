import type { MikroORM } from '@mikro-orm/sqlite';
import { EntitySchema } from '@mikro-orm/core';
import type { PilotRecord, PilotRepository } from '../../application/pilot.service.ts';
import type { PilotSettings } from '../../domain/pilot.ts';
import type { SandboxInfo } from '../../domain/sandbox.ts';

/** Bac à sable tel qu'il est gardé en JSON : ses dates en texte */
type StoredSandbox = Record<keyof SandboxInfo, null | string>;

export interface PilotRow {
  cwd: string;
  /** Bac à sable de la session (DT-37), en JSON ; null : elle tourne sur le poste */
  sandbox: null | StoredSandbox;
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
    sandbox: { type: 'json', nullable: true },
    settings: { type: 'json' },
    since: { type: 'datetime' },
  },
});

export class MikroOrmPilotRepository implements PilotRepository {
  constructor(private readonly orm: MikroORM) {}

  async list(): Promise<PilotRecord[]> {
    const rows = await this.orm.em.fork().find(PilotSchema, {});
    return rows.map((row) => ({ ...row, sandbox: row.sandbox ? sandboxOf(row.sandbox) : null }));
  }

  async save(record: PilotRecord): Promise<void> {
    const sandbox = record.sandbox ? (JSON.parse(JSON.stringify(record.sandbox)) as StoredSandbox) : null;
    await this.orm.em.fork().upsert(PilotSchema, { ...record, sandbox });
  }
}

function date(value: null | string): Date | null {
  return value ? new Date(value) : null;
}

function sandboxOf(stored: StoredSandbox): SandboxInfo {
  return {
    base: stored.base ?? '',
    branch: stored.branch ?? '',
    from: stored.from ?? '',
    lastMessageAt: date(stored.lastMessageAt) ?? new Date(0),
    profile: stored.profile ?? '',
    removedAt: date(stored.removedAt),
    retrievedAt: date(stored.retrievedAt),
    warnedAt: date(stored.warnedAt),
  };
}
