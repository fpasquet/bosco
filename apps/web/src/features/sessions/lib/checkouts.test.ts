import { describe, expect, it } from 'vitest';
import type { ProjectCheckoutsDto } from '@bosco/domain';
import type { OptionProject } from './new-session';
import {
  checkoutChoiceOf,
  checkoutName,
  checkoutOptions,
  sandboxHint,
  uncopied,
  workdirOf,
  workstationHint,
} from './checkouts';

const ROOT = '/home/camille/www/site-clubs';

const project: OptionProject = {
  branch: 'main',
  changes: 0,
  domains: [],
  git: true,
  id: 1,
  name: 'site-clubs',
  place: null,
  root: ROOT,
  startBranch: null,
};

const checkouts: ProjectCheckoutsDto = {
  active: 'main',
  branches: ['develop'],
  worktrees: [{ branch: 'feat/tarifs', path: `${ROOT}/.claude/worktrees/tarifs` }],
};

describe('checkoutOptions', () => {
  it('CA-SESS-195 · puts the active branch first with its badge, then the worktrees and the branches', () => {
    expect(checkoutOptions(project, checkouts, false)).toEqual({
      default: { badge: 'active', label: 'main', value: 'default' },
      worktrees: [
        { hint: '.claude/worktrees/tarifs', label: 'feat/tarifs', value: `worktree:${ROOT}/.claude/worktrees/tarifs` },
      ],
      branches: [{ label: 'develop', value: 'branch:develop' }],
    });
  });

  it('starts a sandbox from the start branch of the project, the active branch staying a choice', () => {
    const options = checkoutOptions({ ...project, startBranch: 'develop' }, checkouts, true);
    expect(options.default).toEqual({ badge: 'départ du projet', label: 'develop', value: 'default' });
    expect(options.branches).toEqual([{ badge: 'active', label: 'main', value: 'branch:main' }]);
  });

  it('keeps the active branch by default on the workstation, whatever the start branch of the project', () => {
    expect(checkoutOptions({ ...project, startBranch: 'develop' }, checkouts, false).default.label).toBe('main');
  });

  it('writes the folder of a worktree outside the project in full', () => {
    const outside = { ...checkouts, worktrees: [{ branch: null, path: '/home/camille/www/review' }] };
    expect(checkoutOptions(project, outside, false).worktrees).toEqual([
      { hint: '/home/camille/www/review', label: 'détaché', value: 'worktree:/home/camille/www/review' },
    ]);
  });
});

describe('checkoutChoiceOf', () => {
  it('reads a branch, a worktree, or the default', () => {
    expect(checkoutChoiceOf('branch:develop')).toEqual({ kind: 'branch', branch: 'develop' });
    expect(checkoutChoiceOf('worktree:/w/t')).toEqual({ kind: 'worktree', path: '/w/t' });
    expect(checkoutChoiceOf('default')).toBeNull();
  });
});

describe('workdirOf and workstationHint', () => {
  it('CA-SESS-196 · works in the project, the chosen worktree, or a new worktree for another branch', () => {
    expect(workdirOf(ROOT, 'default', checkouts)).toBe(ROOT);
    expect(workdirOf(ROOT, `worktree:${ROOT}/.claude/worktrees/tarifs`, checkouts)).toBe(
      `${ROOT}/.claude/worktrees/tarifs`,
    );
    expect(workdirOf(ROOT, 'branch:feat/new', checkouts)).toBe(`${ROOT}/.claude/worktrees/feat-new`);
    expect(workstationHint('branch:develop', checkouts)).toBe(
      'Bosco crée un worktree pour develop dans .claude/worktrees du projet : ton dossier garde sa branche.',
    );
  });

  it('names the choice for the summary', () => {
    expect(checkoutName('default', checkouts)).toBeNull();
    expect(checkoutName(`worktree:${ROOT}/.claude/worktrees/tarifs`, checkouts)).toBe('le worktree feat/tarifs');
    expect(checkoutName('branch:develop', checkouts)).toBe('la branche develop');
  });
});

describe('sandboxHint', () => {
  it('CA-SESS-197 · says where the copy starts, and how many changed files it leaves, as for several projects', () => {
    const options = checkoutOptions(project, checkouts, true);
    expect(sandboxHint('default', checkouts, options, 2)).toBe(
      'Copie de main telle qu’enregistrée : 2 fichiers modifiés du poste non copiés.',
    );
    expect(sandboxHint('branch:develop', checkouts, options, 0)).toBe(
      'Copie de develop telle qu’enregistrée : aucun fichier modifié sur le poste.',
    );
    expect(sandboxHint(`worktree:${ROOT}/.claude/worktrees/tarifs`, checkouts, options, 2)).toBe(
      'Copie de feat/tarifs, la branche du worktree, telle qu’enregistrée : ses fichiers modifiés ne sont pas copiés.',
    );
    expect(uncopied(1)).toBe('1 fichier modifié du poste non copié');
    expect(uncopied(null)).toBeNull();
  });
});
