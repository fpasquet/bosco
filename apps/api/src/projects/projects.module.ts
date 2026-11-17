import type { MikroORM } from '@mikro-orm/sqlite';
import { Module } from '@nestjs/common';
import type { Config } from '../config.ts';
import { CONFIG, ORM } from '../shared/tokens.ts';
import { ProjectService } from './application/project.service.ts';
import { DiskFolders } from './infrastructure/fs/disk-folders.ts';
import { GitWorktreeOrigins } from './infrastructure/git/worktree-origins.ts';
import {
  MikroOrmDiscoveryToImport,
  MikroOrmIgnoredFolders,
  MikroOrmProjectRepository,
} from './infrastructure/persistence/projects.repositories.ts';
import { ProjectsController } from './interface/http/projects.controller.ts';
import { PROJECT_SERVICE } from './tokens.ts';

/**
 * Contexte des projets : les dossiers que la personne ajoute, où se rangent les sessions, les dossiers proposés
 * d'après les sessions. Les sessions déjà lues sont branchées par le point de composition.
 */
@Module({
  controllers: [ProjectsController],
  providers: [
    {
      provide: PROJECT_SERVICE,
      inject: [ORM, CONFIG],
      useFactory: (orm: MikroORM, config: Config) =>
        new ProjectService(
          new MikroOrmProjectRepository(orm),
          new MikroOrmIgnoredFolders(orm),
          new DiskFolders(),
          new GitWorktreeOrigins(),
          new MikroOrmDiscoveryToImport(orm),
          { now: () => new Date() },
          config.profilesRoot,
        ),
    },
  ],
  exports: [PROJECT_SERVICE],
})
export class ProjectsModule {}
