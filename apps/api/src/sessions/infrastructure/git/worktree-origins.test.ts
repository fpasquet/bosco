// Ce que les scénarios ne voient pas : la lecture du fichier .git d'un worktree, d'un sous-module et d'un dépôt.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { GitWorktreeOrigins } from './worktree-origins.ts';

describe('GitWorktreeOrigins', () => {
  const dir = mkdtempSync(join(tmpdir(), 'bosco-worktrees-'));
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('finds the origin of a worktree, not of a submodule or a repository', () => {
    const origin = join(dir, 'labo-ia');
    mkdirSync(join(origin, '.git', 'worktrees', 'fix-ui'), { recursive: true });
    const worktree = join(origin, '.claude', 'worktrees', 'fix-ui');
    mkdirSync(worktree, { recursive: true });
    writeFileSync(join(worktree, '.git'), `gitdir: ${join(origin, '.git', 'worktrees', 'fix-ui')}\n`);
    const submodule = join(origin, 'vendor', 'lib');
    mkdirSync(submodule, { recursive: true });
    writeFileSync(join(submodule, '.git'), 'gitdir: ../../.git/modules/lib\n');

    const origins = new GitWorktreeOrigins();
    expect([origins.originOf(worktree), origins.originOf(submodule), origins.originOf(origin)]).toEqual([
      origin,
      null,
      null,
    ]);
  });
});
