import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { ProjectService } from './projects/application/project.service.ts';
import type { SessionService } from './sessions/application/session.service.ts';
import { PROJECT_SERVICE } from './projects/tokens.ts';
import { SESSION_SERVICE } from './sessions/tokens.ts';

/**
 * Projets et sessions se croisent : une session se range dans le projet qui contient son dossier de travail, et les
 * projets proposent les dossiers où des sessions ont tourné. Branchés avant que les sources ne soient relues.
 */
@Injectable()
export class ProjectsWiring implements OnModuleInit {
  constructor(
    @Inject(PROJECT_SERVICE) private readonly projects: ProjectService,
    @Inject(SESSION_SERVICE) private readonly sessions: SessionService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.projects.useSessions({ list: () => this.sessions.sessionFolders() });
    this.sessions.useProjects({
      list: () => this.projects.listProjects().map(({ git, name, path }) => ({ git, name, root: path })),
      placeOf: (gitRoot, path) => this.projects.placeOf(gitRoot, path),
    });
    await this.projects.load();
  }
}
