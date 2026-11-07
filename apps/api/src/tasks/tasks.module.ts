import type { MikroORM } from '@mikro-orm/sqlite';
import { Module } from '@nestjs/common';
import type { SessionService } from '../sessions/application/session.service.ts';
import type { RepositoryCatalog } from './application/ports.ts';
import { SessionsModule } from '../sessions/sessions.module.ts';
import { SESSION_SERVICE } from '../sessions/tokens.ts';
import { ORM } from '../shared/tokens.ts';
import { TaskService } from './application/task.service.ts';
import { DEFAULT_RIGHTS } from './domain/rights.ts';
import { MikroOrmTaskRepository } from './infrastructure/persistence/task.repository.ts';
import { TaskEventsBus } from './infrastructure/task-events.bus.ts';
import { TasksController } from './interface/http/tasks.controller.ts';
import { REPOSITORY_CATALOG, TASK_EVENTS, TASK_SERVICE } from './tokens.ts';

const clock = { now: () => new Date() };

/** Contexte des tâches (RF-TACH) ; les dépôts viennent des sessions, par le point de composition. */
@Module({
  imports: [SessionsModule],
  controllers: [TasksController],
  providers: [
    { provide: TASK_EVENTS, useValue: new TaskEventsBus() },
    {
      provide: REPOSITORY_CATALOG,
      inject: [SESSION_SERVICE],
      useFactory: (sessions: SessionService): RepositoryCatalog => ({
        list: async () => {
          const views = await sessions.listSessions();
          const roots = new Map<string, string>();
          for (const view of views) if (view.repository) roots.set(view.repository.root, view.repository.name);
          return [...roots.entries()]
            .map(([root, name]) => ({ name, root }))
            .toSorted((a, b) => a.name.localeCompare(b.name, 'fr'));
        },
      }),
    },
    {
      provide: TASK_SERVICE,
      inject: [ORM, REPOSITORY_CATALOG, TASK_EVENTS],
      useFactory: (orm: MikroORM, catalog: RepositoryCatalog, bus: TaskEventsBus) =>
        new TaskService(
          new MikroOrmTaskRepository(orm),
          catalog,
          { rightsOf: () => Promise.resolve(DEFAULT_RIGHTS) },
          bus,
          clock,
        ),
    },
  ],
  exports: [TASK_SERVICE],
})
export class TasksModule {}
