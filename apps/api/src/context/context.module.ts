import type { MikroORM } from '@mikro-orm/sqlite';
import { Module } from '@nestjs/common';
import type { GroupService } from '../projects/application/group.service.ts';
import type { SessionService } from '../sessions/application/session.service.ts';
import { ProjectsModule } from '../projects/projects.module.ts';
import { GROUP_SERVICE } from '../projects/tokens.ts';
import { SessionsModule } from '../sessions/sessions.module.ts';
import { SESSION_SERVICE } from '../sessions/tokens.ts';
import { ORM } from '../shared/tokens.ts';
import { ContextService } from './application/context.service.ts';
import {
  MikroOrmArchitectureStore,
  MikroOrmDecisionRepository,
} from './infrastructure/persistence/context.repositories.ts';
import { ContextController } from './interface/http/context.controller.ts';
import { McpController } from './interface/mcp/mcp.controller.ts';
import { CONTEXT_SERVICE } from './tokens.ts';

const clock = { now: () => new Date() };

/**
 * Contexte des agents : instructions des groupes, décisions et architecture, lus par les sessions par le serveur MCP
 * de Bosco ; les projets et leurs groupes sont ceux que la personne a réglés.
 */
@Module({
  imports: [SessionsModule, ProjectsModule],
  controllers: [ContextController, McpController],
  providers: [
    {
      provide: CONTEXT_SERVICE,
      inject: [ORM, SESSION_SERVICE, GROUP_SERVICE],
      useFactory: (orm: MikroORM, sessions: SessionService, groups: GroupService) =>
        new ContextService(
          new MikroOrmDecisionRepository(orm),
          { instructionsOf: (project) => groups.instructionsOf(project) },
          new MikroOrmArchitectureStore(orm),
          { list: () => sessions.knownProjects() },
          clock,
        ),
    },
  ],
  exports: [CONTEXT_SERVICE],
})
export class ContextModule {}
