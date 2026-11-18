import type { MikroORM } from '@mikro-orm/sqlite';
import { Module } from '@nestjs/common';
import type { GroupService } from '../projects/application/group.service.ts';
import type { NotificationService } from '../sessions/application/notification.service.ts';
import type { PilotService } from '../sessions/application/pilot.service.ts';
import type { SessionService } from '../sessions/application/session.service.ts';
import { ProjectsModule } from '../projects/projects.module.ts';
import { GROUP_SERVICE } from '../projects/tokens.ts';
import { SessionsModule } from '../sessions/sessions.module.ts';
import { NOTIFICATION_SERVICE, PILOT_SERVICE, SESSION_SERVICE } from '../sessions/tokens.ts';
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

const capitalized = (text: string) => text.charAt(0).toLocaleUpperCase('fr') + text.slice(1);

/**
 * Contexte des agents : instructions des groupes, décisions et architecture, lus par les sessions par le serveur MCP
 * de Bosco ou dès le premier tour d'une session pilotée ; les projets et leurs groupes sont ceux que la personne a réglés.
 */
@Module({
  imports: [SessionsModule, ProjectsModule],
  controllers: [ContextController, McpController],
  providers: [
    {
      provide: CONTEXT_SERVICE,
      inject: [ORM, SESSION_SERVICE, GROUP_SERVICE, NOTIFICATION_SERVICE, PILOT_SERVICE],
      useFactory: (
        orm: MikroORM,
        sessions: SessionService,
        groups: GroupService,
        notifications: NotificationService,
        pilot: PilotService,
      ) => {
        const context = new ContextService(
          new MikroOrmDecisionRepository(orm),
          { instructionsOf: (project) => groups.instructionsOf(project) },
          new MikroOrmArchitectureStore(orm),
          { list: () => sessions.knownProjects() },
          clock,
          { latestIn: (path) => sessions.latestIn(path) },
        );
        // Une décision proposée arrive en notification ; validée ou refusée, elle sort de « À traiter »
        context.useAlerts({
          proposed: async (decision) => {
            const version = decision.versions[0];
            await notifications.notify(
              { kind: 'decision' },
              {
                decisionId: decision.id,
                excerpt: version ? `${capitalized(version.author)} la propose ; elle attend ta validation.` : null,
                place: decision.target.name,
                sessionId: version?.session?.id ?? null,
                taskId: null,
                title: version?.title ?? `DEC-${decision.id}`,
              },
            );
          },
          settled: (decision, note) => notifications.settle({ decisionId: decision.id, kinds: ['decision'] }, note),
        });
        // Une session pilotée reçoit le contexte de ses projets dès son premier tour, même sans le serveur MCP
        pilot.useContext({ textOf: (cwd, projects) => context.sessionContext(cwd, [...projects]) });
        return context;
      },
    },
  ],
  exports: [CONTEXT_SERVICE],
})
export class ContextModule {}
