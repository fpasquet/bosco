import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { GroupService } from './projects/application/group.service.ts';
import type { ProjectService } from './projects/application/project.service.ts';
import type { SessionService } from './sessions/application/session.service.ts';
import { GROUP_SERVICE, PROJECT_SERVICE } from './projects/tokens.ts';
import { SESSION_SERVICE } from './sessions/tokens.ts';

/**
 * Projets et sessions se croisent : une session se range dans le projet qui contient son dossier de travail, les
 * projets proposent les dossiers où des sessions ont tourné, gardent le dernier « Où elle tourne » de leurs sessions et
 * ne se retirent pas tant qu'une session pilotée y tourne. Branchés avant que les sources ne soient relues.
 */
@Injectable()
export class ProjectsWiring implements OnModuleInit {
  constructor(
    @Inject(PROJECT_SERVICE) private readonly projects: ProjectService,
    @Inject(GROUP_SERVICE) private readonly groups: GroupService,
    @Inject(SESSION_SERVICE) private readonly sessions: SessionService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.projects.useSessions({ list: () => this.sessions.sessionFolders() });
    this.projects.useRunning({
      countIn: async (projectId) => {
        const sessions = await this.sessions.listSessions();
        return sessions.filter(
          ({ pilot, project }) =>
            project?.id === projectId && pilot && (pilot.running || pilot.sandbox?.state === 'running'),
        ).length;
      },
    });
    this.sessions.useProjects({
      list: () =>
        this.projects
          .listProjects()
          .map(({ git, id, name, path, place, startBranch }) => ({ git, id, name, place, root: path, startBranch })),
      placeOf: (gitRoot, path) => this.projects.placeOf(gitRoot, path),
      rememberPlace: (root, place) => this.projects.rememberPlace(root, place),
    });
    await this.projects.load();
    await this.groups.load();
  }
}
