import type { MikroORM } from '@mikro-orm/sqlite';
import { Module } from '@nestjs/common';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Config } from '../config.ts';
import { CONFIG, ORM } from '../shared/tokens.ts';
import { GroupService } from './application/group.service.ts';
import { ProjectService } from './application/project.service.ts';
import { DiskFolders } from './infrastructure/fs/disk-folders.ts';
import { GitWorktreeOrigins } from './infrastructure/git/worktree-origins.ts';
import {
  MikroOrmDiscoveryToImport,
  MikroOrmGroupRepository,
  MikroOrmIgnoredFolders,
  MikroOrmProjectRepository,
  MikroOrmSoclesToImport,
} from './infrastructure/persistence/projects.repositories.ts';
import { FoldersController } from './interface/http/folders.controller.ts';
import { GroupsController } from './interface/http/groups.controller.ts';
import { ProjectsController } from './interface/http/projects.controller.ts';
import { GROUP_SERVICE, PROJECT_SERVICE } from './tokens.ts';

/**
 * Contexte des projets : les dossiers que la personne ajoute, où se rangent les sessions, les groupes qui les réunissent,
 * les dossiers proposés d'après les sessions et le navigateur de dossiers. Les sessions déjà lues sont branchées par le point de composition.
 */
@Module({
  controllers: [ProjectsController, FoldersController, GroupsController],
  providers: [
    {
      provide: PROJECT_SERVICE,
      inject: [ORM, CONFIG],
      useFactory: (orm: MikroORM, config: Config) =>
        new ProjectService(
          new MikroOrmProjectRepository(orm),
          new MikroOrmGroupRepository(orm),
          new MikroOrmIgnoredFolders(orm),
          new DiskFolders(),
          new GitWorktreeOrigins(),
          new MikroOrmDiscoveryToImport(orm),
          { now: () => new Date() },
          config.profilesRoot,
          // Dossiers temporaires et données de Bosco : des copies et des essais, jamais des projets à proposer
          ['/tmp', tmpdir(), config.dataDir, join(config.profilesRoot, '.local', 'share', 'bosco')],
        ),
    },
    {
      provide: GROUP_SERVICE,
      inject: [ORM, PROJECT_SERVICE],
      useFactory: (orm: MikroORM, projects: ProjectService) =>
        new GroupService(new MikroOrmGroupRepository(orm), projects, new MikroOrmSoclesToImport(orm)),
    },
  ],
  exports: [PROJECT_SERVICE, GROUP_SERVICE],
})
export class ProjectsModule {}
