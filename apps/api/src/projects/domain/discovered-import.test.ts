// Ce que les scénarios ne voient pas : la reprise des dépôts découverts au passage aux projets choisis, selon les
// réglages que le poste avait gardés.
import { describe, expect, it } from 'vitest';
import type { GitOrigins, SessionFolder } from './placement.ts';
import { importDiscovered } from './discovered-import.ts';

const HOME = '/home/dev';
const git: GitOrigins = {
  originOf: (root) => (root === '/home/dev/www/labo-ia/.claude/worktrees/fix-ui' ? '/home/dev/www/labo-ia' : null),
  rootOf: () => null,
};
const at = (minutes: number) => new Date(Date.UTC(2026, 10, 17, 10, minutes));

const sessions: SessionFolder[] = [
  { gitRoot: '/home/dev/www/api-voix', lastEventAt: at(5), path: '/home/dev/www/api-voix' },
  { gitRoot: '/home/dev/www/labo-ia', lastEventAt: at(1), path: '/home/dev/www/labo-ia/packages/rag' },
  {
    gitRoot: '/home/dev/www/labo-ia/.claude/worktrees/fix-ui',
    lastEventAt: at(9),
    path: '/home/dev/www/labo-ia/.claude/worktrees/fix-ui',
  },
  { gitRoot: null, lastEventAt: at(30), path: '/home/dev/notes' },
  { gitRoot: '/home/dev/archives/vieux', lastEventAt: at(2), path: '/home/dev/archives/vieux' },
];

describe('Import of the discovered repositories', () => {
  it('turns every repository shown by default into a project, the most recent first, a worktree with its origin', () => {
    expect(importDiscovered(null, sessions, HOME, git)).toEqual({
      ignored: [],
      projects: [
        { git: true, path: '/home/dev/www/labo-ia' },
        { git: true, path: '/home/dev/www/api-voix' },
        { git: true, path: '/home/dev/archives/vieux' },
      ],
    });
  });

  it('keeps the folders, exclusions and hidden repositories of the workstation; hidden ones become ignored', () => {
    const found = importDiscovered(
      { excluded: ['~/archives'], hidden: ['/home/dev/www/api-voix'], roots: ['~/www', '~/archives'] },
      sessions,
      HOME,
      git,
    );
    expect(found).toEqual({
      ignored: ['/home/dev/www/api-voix'],
      projects: [{ git: true, path: '/home/dev/www/labo-ia' }],
    });
  });

  it('turns the working folder outside git into a project when git only was off', () => {
    const found = importDiscovered({ attachWorktrees: false, gitOnly: false }, sessions, HOME, git);
    expect(found.projects).toEqual([
      { git: false, path: '/home/dev/notes' },
      { git: true, path: '/home/dev/www/labo-ia/.claude/worktrees/fix-ui' },
      { git: true, path: '/home/dev/www/api-voix' },
      { git: true, path: '/home/dev/archives/vieux' },
      { git: true, path: '/home/dev/www/labo-ia' },
    ]);
  });
});
