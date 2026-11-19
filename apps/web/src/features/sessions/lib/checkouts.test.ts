import { describe, expect, it } from 'vitest';
import type { ProjectCheckoutsDto } from '@bosco/domain';
import type { OptionProject } from './new-session';
import { checkoutChoiceOf, checkoutName, checkoutOptions, workdirOf, workstationHint } from './checkouts';

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
  it('CA-SESS-195 · puts the active branch first, then the worktrees and the branches, each named with its kind', () => {
    expect(checkoutOptions(project, checkouts, false)).toEqual({
      defaultLabel: 'main · branche active',
      worktrees: [{ label: 'feat/tarifs · worktree', value: `worktree:${ROOT}/.claude/worktrees/tarifs` }],
      branches: [{ label: 'develop · branche', value: 'branch:develop' }],
    });
  });

  it('starts a sandbox from the start branch of the project, the active branch staying a choice', () => {
    const options = checkoutOptions({ ...project, startBranch: 'develop' }, checkouts, true);
    expect(options.defaultLabel).toBe('develop · branche de départ du projet');
    expect(options.branches.map(({ label }) => label)).toEqual(['main · branche']);
  });

  it('keeps the active branch by default on the workstation, whatever the start branch of the project', () => {
    expect(checkoutOptions({ ...project, startBranch: 'develop' }, checkouts, false).defaultLabel).toBe(
      'main · branche active',
    );
  });
});

describe('checkoutChoiceOf', () => {
  it('reads a branch, a worktree, or the default', () => {
    expect(checkoutChoiceOf('branch:develop')).toEqual({ kind: 'branch', branch: 'develop' });
    expect(checkoutChoiceOf('worktree:/w/t')).toEqual({ kind: 'worktree', path: '/w/t' });
    expect(checkoutChoiceOf('')).toBeNull();
  });
});

describe('workdirOf and workstationHint', () => {
  it('CA-SESS-196 · works in the project, the chosen worktree, or a new worktree for another branch', () => {
    expect(workdirOf(ROOT, '', checkouts)).toBe(ROOT);
    expect(workdirOf(ROOT, `worktree:${ROOT}/.claude/worktrees/tarifs`, checkouts)).toBe(
      `${ROOT}/.claude/worktrees/tarifs`,
    );
    expect(workdirOf(ROOT, 'branch:feat/new', checkouts)).toBe(`${ROOT}/.claude/worktrees/feat-new`);
    expect(workstationHint('branch:develop', checkouts)).toBe(
      'Bosco crée un worktree pour develop dans .claude/worktrees du projet : ton dossier garde sa branche.',
    );
  });

  it('names the choice for the summary', () => {
    expect(checkoutName('', checkouts)).toBeNull();
    expect(checkoutName(`worktree:${ROOT}/.claude/worktrees/tarifs`, checkouts)).toBe('le worktree feat/tarifs');
    expect(checkoutName('branch:develop', checkouts)).toBe('la branche develop');
  });
});
