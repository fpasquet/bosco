import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GitCheckouts, parseWorktrees } from './git-checkouts.ts';

const GIT = '/usr/bin/git';
const git = (cwd: string, ...args: string[]) =>
  execFileSync(GIT, ['-c', 'user.name=dev', '-c', 'user.email=dev@example.com', ...args], { cwd, stdio: 'pipe' });

describe('GitCheckouts', () => {
  let home: string;
  let root: string;

  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), 'bosco-checkouts-'));
    root = join(home, 'site-clubs');
    execFileSync(GIT, ['init', '--quiet', '--initial-branch=main', root]);
    writeFileSync(join(root, 'README.md'), 'clubs\n');
    git(root, 'add', '.');
    git(root, 'commit', '--quiet', '-m', 'init');
    git(root, 'branch', 'develop');
    git(root, 'branch', 'feat/tarifs');
    git(root, 'worktree', 'add', '--quiet', join(home, 'site-clubs-review'), 'feat/tarifs');
  });

  afterEach(() => rmSync(home, { recursive: true, force: true }));

  it('lists the active branch, the other worktrees and the branches open nowhere', async () => {
    const checkouts = await new GitCheckouts().list(root);
    expect(checkouts.active).toBe('main');
    expect(checkouts.branches).toEqual(['develop']);
    expect(checkouts.worktrees).toEqual([
      expect.objectContaining({ branch: 'feat/tarifs', path: join(home, 'site-clubs-review') }),
    ]);
  });

  it('adds a worktree for a branch under .claude/worktrees, kept out of the status of the repository', async () => {
    const path = await new GitCheckouts().addWorktree(root, 'develop');
    expect(path).toBe(join(root, '.claude', 'worktrees', 'develop'));
    expect(execFileSync(GIT, ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: path }).toString().trim()).toBe('develop');
    expect(readFileSync(join(root, '.git', 'info', 'exclude'), 'utf8')).toContain('/.claude/worktrees/\n');
    expect(execFileSync(GIT, ['status', '--porcelain'], { cwd: root }).toString()).toBe('');
    const again = await new GitCheckouts().list(root);
    expect(again.branches).toEqual([]);
  });

  it('reads nothing outside git', async () => {
    const checkouts = await new GitCheckouts().list(home);
    expect(checkouts).toEqual({ active: null, branches: [], worktrees: [] });
  });
});

describe('parseWorktrees', () => {
  it('reads the branch, the commit and the folder of each worktree, detached ones and no bare repository', () => {
    const porcelain = [
      'worktree /repo.git\nbare',
      'worktree /home/dev/site\nHEAD a1\nbranch refs/heads/main',
      'worktree /home/dev/site-review\nHEAD b2\ndetached',
    ].join('\n\n');
    expect(parseWorktrees(porcelain)).toEqual([
      { branch: 'main', head: 'a1', path: '/home/dev/site' },
      { branch: null, head: 'b2', path: '/home/dev/site-review' },
    ]);
  });
});
