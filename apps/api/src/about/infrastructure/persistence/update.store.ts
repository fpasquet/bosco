import type { MikroORM } from '@mikro-orm/sqlite';
import { z } from 'zod';
import type { UpdateState, UpdateStore } from '../../application/ports.ts';
import { SettingSchema } from '../../../shared/infrastructure/persistence/setting.schema.ts';

const KEY = 'about.updates';

const releaseSchema = z.object({
  version: z.string(),
  prerelease: z.boolean(),
  publishedAt: z.coerce.date(),
  notes: z.string(),
  url: z.string(),
  assets: z.array(z.object({ name: z.string(), url: z.string() })),
});

const stateSchema = z.object({
  enabled: z.boolean().catch(true),
  channel: z.enum(['beta', 'stable']).nullable().catch(null),
  checkedAt: z.coerce.date().nullable().catch(null),
  latest: releaseSchema.nullable().catch(null),
  error: z.string().nullable().catch(null),
  lastRunVersion: z.string().nullable().catch(null),
  installedNotice: z.string().nullable().catch(null),
  dismissed: z.string().nullable().catch(null),
});

const EMPTY: UpdateState = {
  enabled: true,
  channel: null,
  checkedAt: null,
  latest: null,
  error: null,
  lastRunVersion: null,
  installedNotice: null,
  dismissed: null,
};

/** État des mises à jour, en JSON dans la table des réglages du poste ; illisible, il repart de zéro. */
export class MikroOrmUpdateStore implements UpdateStore {
  constructor(private readonly orm: MikroORM) {}

  async load(): Promise<UpdateState> {
    const row = await this.orm.em.fork().findOne(SettingSchema, { key: KEY });
    if (!row) return { ...EMPTY };
    try {
      const parsed = stateSchema.safeParse(JSON.parse(row.value));
      return parsed.success ? parsed.data : { ...EMPTY };
    } catch {
      return { ...EMPTY };
    }
  }

  async save(state: UpdateState): Promise<void> {
    await this.orm.em.fork().upsert(SettingSchema, { key: KEY, value: JSON.stringify(state) });
  }
}
