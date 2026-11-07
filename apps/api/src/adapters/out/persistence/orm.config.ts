// MikroORM sur SQLite : schémas d'entités dans les adaptateurs, migrations listées explicitement (pas de recherche de
// fichiers, qui dépendrait de l'emplacement de dist/).
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/sqlite';
import { Migration20261107000000 } from './migrations/Migration20261107000000.ts';
import { SettingSchema } from './setting.schema.ts';

export const MIGRATIONS = [{ name: 'Migration20261107000000', class: Migration20261107000000 }];

export function ormConfig(dbName: string) {
  return defineConfig({
    dbName,
    entities: [SettingSchema],
    extensions: [Migrator],
    migrations: { migrationsList: MIGRATIONS, path: 'src/adapters/out/persistence/migrations', snapshot: false },
    allowGlobalContext: false,
  });
}
