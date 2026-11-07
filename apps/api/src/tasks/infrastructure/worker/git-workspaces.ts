// Copies jetables des dépôts (RF-CONT-06) : un clone local par tâche, sur sa branche ; à la fin, le travail est
// commité, la branche rapatriée dans le dépôt de la personne, puis la copie supprimée. Seule la branche reste.
import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { Workspace, Workspaces } from '../../application/ports.ts';

const GIT = '/usr/bin/git';
const run = promisify(execFile);

async function git(cwd: string, ...args: string[]): Promise<string> {
  const { stdout } = await run(GIT, args, { cwd, maxBuffer: 16 * 1024 * 1024 });
  return stdout.trim();
}

/** « 2 files changed, 38 insertions(+), 4 deletions(-) » */
export function shortStat(text: string): { added: number; files: number; removed: number } {
  // Chaque partie est « <nombre> <mot> » : on lit le nombre qui précède chaque mot attendu
  const parts = text.split(',').map((part) => part.trim().split(' '));
  const number = (word: string) => Number(parts.find((part) => part[1]?.startsWith(word))?.[0] ?? 0);
  return { files: number('file'), added: number('insertion'), removed: number('deletion') };
}

export class GitWorkspaces implements Workspaces {
  constructor(private readonly root: string) {}

  async prepare(task: {
    branch: string;
    id: number;
    repositoryRoot: string;
    startBranch: null | string;
  }): Promise<Workspace> {
    const dir = join(this.root, `t-${task.id}`);
    await rm(dir, { recursive: true, force: true });
    await mkdir(join(dir, 'home'), { recursive: true });
    await git(this.root, 'clone', '--quiet', '--no-hardlinks', task.repositoryRoot, join(dir, 'repo'));
    const repo = join(dir, 'repo');
    const start = task.startBranch ? `origin/${task.startBranch}` : 'HEAD';
    // Branche de départ, vers laquelle s'ouvrira une PR : celle de la préalable, ou la branche courante du dépôt
    const from = task.startBranch ?? (await git(repo, 'rev-parse', '--abbrev-ref', 'HEAD'));
    await writeFile(join(dir, 'from'), from);
    await git(repo, 'checkout', '--quiet', '-B', task.branch, start);
    // Point de départ de la branche, pour le résumé des modifications : noté dans la copie, jamais dans le dépôt
    const head = await git(repo, 'rev-parse', 'HEAD');
    await writeFile(join(dir, 'start'), head);
    return { branch: task.branch, dir };
  }

  async collect(workspace: Workspace, task: { id: number; repositoryRoot: string; title: string }) {
    const repo = join(workspace.dir, 'repo');
    await git(repo, 'add', '--all');
    const pending = await git(repo, 'status', '--porcelain');
    if (pending)
      await git(
        repo,
        '-c',
        'user.name=Bosco',
        '-c',
        'user.email=bosco@localhost',
        'commit',
        '--quiet',
        '-m',
        `T-${task.id} · ${task.title}`,
      );
    const saved = await readFile(join(workspace.dir, 'start'), 'utf8');
    const start = saved.trim();
    const stat = await git(repo, 'diff', '--shortstat', start, 'HEAD');
    const changes = shortStat(stat);
    const origin = await readFile(join(workspace.dir, 'from'), 'utf8');
    const from = origin.trim();
    // La branche rejoint le dépôt de la personne, sans toucher à sa branche courante ni à sa copie de travail
    await git(task.repositoryRoot, 'fetch', '--quiet', '--no-tags', repo, `+${workspace.branch}:${workspace.branch}`);
    return { base: start, changes, from };
  }

  async remove(workspace: Workspace): Promise<void> {
    await rm(workspace.dir, { recursive: true, force: true });
  }

  async cleanupAll(): Promise<void> {
    await mkdir(this.root, { recursive: true });
    for (const entry of await readdir(this.root)) await rm(join(this.root, entry), { recursive: true, force: true });
  }
}
