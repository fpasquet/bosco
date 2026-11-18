import type { MikroORM } from '@mikro-orm/sqlite';
import { EntitySchema } from '@mikro-orm/core';
import type { ProfileDefaultsRepository } from '../../application/ports.ts';
import {
  effortOf,
  NO_DEFAULTS,
  permissionModeOf,
  type SessionDefaults,
} from '../../../shared/domain/session-settings.ts';

export interface ProfileDefaultsRow {
  effort: null | string;
  model: null | string;
  permissionMode: null | string;
  sourceId: string;
}

/** Valeurs par défaut des sessions lancées dans Bosco avec un profil (E4g) ; sans ligne, celles du profil Claude Code. */
export const ProfileDefaultsSchema = new EntitySchema<ProfileDefaultsRow>({
  name: 'ProfileDefaults',
  tableName: 'profile_defaults',
  properties: {
    sourceId: { type: 'string', fieldName: 'source_id', primary: true },
    permissionMode: { type: 'string', nullable: true, fieldName: 'permission_mode' },
    model: { type: 'string', nullable: true },
    effort: { type: 'string', nullable: true },
  },
});

export class MikroOrmProfileDefaultsRepository implements ProfileDefaultsRepository {
  constructor(private readonly orm: MikroORM) {}

  async find(sourceId: string): Promise<SessionDefaults> {
    const row = await this.orm.em.fork().findOne(ProfileDefaultsSchema, { sourceId });
    if (!row) return NO_DEFAULTS;
    return { effort: effortOf(row.effort), model: row.model, permissionMode: permissionModeOf(row.permissionMode) };
  }

  async save(sourceId: string, defaults: SessionDefaults): Promise<void> {
    await this.orm.em.fork().upsert(ProfileDefaultsSchema, { sourceId, ...defaults });
  }
}
