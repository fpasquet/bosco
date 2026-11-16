// Lecteurs des liens (RF-CONT-04) : GitHub avec GitHub CLI du poste, toute autre adresse par le titre de sa page.
// Seuls le titre, l'état et l'auteur sont gardés ; Jira et Confluence ne sont pas lus par Bosco (RF-CONT-14).
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { GithubAccounts } from '../../../shared/infrastructure/github/gh-accounts.ts';
import type { LinkReader, ReadOptions } from '../../application/links.service.ts';
import type { LinkReading } from '../../domain/link.ts';

const run = promisify(execFile);
const TIMEOUT_MS = 10_000;

type Json = Record<string, unknown>;
const text = (value: unknown) => (typeof value === 'string' ? value : null);
const nested = (value: unknown, key: string) => (value && typeof value === 'object' ? (value as Json)[key] : undefined);

/** GitHub : PR, ticket, commit ou branche, par l'API avec l'accès de GitHub CLI. */
export class GithubReader implements LinkReader {
  constructor(
    private readonly gh: string,
    private readonly accounts: GithubAccounts,
  ) {}

  async read(link: { url: string }, options?: ReadOptions): Promise<LinkReading> {
    const match = /github\.com\/([^/]+)\/([^/]+)\/(pull|issues|commit|tree)\/([^/?#]+)/.exec(link.url);
    if (!match) throw new Error('Adresse GitHub non reconnue');
    const [, owner, repo, kind, ref] = match;
    const paths: Record<string, string> = {
      pull: `repos/${owner}/${repo}/pulls/${ref}`,
      issues: `repos/${owner}/${repo}/issues/${ref}`,
      commit: `repos/${owner}/${repo}/commits/${ref}`,
      tree: `repos/${owner}/${repo}/branches/${ref}`,
    };
    // Avec le compte du dépôt de la tâche, le temps de la commande (E8a)
    const token = await this.accounts.envOf(options?.githubAccount ?? null);
    const env = { ...process.env, ...token };
    const { stdout } = await run(this.gh, ['api', paths[kind ?? ''] ?? ''], { env, timeout: TIMEOUT_MS }).catch(
      (error: unknown) => {
        throw new Error((error as { stderr?: string }).stderr?.trim().split('\n').at(-1) ?? 'GitHub ne répond pas', {
          cause: error,
        });
      },
    );
    const body = JSON.parse(stdout) as Json;
    if (kind === 'commit')
      return {
        title: text(nested(body.commit, 'message'))?.split('\n')[0] ?? ref ?? '',
        state: null,
        person: text(nested(nested(body.commit, 'author'), 'name')),
      };
    if (kind === 'tree') return { title: text(body.name) ?? ref ?? '', state: null, person: null };
    const merged = body.merged === true || (body.merged_at !== null && body.merged_at !== undefined);
    const draft = body.draft === true;
    let state = text(body.state) === 'open' ? 'Ouverte' : 'Fermée';
    if (kind === 'pull' && merged) state = 'Fusionnée';
    if (kind === 'pull' && draft && !merged) state = 'Brouillon';
    return {
      title: text(body.title) ?? ref ?? '',
      state,
      person: text(nested(body.assignee, 'login')) ?? text(nested(body.user, 'login')),
    };
  }
}

/** Toute autre adresse : le seul titre de sa page, sans état ni auteur (CA-CONT-35). */
export const pageReader: LinkReader = {
  async read(link) {
    const response = await fetch(link.url, { signal: AbortSignal.timeout(TIMEOUT_MS), redirect: 'follow' });
    if (!response.ok) throw new Error(`La page a répondu ${response.status}`);
    const body = await response.text();
    const html = body.slice(0, 200_000);
    const title = /<title[^>]*>([^<]{1,300})<\/title>/i.exec(html)?.[1]?.trim();
    return { title: title ?? link.url, state: null, person: null };
  },
};

/** Scénarios (BOSCO_TEST=1) : des lectures écrites d'avance, sans réseau. */
export const scriptedReaders: Record<'github' | 'page', LinkReader> = {
  github: {
    read: (link) =>
      Promise.resolve({
        title: `Lecture de ${link.url.split('/').slice(-2).join(' ')}`,
        state: 'Ouverte',
        person: 'alex',
      }),
  },
  page: { read: (link) => Promise.resolve({ title: `Page ${new URL(link.url).host}`, state: null, person: null }) },
};
