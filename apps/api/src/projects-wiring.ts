import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { GroupService } from './projects/application/group.service.ts';
import type { ProjectService } from './projects/application/project.service.ts';
import type { SessionService } from './sessions/application/session.service.ts';
import { GROUP_SERVICE, PROJECT_SERVICE } from './projects/tokens.ts';
import { SESSION_SERVICE } from './sessions/tokens.ts';

/**
 * Projets et sessions se croisent : une session se range dans le projet qui contient son dossier de travail, le dépôt
 * git d'une session hors projet devient un projet, les projets proposent les autres dossiers où des sessions ont tourné, gardent le dernier « Où elle tourne » de leurs sessions et
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
        // Une session à plusieurs projets travaille aussi dans les autres projets qu'elle voit
        return sessions.filter(
          ({ addedProjects, pilot, project }) =>
            (project?.id === projectId || addedProjects.some(({ id }) => id === projectId)) &&
            pilot &&
            (pilot.running || pilot.sandbox?.state === 'running'),
        ).length;
      },
    });
    this.sessions.useProjects({
      adopt: async (gitRoot, path) => {
        const adopted = await this.projects.adoptFolders([{ gitRoot, lastEventAt: new Date(), path }]);
        return adopted.map(({ id }) => id);
      },
      list: () =>
        this.projects.listProjects().map(({ defaults, domains, git, id, name, path, place, startBranch }) => ({
          defaults,
          domains,
          git,
          id,
          name,
          place,
          root: path,
          startBranch,
        })),
      // « Tous les projets » n'a que des instructions : il ne règle aucune valeur par défaut
      groups: async () => {
        const groups = await this.groups.listGroups();
        return groups
          .filter(({ system }) => !system)
          .map(({ defaults, id, name, projects }) => ({
            defaults,
            id,
            name,
            projects: projects.map((project) => project.id),
          }));
      },
      folderOf: (gitRoot, path) => this.projects.folderOf(gitRoot, path),
      placeOf: (gitRoot, path) => this.projects.placeOf(gitRoot, path),
      rememberPlace: (root, place) => this.projects.rememberPlace(root, place),
    });
    await this.projects.load();
    await this.groups.load();
  }
}
