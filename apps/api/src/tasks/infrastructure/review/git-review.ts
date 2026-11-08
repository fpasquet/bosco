// Relecture dans le dépôt de la personne (E7a, E7c) : le diff d'une branche depuis son point de départ, puis l'envoi
// de la seule branche de la tâche et une PR en brouillon, avec git et GitHub CLI du poste. Aucun jeton n'est demandé
// ni gardé ; Bosco ne pousse jamais la branche principale et ne fusionne jamais.
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';
import type { GithubAccounts } from '../../../shared/infrastructure/github/gh-accounts.ts';
import type { ChangesReader, PullRequestPublisher, TaskChanges } from '../../application/review.service.ts';

const GIT = '/usr/bin/git';
const run = promisify(execFile);
/** Au-delà, le diff est coupé : la relecture montre les fichiers, et le reste se lit dans l'éditeur. */
const MAX_DIFF = 400 * 1024;

async function git(cwd: string, ...args: string[]): Promise<string> {
  const { stdout } = await run(GIT, args, { cwd, maxBuffer: 32 * 1024 * 1024 });
  return stdout;
}

/** « owner/repo » d'une adresse GitHub, en SSH (git@github.com:owner/repo.git) comme en HTTPS. */
export function githubRepositoryOf(remote: string): null | string {
  const match = /github\.com[:/]([^/\s]+)\/([^/\s]+?)(?:\.git)?\/?$/.exec(remote.trim());
  return match ? `${match[1]}/${match[2]}` : null;
}

/** Message d'erreur lisible d'une commande : sa dernière ligne d'erreur. */
function causeOf(error: unknown): string {
  const stderr = (error as { stderr?: string }).stderr?.trim();
  return stderr?.split('\n').at(-1) ?? (error instanceof Error ? error.message : String(error));
}

export class GitChanges implements ChangesReader {
  async commits(root: string, base: string, branch: string): Promise<number> {
    const count = await git(root, 'rev-list', '--count', `${base}..${branch}`).catch(() => '0');
    return Number(count.trim()) || 0;
  }

  async of(root: string, base: string, branch: string): Promise<TaskChanges> {
    const numstat = await git(root, 'diff', '--numstat', base, branch);
    const files = numstat
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [added = '0', removed = '0', ...path] = line.split('\t');
        return { path: path.join('\t'), added: Number(added) || 0, removed: Number(removed) || 0 };
      });
    const diff = await git(root, 'diff', '--no-color', base, branch);
    return { files, diff: diff.slice(0, MAX_DIFF), truncated: diff.length > MAX_DIFF };
  }
}

export class GhPublisher implements PullRequestPublisher {
  constructor(
    private readonly gh: string,
    private readonly accounts: GithubAccounts,
  ) {}

  async availability(root: string, account: null | string): Promise<null | string> {
    const remote = await git(root, 'remote', 'get-url', 'origin').catch(() => null);
    if (!remote) return 'Le dépôt n’a pas de dépôt distant « origin »';
    if (!existsSync(this.gh)) return 'GitHub CLI n’est pas installé sur le poste';
    const connected = await this.accounts.list();
    if (connected.length === 0) return 'GitHub CLI n’est pas connecté';
    if (account && !connected.some(({ login }) => login === account))
      return `Le compte GitHub ${account} n’est plus connecté à GitHub CLI`;
    return null;
  }

  /**
   * Pousse la branche de la tâche et ouvre la PR en brouillon. Avec un compte choisi (E8a), l'envoi passe en HTTPS
   * avec le jeton de ce compte, le temps de la commande : la clé SSH du poste désignerait sinon un autre compte.
   */
  async publish(
    root: string,
    request: { body: string; branch: string; from: string; title: string },
    account: null | string,
  ): Promise<string> {
    const token = await this.accounts.envOf(account);
    const env = { ...process.env, ...token };
    const origin = await git(root, 'remote', 'get-url', 'origin');
    const remote = origin.trim();
    const repository = githubRepositoryOf(remote);
    // Seule la branche de la tâche part, sans forcer : une branche distante différente fait échouer l'envoi
    const target = account && repository ? `https://github.com/${repository}.git` : 'origin';
    const helper = account
      ? ['-c', 'credential.helper=', '-c', `credential.helper=!${this.gh} auth git-credential`]
      : [];
    try {
      await run(GIT, [...helper, 'push', '--quiet', target, `${request.branch}:${request.branch}`], { cwd: root, env });
    } catch (error) {
      throw new Error(`Envoi de la branche refusé : ${causeOf(error)}`, { cause: error });
    }
    try {
      const { stdout } = await run(
        this.gh,
        [
          'pr',
          'create',
          '--draft',
          ...(repository ? ['--repo', repository] : []),
          '--base',
          request.from,
          '--head',
          request.branch,
          '--title',
          request.title,
          '--body',
          request.body,
        ],
        { cwd: root, env },
      );
      return stdout.trim().split('\n').at(-1) ?? '';
    } catch (error) {
      throw new Error(`PR non ouverte : ${causeOf(error)}`, { cause: error });
    }
  }
}

/** Scénarios (BOSCO_TEST=1) : un diff écrit d'avance, et une PR « ouverte » sans réseau. */
export const scriptedReview: ChangesReader & PullRequestPublisher = {
  commits: () => Promise.resolve(2),
  of: () =>
    Promise.resolve({
      files: [{ path: 'lexique/sigles.json', added: 3, removed: 0 }],
      diff: 'diff --git a/lexique/sigles.json b/lexique/sigles.json\n--- a/lexique/sigles.json\n+++ b/lexique/sigles.json\n@@ -1,2 +1,5 @@\n {\n+  "SNCF": "èss-ène-cé-èf",\n+  "RATP": "èr-a-té-pé",\n+  "EDF": "eu-dé-èf"\n }\n',
      truncated: false,
    }),
  availability: () => Promise.resolve(null),
  publish: (_root, request, account) =>
    Promise.resolve(`https://github.com/${account ?? 'exemple'}/depot/pull/${request.branch.length}`),
};
