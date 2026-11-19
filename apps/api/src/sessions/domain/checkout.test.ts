import { describe, expect, it } from 'vitest';
import { CheckoutError, type ProjectCheckouts, sandboxStart, workstationTarget, worktreePathOf } from './checkout.ts';

const checkouts: ProjectCheckouts = {
  active: 'main',
  branches: ['develop'],
  worktrees: [
    { branch: 'feat/tarifs', head: 'a1', path: '/home/dev/www/site-clubs/.claude/worktrees/feat-tarifs' },
    { branch: null, head: 'b2', path: '/home/dev/www/site-clubs-review' },
  ],
};

describe('workstationTarget', () => {
  it('works in the project folder without a choice or on the active branch', () => {
    expect(workstationTarget(checkouts, null)).toEqual({ kind: 'root' });
    expect(workstationTarget(checkouts, { kind: 'branch', branch: 'main' })).toEqual({ kind: 'root' });
  });

  it('works in a chosen worktree, or in the worktree where the chosen branch is open', () => {
    const path = '/home/dev/www/site-clubs-review';
    expect(workstationTarget(checkouts, { kind: 'worktree', path })).toEqual({ kind: 'worktree', path });
    expect(workstationTarget(checkouts, { kind: 'branch', branch: 'feat/tarifs' })).toEqual({
      kind: 'worktree',
      path: '/home/dev/www/site-clubs/.claude/worktrees/feat-tarifs',
    });
  });

  it('creates a worktree for another branch instead of switching the project folder', () => {
    expect(workstationTarget(checkouts, { kind: 'branch', branch: 'develop' })).toEqual({
      kind: 'create',
      branch: 'develop',
    });
  });

  it('refuses a branch or a worktree the repository does not have', () => {
    expect(() => workstationTarget(checkouts, { kind: 'branch', branch: 'nope' })).toThrow(CheckoutError);
    expect(() => workstationTarget(checkouts, { kind: 'worktree', path: '/home/dev/elsewhere' })).toThrow(
      CheckoutError,
    );
  });
});

describe('sandboxStart', () => {
  it('starts the copy from the chosen branch, the branch of a worktree, or the commit of a detached one', () => {
    expect(sandboxStart(checkouts, null)).toBeNull();
    expect(sandboxStart(checkouts, { kind: 'branch', branch: 'develop' })).toBe('develop');
    expect(sandboxStart(checkouts, { kind: 'branch', branch: 'feat/tarifs' })).toBe('feat/tarifs');
    expect(
      sandboxStart(checkouts, { kind: 'worktree', path: '/home/dev/www/site-clubs/.claude/worktrees/feat-tarifs' }),
    ).toBe('feat/tarifs');
    expect(sandboxStart(checkouts, { kind: 'worktree', path: '/home/dev/www/site-clubs-review' })).toBe('b2');
  });

  it('refuses a branch the repository does not have', () => {
    expect(() => sandboxStart(checkouts, { kind: 'branch', branch: 'nope' })).toThrow(CheckoutError);
  });
});

describe('worktreePathOf', () => {
  it('places the worktree of a branch under .claude/worktrees, one folder per branch', () => {
    expect(worktreePathOf('/home/dev/www/site-clubs', 'feat/tarifs')).toBe(
      '/home/dev/www/site-clubs/.claude/worktrees/feat-tarifs',
    );
  });
});
