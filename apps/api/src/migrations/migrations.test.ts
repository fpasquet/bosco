// Ce que les scénarios ne voient pas : les migrations décrivent exactement le schéma des entités.
import { MikroORM } from '@mikro-orm/sqlite';
import { describe, expect, it } from 'vitest';
import { ormConfig } from '../mikro-orm.config.ts';

describe('migrations', () => {
  it('keep the database schema in line with the entity schemas', async () => {
    const orm = await MikroORM.init(ormConfig(':memory:'));
    await orm.migrator.up();
    const diff = await orm.schema.getUpdateSchemaSQL();
    await orm.close();
    expect(diff.trim()).toBe('');
  });
});
