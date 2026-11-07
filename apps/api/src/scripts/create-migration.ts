import { MikroORM } from '@mikro-orm/sqlite';
// pnpm --filter @bosco/api db:migration : écrit la migration qui amène la base au schéma des entités.
// La migration créée s'ajoute ensuite à MIGRATIONS (orm.config.ts), puis se relit avant d'être commitée.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ormConfig } from '../mikro-orm.config.ts';

const dir = mkdtempSync(join(tmpdir(), 'bosco-migration-'));
const orm = await MikroORM.init(ormConfig(join(dir, 'schema.db')));
await orm.migrator.up();
const result = await orm.migrator.create();
await orm.close();
rmSync(dir, { recursive: true, force: true });
console.log(
  result.fileName ? `created ${result.fileName}: add it to MIGRATIONS in orm.config.ts` : 'schema already up to date',
);
