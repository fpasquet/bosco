import type { MikroORM } from '@mikro-orm/sqlite';
import { Module } from '@nestjs/common';
import type { Config } from '../config.ts';
import { CONFIG, ORM } from '../shared/tokens.ts';
import { DataService } from './application/data.service.ts';
import { DiskDataFolder } from './infrastructure/disk/data-folder.ts';
import { MikroOrmDatabaseEraser } from './infrastructure/persistence/database-eraser.ts';
import { DataController } from './interface/http/data.controller.ts';
import { DATA_SERVICE } from './tokens.ts';

/**
 * Données de Bosco : l'historique importé, la base et la réinitialisation. Les sessions, les projets et les étapes de
 * la réinitialisation sont branchés par le point de composition.
 */
@Module({
  controllers: [DataController],
  providers: [
    {
      provide: DATA_SERVICE,
      inject: [ORM, CONFIG],
      useFactory: (orm: MikroORM, config: Config) =>
        new DataService(new MikroOrmDatabaseEraser(orm), new DiskDataFolder(config.dataDir)),
    },
  ],
  exports: [DATA_SERVICE],
})
export class MaintenanceModule {}
