// Ce que les scénarios ne voient pas : chaque cas de l'adoption des dépôts, dossiers exclus, ignorés ou disparus compris.
import { describe, expect, it } from 'vitest';
import type { Folders, GitOrigins, IgnoredFolders, ProjectRepository, SessionFolder } from './ports.ts';
import { Project } from '../domain/project.ts';
import { ProjectService } from './project.service.ts';

const HOME = '/home/dev';
const NOW = new Date('2026-11-18T10:00:00');

/** Dépôts git du poste de test ; un worktree pointe vers son dépôt d'origine. */
const REPOS = ['/home/dev/www/creneaux', '/home/dev/www/api-tarifs', '/home/dev/www/creneaux-hotfix'];
const ORIGINS: Record<string, string> = { '/home/dev/www/creneaux-hotfix': '/home/dev/www/creneaux' };
const PLAIN = ['/home/dev/notes', '/home/dev'];

const git: GitOrigins = {
  originOf: (root) => ORIGINS[root] ?? null,
  rootOf: (path) => REPOS.find((root) => path === root || path.startsWith(`${root}/`)) ?? null,
};

function folders(existing: readonly string[] = [...REPOS, ...PLAIN]): Folders {
  return {
    inspect: (path) => Promise.resolve(existing.includes(path) ? { git: REPOS.includes(path) } : null),
    isMonorepo: () => Promise.resolve(false),
    list: () => Promise.resolve([]),
    realPath: (path) => Promise.resolve(path),
  };
}

function setup(sessions: SessionFolder[], options: { existing?: string[]; ignored?: string[] } = {}) {
  const stored = new Map<number, Project>();
  const ignored = new Set(options.ignored ?? []);
  const repository: ProjectRepository = {
    list: () => Promise.resolve([...stored.values()].map((project) => Project.restore(project.toSnapshot()))),
    nextId: () => Promise.resolve(Math.max(0, ...stored.keys()) + 1),
    remove: (id) => Promise.resolve(void stored.delete(id)),
    save: (projects) => Promise.resolve(void projects.forEach((project) => stored.set(project.id, project))),
  };
  const ignoredFolders: IgnoredFolders = {
    ignore: (path) => Promise.resolve(void ignored.add(path)),
    list: () => Promise.resolve([...ignored]),
    restore: (paths) => Promise.resolve(void paths.forEach((path) => ignored.delete(path))),
  };
  const service = new ProjectService(
    repository,
    {
      list: () => Promise.resolve([]),
      nextId: () => Promise.resolve(1),
      remove: () => Promise.resolve(),
      save: () => Promise.resolve(),
    },
    ignoredFolders,
    folders(options.existing),
    git,
    { pending: () => Promise.resolve(null), settle: () => Promise.resolve() },
    { currentOf: () => Promise.resolve(null) },
    { now: () => NOW },
    HOME,
    ['/tmp', '/run/user/1000/tmp', '/home/dev/.local/share/bosco'],
  );
  service.useSessions({ list: () => Promise.resolve(sessions) });
  return { ignored, service };
}

const session = (path: string, gitRoot: null | string = null): SessionFolder => ({
  gitRoot,
  lastEventAt: NOW,
  path,
});

describe('ProjectService adoption', () => {
  it('CA-CONT-180 · makes a project of each git repository of the sessions already read, a worktree with its origin', async () => {
    const { service } = setup([
      session('/home/dev/www/creneaux/apps/web', '/home/dev/www/creneaux'),
      session('/home/dev/www/creneaux-hotfix', '/home/dev/www/creneaux-hotfix'),
      session('/home/dev/www/api-tarifs'),
    ]);
    await service.load();
    expect(service.listProjects().map(({ git, name, path, pinned }) => [name, path, git, pinned])).toEqual([
      ['creneaux', '/home/dev/www/creneaux', true, false],
      ['api-tarifs', '/home/dev/www/api-tarifs', true, false],
    ]);
    const { outside, projects } = await service.overview();
    expect(outside).toBe(0);
    expect(projects.find(({ name }) => name === 'creneaux')?.sessions).toBe(2);
  });

  it('CA-CONT-178 · leaves outside a folder without git, the home folder, a temporary folder, an ignored repository and a removed one', async () => {
    const { service } = setup(
      [
        session('/home/dev/notes'),
        session('/home/dev'),
        session('/run/user/1000/tmp/essai', '/run/user/1000/tmp/essai'),
        session('/home/dev/.local/share/bosco/worktrees/x', '/home/dev/.local/share/bosco/worktrees/x'),
        session('/home/dev/www/api-tarifs'),
        session('/home/dev/www/disparu', '/home/dev/www/disparu'),
      ],
      { ignored: ['/home/dev/www/api-tarifs'] },
    );
    await service.load();
    expect(service.listProjects()).toEqual([]);
    const { suggestions } = await service.overview();
    // Le dossier sans git reste proposé, à ajouter à la main
    expect(suggestions.map(({ path }) => path)).toEqual(['/home/dev/notes']);
  });

  it('CA-CONT-177 · adopts the repository of a new session once, even when two sessions arrive together', async () => {
    const { service } = setup([]);
    await service.load();
    const [first, second] = await Promise.all([
      service.adoptFolders([session('/home/dev/www/api-tarifs/src')]),
      service.adoptFolders([session('/home/dev/www/api-tarifs')]),
    ]);
    expect(first.map(({ name }) => name)).toEqual(['api-tarifs']);
    expect(second).toEqual([]);
    expect(service.placeOf(null, '/home/dev/www/api-tarifs/src')?.name).toBe('api-tarifs');
  });

  it('CA-CONT-179 · ignores the folder of a removed project, and adopts it again once it is no longer ignored', async () => {
    const { ignored, service } = setup([session('/home/dev/www/api-tarifs')]);
    await service.load();
    const [project] = service.listProjects();
    await service.removeProject(project?.id ?? 0);
    expect([...ignored]).toEqual(['/home/dev/www/api-tarifs']);
    const again = await service.adoptFolders([session('/home/dev/www/api-tarifs')]);
    expect(again).toEqual([]);
    const { ignored: shown } = await service.overview();
    expect(shown.map(({ path }) => path)).toEqual(['/home/dev/www/api-tarifs']);
    await service.restoreSuggestion('/home/dev/www/api-tarifs');
    expect(service.listProjects().map(({ name }) => name)).toEqual(['api-tarifs']);
  });

  it('CA-SESS-190 · gives the folder of a session outside projects, a temporary folder counting as one', () => {
    const { service } = setup([]);
    expect(service.folderOf(null, '/home/dev/notes/brouillons')).toBe('/home/dev/notes/brouillons');
    expect(service.folderOf('/home/dev/www/creneaux-hotfix', '/home/dev/www/creneaux-hotfix')).toBe(
      '/home/dev/www/creneaux',
    );
    expect(service.folderOf(null, '/run/user/1000/tmp/essai-1')).toBe('/run/user/1000/tmp');
  });
});
