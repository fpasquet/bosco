// Relecture dans le dépôt de la personne (E7a, E7c) : le diff d'une branche depuis son point de départ, puis l'envoi
// de la seule branche de la tâche et une PR en brouillon, avec git et GitHub CLI du poste. Aucun jeton n'est demandé
// ni gardé ; Bosco ne pousse jamais la branche principale et ne fusionne jamais.
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';
import type { ChangesReader, PullRequestPublisher, TaskChanges } from '../../application/review.service.ts';

const GIT = '/usr/bin/git';
const run = promisify(execFile);
/** Au-delà, le diff est coupé : la relecture montre les fichiers, et le reste se lit dans l'éditeur. */
const MAX_DIFF = 400 * 1024;

async function git(cwd: string, ...args: string[]): Promise<string> {
  const { stdout } = await run(GIT, args, { cwd, maxBuffer: 32 * 1024 * 1024 });
  return stdout;
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
  constructor(private readonly gh: string) {}

  async availability(root: string): Promise<null | string> {
    const remote = await git(root, 'remote', 'get-url', 'origin').catch(() => null);
    if (!remote) return 'Le dépôt n’a pas de dépôt distant « origin »';
    if (!existsSync(this.gh)) return 'GitHub CLI n’est pas installé sur le poste';
    const connected = await run(this.gh, ['auth', 'status'], { cwd: root }).then(
      () => true,
      () => false,
    );
    return connected ? null : 'GitHub CLI n’est pas connecté';
  }

  async publish(root: string, request: { body: string; branch: string; from: string; title: string }): Promise<string> {
    try {
      // Seule la branche de la tâche part, sans forcer : une branche distante différente fait échouer l'envoi
      await git(root, 'push', '--quiet', 'origin', `${request.branch}:${request.branch}`);
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
          '--base',
          request.from,
          '--head',
          request.branch,
          '--title',
          request.title,
          '--body',
          request.body,
        ],
        { cwd: root },
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
  publish: (_root, request) => Promise.resolve(`https://github.com/exemple/depot/pull/${request.branch.length}`),
};
