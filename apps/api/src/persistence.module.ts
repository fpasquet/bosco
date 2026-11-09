import { MikroORM } from '@mikro-orm/sqlite';
import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Config } from './config.ts';
import { MIGRATIONS, ormConfig } from './mikro-orm.config.ts';
import { DatabaseTooNewError, newerMigrations } from './shared/infrastructure/persistence/database-version.ts';
import { CONFIG, ORM } from './shared/tokens.ts';

/** Base du poste, partagée par tous les contextes : ils la reçoivent par le jeton ORM. */
@Global()
@Module({
  providers: [
    {
      provide: ORM,
      inject: [CONFIG],
      // La base vit sur le poste ; les migrations passent à chaque démarrage, avant la première requête
      useFactory: async (config: Config) => {
        mkdirSync(config.dataDir, { recursive: true });
        const file = join(config.dataDir, 'bosco.db');
        const orm = await MikroORM.init(ormConfig(file));
        // Une base migrée par un Bosco plus récent n'est jamais touchée par celui-ci (CA-APPS-10)
        const executed = await orm.migrator.getExecuted();
        const newer = newerMigrations(
          executed.map((row) => row.name),
          MIGRATIONS.map((migration) => migration.name),
        );
        if (newer.length > 0) {
          await orm.close();
          throw new DatabaseTooNewError(file, newer);
        }
        await orm.migrator.up();
        return orm;
      },
    },
  ],
  exports: [ORM],
})
export class PersistenceModule implements OnApplicationShutdown {
  constructor(@Inject(ORM) private readonly orm: MikroORM) {}

  async onApplicationShutdown(): Promise<void> {
    await this.orm.close();
  }
}
