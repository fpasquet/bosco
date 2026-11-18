import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/sqlite';
import { DeviceSchema } from './access/infrastructure/persistence/device.schema.ts';
// Point de composition de la persistance : MikroORM sur SQLite, avec les schémas de chaque contexte.
// MikroORM sur SQLite : schémas d'entités dans les adaptateurs, migrations listées explicitement (pas de recherche de
// fichiers, qui dépendrait de l'emplacement de dist/).
import { DecisionSchema, LinkSchema } from './context/infrastructure/persistence/context.schema.ts';
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
import { Migration20261108000000 } from './migrations/Migration20261108000000.ts';
import { Migration20261108010000 } from './migrations/Migration20261108010000.ts';
import { Migration20261108020000 } from './migrations/Migration20261108020000.ts';
import { Migration20261108030000 } from './migrations/Migration20261108030000.ts';
import { Migration20261108040000 } from './migrations/Migration20261108040000.ts';
import { Migration20261108050000 } from './migrations/Migration20261108050000.ts';
import { Migration20261108200000 } from './migrations/Migration20261108200000.ts';
import { Migration20261108210000 } from './migrations/Migration20261108210000.ts';
import { Migration20261116200000 } from './migrations/Migration20261116200000.ts';
import { Migration20261117202824 } from './migrations/Migration20261117202824.ts';
import { Migration20261117220000 } from './migrations/Migration20261117220000.ts';
import { Migration20261117230000 } from './migrations/Migration20261117230000.ts';
import { Migration20261118090000 } from './migrations/Migration20261118090000.ts';
import { Migration20261118100000 } from './migrations/Migration20261118100000.ts';
import { Migration20261118110000 } from './migrations/Migration20261118110000.ts';
import { Migration20261118120000 } from './migrations/Migration20261118120000.ts';
import { Migration20261118130000 } from './migrations/Migration20261118130000.ts';
import { Migration20261118140000 } from './migrations/Migration20261118140000.ts';
import { Migration20261118150000 } from './migrations/Migration20261118150000.ts';
import { Migration20261118160000 } from './migrations/Migration20261118160000.ts';
import { Migration20261118170000 } from './migrations/Migration20261118170000.ts';
import { Migration20261118180000 } from './migrations/Migration20261118180000.ts';
import { Migration20261118190000 } from './migrations/Migration20261118190000.ts';
import {
  GroupProjectSchema,
  IgnoredFolderSchema,
  ProjectGroupSchema,
  ProjectSchema,
} from './projects/infrastructure/persistence/projects.schema.ts';
import { NotificationSchema } from './sessions/infrastructure/persistence/notification.schema.ts';
import { PilotSchema } from './sessions/infrastructure/persistence/pilot.repository.ts';
import { ProfileDefaultsSchema } from './sessions/infrastructure/persistence/profile-defaults.repository.ts';
import {
  SessionEventSchema,
  SessionPullRequestSchema,
  SessionSchema,
  SessionTurnSchema,
  SourceSchema,
  TranscriptCursorSchema,
} from './sessions/infrastructure/persistence/sessions.schema.ts';
import { SocleSchema } from './shared/infrastructure/persistence/retired.schema.ts';
import { EgressRefusalSchema, TaskSchema } from './shared/infrastructure/persistence/set-aside.schema.ts';
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
  { name: 'Migration20261108000000', class: Migration20261108000000 },
  { name: 'Migration20261108010000', class: Migration20261108010000 },
  { name: 'Migration20261108020000', class: Migration20261108020000 },
  { name: 'Migration20261108030000', class: Migration20261108030000 },
  { name: 'Migration20261108040000', class: Migration20261108040000 },
  { name: 'Migration20261108050000', class: Migration20261108050000 },
  { name: 'Migration20261108200000', class: Migration20261108200000 },
  { name: 'Migration20261108210000', class: Migration20261108210000 },
  { name: 'Migration20261116200000', class: Migration20261116200000 },
  { name: 'Migration20261117202824', class: Migration20261117202824 },
  { name: 'Migration20261117220000', class: Migration20261117220000 },
  { name: 'Migration20261117230000', class: Migration20261117230000 },
  { name: 'Migration20261118090000', class: Migration20261118090000 },
  { name: 'Migration20261118100000', class: Migration20261118100000 },
  { name: 'Migration20261118110000', class: Migration20261118110000 },
  { name: 'Migration20261118120000', class: Migration20261118120000 },
  { name: 'Migration20261118130000', class: Migration20261118130000 },
  { name: 'Migration20261118140000', class: Migration20261118140000 },
  { name: 'Migration20261118150000', class: Migration20261118150000 },
  { name: 'Migration20261118160000', class: Migration20261118160000 },
  { name: 'Migration20261118170000', class: Migration20261118170000 },
  { name: 'Migration20261118180000', class: Migration20261118180000 },
  { name: 'Migration20261118190000', class: Migration20261118190000 },
];

export function ormConfig(dbName: string) {
  return defineConfig({
    dbName,
    entities: [
      SettingSchema,
      SourceSchema,
      SessionSchema,
      SessionEventSchema,
      SessionTurnSchema,
      SessionPullRequestSchema,
      TranscriptCursorSchema,
      DeviceSchema,
      TaskSchema,
      EgressRefusalSchema,
      DecisionSchema,
      SocleSchema,
      LinkSchema,
      NotificationSchema,
      PilotSchema,
      ProfileDefaultsSchema,
      ProjectSchema,
      IgnoredFolderSchema,
      ProjectGroupSchema,
      GroupProjectSchema,
    ],
    extensions: [Migrator],
    migrations: { migrationsList: MIGRATIONS, path: 'src/migrations', snapshot: false },
    // L'index FTS5 de la recherche (session_search et ses tables internes) n'est pas une entité : le comparateur de
    // schéma ne sait pas lire ses colonnes sans type
    schemaGenerator: { skipTables: [/^session_search/] },
    allowGlobalContext: false,
  });
}
