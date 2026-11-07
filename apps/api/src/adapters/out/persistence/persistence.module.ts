import { MikroORM } from '@mikro-orm/sqlite';
import { Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Config } from '../../../config.ts';
import { CONFIG, ORM } from '../../../tokens.ts';
import { ormConfig } from './orm.config.ts';

@Module({
  providers: [
    {
      provide: ORM,
      inject: [CONFIG],
      // La base vit sur le poste ; les migrations passent à chaque démarrage, avant la première requête
      useFactory: async (config: Config) => {
        mkdirSync(config.dataDir, { recursive: true });
        const orm = await MikroORM.init(ormConfig(join(config.dataDir, 'bosco.db')));
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
