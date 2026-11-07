import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/sqlite';
// Point de composition de la persistance : MikroORM sur SQLite, avec les schémas de chaque contexte.
// MikroORM sur SQLite : schémas d'entités dans les adaptateurs, migrations listées explicitement (pas de recherche de
// fichiers, qui dépendrait de l'emplacement de dist/).
import { DeviceSchema } from './access/infrastructure/persistence/device.schema.ts';
import { Migration20261107000000 } from './migrations/Migration20261107000000.ts';
import { Migration20261107165031 } from './migrations/Migration20261107165031.ts';
import { Migration20261107172330 } from './migrations/Migration20261107172330.ts';
import { Migration20261107174017 } from './migrations/Migration20261107174017.ts';
import { Migration20261107190000 } from './migrations/Migration20261107190000.ts';
import { Migration20261107200000 } from './migrations/Migration20261107200000.ts';
import { Migration20261107203000 } from './migrations/Migration20261107203000.ts';
import { Migration20261107210000 } from './migrations/Migration20261107210000.ts';
import { Migration20261107230000 } from './migrations/Migration20261107230000.ts';
import { Migration20261107233000 } from './migrations/Migration20261107233000.ts';
import {
  SessionEventSchema,
  SessionSchema,
  SourceSchema,
  TranscriptCursorSchema,
} from './sessions/infrastructure/persistence/sessions.schema.ts';
import { SettingSchema } from './shared/infrastructure/persistence/setting.schema.ts';

export const MIGRATIONS = [
  { name: 'Migration20261107000000', class: Migration20261107000000 },
  { name: 'Migration20261107165031', class: Migration20261107165031 },
  { name: 'Migration20261107172330', class: Migration20261107172330 },
  { name: 'Migration20261107174017', class: Migration20261107174017 },
  { name: 'Migration20261107190000', class: Migration20261107190000 },
  { name: 'Migration20261107200000', class: Migration20261107200000 },
  { name: 'Migration20261107203000', class: Migration20261107203000 },
  { name: 'Migration20261107210000', class: Migration20261107210000 },
  { name: 'Migration20261107230000', class: Migration20261107230000 },
  { name: 'Migration20261107233000', class: Migration20261107233000 },
];

export function ormConfig(dbName: string) {
  return defineConfig({
    dbName,
    entities: [SettingSchema, SourceSchema, SessionSchema, SessionEventSchema, TranscriptCursorSchema, DeviceSchema],
    extensions: [Migrator],
    migrations: { migrationsList: MIGRATIONS, path: 'src/migrations', snapshot: false },
    // L'index FTS5 de la recherche (session_search et ses tables internes) n'est pas une entité : le comparateur de
    // schéma ne sait pas lire ses colonnes sans type
    schemaGenerator: { skipTables: [/^session_search/] },
    allowGlobalContext: false,
  });
}
