// Branches et worktrees des dépôts du poste, lus par git ; un worktree se crée pour une branche ouverte nulle part.
import { execFile } from 'node:child_process';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import type { Checkouts } from '../../application/pilot.service.ts';
import { NO_CHECKOUTS, type ProjectCheckouts, worktreePathOf } from '../../domain/checkout.ts';

const GIT = '/usr/bin/git';
const run = promisify(execFile);
/** Ligne de `.git/info/exclude` qui garde les worktrees de Bosco hors du statut du dépôt, sans toucher au .gitignore */
const EXCLUDE = '/.claude/worktrees/';

async function git(cwd: string, ...args: string[]): Promise<string> {
  const { stdout } = await run(GIT, args, { cwd, maxBuffer: 16 * 1024 * 1024 });
  return stdout.trim();
}

/** Worktrees de `git worktree list --porcelain` : un bloc par worktree, séparés par une ligne vide. */
export function parseWorktrees(porcelain: string): { branch: null | string; head: string; path: string }[] {
  return porcelain
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split('\n');
      const value = (key: string) => lines.find((line) => line.startsWith(`${key} `))?.slice(key.length + 1) ?? null;
      const branch = value('branch');
      return {
        branch: branch?.startsWith('refs/heads/') ? branch.slice('refs/heads/'.length) : null,
        head: value('HEAD') ?? '',
        path: value('worktree') ?? '',
        bare: lines.includes('bare'),
      };
    })
    .filter(({ bare, path }) => path && !bare)
    .map(({ branch, head, path }) => ({ branch, head, path }));
}

export class GitCheckouts implements Checkouts {
  async list(root: string): Promise<ProjectCheckouts> {
    const [active, porcelain, refs] = await Promise.all([
      git(root, 'symbolic-ref', '--quiet', '--short', 'HEAD').catch(() => null),
      git(root, 'worktree', 'list', '--porcelain').catch(() => null),
      git(root, 'for-each-ref', '--format=%(refname:short)', 'refs/heads').catch(() => null),
    ]);
    if (porcelain === null || refs === null) return NO_CHECKOUTS;
    const all = parseWorktrees(porcelain);
    const here = resolve(root);
    const worktrees = all.filter(({ path }) => resolve(path) !== here);
    const opened = new Set(all.flatMap(({ branch }) => (branch ? [branch] : [])));
    const branches = refs
      .split('\n')
      .filter((branch) => branch && !opened.has(branch))
      .toSorted((a, b) => a.localeCompare(b));
    return { active: active || null, branches, worktrees };
  }

  async addWorktree(root: string, branch: string): Promise<string> {
    const path = worktreePathOf(root, branch);
    await this.exclude(root);
    await mkdir(dirname(path), { recursive: true });
    await git(root, 'worktree', 'add', '--quiet', path, branch);
    return path;
  }

  /** `.claude/worktrees/` rejoint l'exclusion locale du dépôt, une seule fois. */
  private async exclude(root: string): Promise<void> {
    const common = await git(root, 'rev-parse', '--path-format=absolute', '--git-common-dir');
    const file = join(common, 'info', 'exclude');
    const current = await readFile(file, 'utf8').catch(() => '');
    if (current.split('\n').includes(EXCLUDE)) return;
    await mkdir(dirname(file), { recursive: true });
    await appendFile(file, `${current && !current.endsWith('\n') ? '\n' : ''}${EXCLUDE}\n`);
  }
}
