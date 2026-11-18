// Ce que les scénarios ne voient pas : chaque règle de rangement d'une session dans son projet, et les dossiers proposés.
import { describe, expect, it } from 'vitest';
import { type GitOrigins, ProjectPlacement } from './placement.ts';
import { activityOf, isProposable } from './suggestions.ts';

const ORIGINS: Record<string, string> = {
  '/home/dev/www/creneaux/.claude/worktrees/fix-ui': '/home/dev/www/creneaux',
  '/home/dev/www/creneaux-hotfix': '/home/dev/www/creneaux',
};
const GIT_ROOTS = ['/home/dev/www/creneaux', '/home/dev/www/essais-css', '/home/dev/www/api-tarifs'];

const git: GitOrigins = {
  originOf: (root) => ORIGINS[root] ?? null,
  rootOf: (path) => GIT_ROOTS.find((root) => path === root || path.startsWith(`${root}/`)) ?? null,
};

const projects = [
  { id: 1, name: 'creneaux', path: '/home/dev/www/creneaux' },
  { id: 2, name: 'api', path: '/home/dev/www/creneaux/packages/api' },
  { id: 3, name: 'notes-clubs', path: '/home/dev/Documents/notes-clubs' },
];

describe('ProjectPlacement', () => {
  const placement = new ProjectPlacement(projects, git);

  it('CA-CONT-116 · files a session in the project that contains its working folder, the deepest first', () => {
    expect(placement.placeOf('/home/dev/www/creneaux', '/home/dev/www/creneaux/apps/web')).toEqual({
      folder: 'apps/web',
      id: 1,
      name: 'creneaux',
      root: '/home/dev/www/creneaux',
    });
    expect(placement.placeOf('/home/dev/www/creneaux', '/home/dev/www/creneaux/packages/api/src')).toMatchObject({
      folder: 'src',
      name: 'api',
    });
    expect(placement.placeOf(null, '/home/dev/Documents/notes-clubs')).toMatchObject({
      folder: '',
      name: 'notes-clubs',
    });
  });

  it('files a worktree with its origin, inside or outside of it', () => {
    const inside = '/home/dev/www/creneaux/.claude/worktrees/fix-ui';
    expect(placement.placeOf(inside, `${inside}/packages/api`)).toMatchObject({ folder: '', name: 'api' });
    expect(placement.placeOf('/home/dev/www/creneaux-hotfix', '/home/dev/www/creneaux-hotfix/apps')).toMatchObject({
      folder: 'apps',
      name: 'creneaux',
    });
  });

  it('files a session that left its git repository with that repository', () => {
    expect(placement.placeOf('/home/dev/www/creneaux', '/home/dev/www')).toMatchObject({
      folder: '',
      name: 'creneaux',
    });
  });

  it('finds the git root of a session read before it was noted', () => {
    expect(placement.placeOf(null, '/home/dev/www/creneaux/apps')).toMatchObject({ name: 'creneaux' });
  });

  it('leaves a session outside of every project without a place', () => {
    expect(placement.placeOf('/home/dev/www/essais-css', '/home/dev/www/essais-css')).toBeNull();
    expect(placement.placeOf(null, '/home/dev')).toBeNull();
    expect(placement.placeOf(null, null)).toBeNull();
  });

  it('files every session outside when there is no project yet', () => {
    expect(new ProjectPlacement([], git).placeOf('/home/dev/www/creneaux', '/home/dev/www/creneaux')).toBeNull();
  });
});

describe('Suggestions', () => {
  const NOW = new Date('2026-11-17T12:00:00Z');
  const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

  it('CA-CONT-122 · CA-CONT-123 · proposes the repository of a session outside the projects, the most active first', () => {
    const placement = new ProjectPlacement([projects[2]!], git);
    const activity = activityOf(
      [
        { gitRoot: '/home/dev/www/essais-css', lastEventAt: daysAgo(9), path: '/home/dev/www/essais-css/src' },
        { gitRoot: null, lastEventAt: daysAgo(1), path: '/home/dev/www/creneaux/apps' },
        { gitRoot: null, lastEventAt: daysAgo(2), path: '/home/dev/www/creneaux' },
        {
          gitRoot: '/home/dev/www/creneaux/.claude/worktrees/fix-ui',
          lastEventAt: daysAgo(3),
          path: '/home/dev/www/creneaux/.claude/worktrees/fix-ui',
        },
        { gitRoot: null, lastEventAt: daysAgo(1), path: '/home/dev/scratch' },
        { gitRoot: null, lastEventAt: daysAgo(1), path: '/home/dev/Documents/notes-clubs' },
      ],
      placement,
      new Set(['/home/dev/scratch']),
      NOW,
    );
    expect(activity.outside).toBe(5);
    expect(activity.projects.get(3)).toEqual({ lastSessionAt: daysAgo(1), sessions: 1 });
    expect(activity.suggestions).toEqual([
      {
        git: true,
        ignored: false,
        lastSessionAt: daysAgo(1),
        name: 'creneaux',
        path: '/home/dev/www/creneaux',
        preselected: true,
        sessions: 3,
      },
      {
        git: false,
        ignored: true,
        lastSessionAt: daysAgo(1),
        name: 'scratch',
        path: '/home/dev/scratch',
        preselected: false,
        sessions: 1,
      },
      {
        git: true,
        ignored: false,
        lastSessionAt: daysAgo(9),
        name: 'essais-css',
        path: '/home/dev/www/essais-css',
        preselected: false,
        sessions: 1,
      },
    ]);
  });

  it('never proposes the home folder itself, nor what is under the temporary or Bosco data folders', () => {
    const unproposed = { below: ['/tmp', '/run/user/1000/tmp', '/home/dev/.local/share/bosco'], home: '/home/dev' };
    expect(isProposable('/home/dev', unproposed)).toBe(false);
    expect(isProposable('/home/dev/notes-clubs', unproposed)).toBe(true);
    expect(isProposable('/tmp', unproposed)).toBe(false);
    expect(isProposable('/run/user/1000/tmp/claude/scratchpad', unproposed)).toBe(false);
    expect(isProposable('/home/dev/.local/share/bosco/sandboxes/c41e9a07', unproposed)).toBe(false);
    expect(isProposable('/home/dev/.local/share/boscoo', unproposed)).toBe(true);
  });

  it('keeps the sessions of the folders not proposed outside of the projects', () => {
    const NOW2 = new Date('2026-11-17T12:00:00Z');
    const activity = activityOf(
      [
        { gitRoot: null, lastEventAt: NOW2, path: '/home/dev' },
        { gitRoot: null, lastEventAt: NOW2, path: '/run/user/1000/tmp/essai' },
        { gitRoot: null, lastEventAt: NOW2, path: '/home/dev/scripts' },
      ],
      new ProjectPlacement([], git),
      new Set(),
      NOW2,
      { below: ['/run/user/1000/tmp'], home: '/home/dev' },
    );
    expect(activity.outside).toBe(3);
    expect(activity.suggestions.map(({ path }) => path)).toEqual(['/home/dev/scripts']);
  });
});
