// Comptes de GitHub CLI connectés sur le poste (E8a, E11b). Bosco agit avec le compte choisi en passant son jeton
// à la commande (GH_TOKEN), le temps de la commande : rien n'est gardé, et le compte actif de gh ne change pas.
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';

const run = promisify(execFile);
const TIMEOUT_MS = 10_000;
const HOST = 'github.com';

export interface GithubAccount {
  /** Compte actif de gh : celui des commandes lancées sans choix */
  active: boolean;
  login: string;
}

export interface GithubAccounts {
  list(): Promise<GithubAccount[]>;
  /** Environnement d'une commande git ou gh lancée avec ce compte ; vide sans compte choisi */
  envOf(login: null | string): Promise<Record<string, string>>;
}

export class GhAccounts implements GithubAccounts {
  constructor(private readonly gh: string) {}

  async list(): Promise<GithubAccount[]> {
    if (!existsSync(this.gh)) return [];
    try {
      const { stdout } = await run(this.gh, ['auth', 'status', '--json', 'hosts'], { timeout: TIMEOUT_MS });
      const parsed = JSON.parse(stdout) as { hosts?: Record<string, { active?: boolean; login?: string }[]> };
      return (parsed.hosts?.[HOST] ?? []).flatMap(({ active, login }) =>
        typeof login === 'string' ? [{ active: active === true, login }] : [],
      );
    } catch {
      return [];
    }
  }

  async envOf(login: null | string): Promise<Record<string, string>> {
    if (!login) return {};
    const { stdout } = await run(this.gh, ['auth', 'token', '--hostname', HOST, '--user', login], {
      timeout: TIMEOUT_MS,
    }).catch((error: unknown) => {
      throw new Error(`Le compte GitHub ${login} n’est plus connecté à GitHub CLI`, { cause: error });
    });
    return { GH_TOKEN: stdout.trim() };
  }
}

/** Scénarios (BOSCO_TEST=1) : deux comptes connus, sans GitHub CLI. */
export const scriptedGithubAccounts: GithubAccounts = {
  list: () =>
    Promise.resolve([
      { active: true, login: 'camille-dev' },
      { active: false, login: 'camille-pro' },
    ]),
  envOf: () => Promise.resolve({}),
};
