// Lecteurs des liens (RF-CONT-04) : GitHub avec GitHub CLI du poste, Jira et Confluence avec leur jeton d'API, toute
// autre adresse par le titre de sa page. Seuls le titre, l'état et l'auteur ou responsable sont gardés.
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { promisify } from 'node:util';
import type { GithubAccounts } from '../../../shared/infrastructure/github/gh-accounts.ts';
import type { GithubCheck, IntegrationSettings, LinkReader } from '../../application/links.service.ts';
import type { LinkReading } from '../../domain/link.ts';

const run = promisify(execFile);
const TIMEOUT_MS = 10_000;

type Json = Record<string, unknown>;
const text = (value: unknown) => (typeof value === 'string' ? value : null);
const nested = (value: unknown, key: string) => (value && typeof value === 'object' ? (value as Json)[key] : undefined);

/** GitHub : PR, ticket, commit ou branche, par l'API avec l'accès de GitHub CLI. */
export class GithubReader implements LinkReader, GithubCheck {
  constructor(
    private readonly gh: string,
    private readonly accounts: GithubAccounts,
  ) {}

  async status(): Promise<null | string> {
    if (!existsSync(this.gh)) return 'GitHub CLI n’est pas installé sur le poste';
    return run(this.gh, ['auth', 'status'], { timeout: TIMEOUT_MS }).then(
      () => null,
      () => 'GitHub CLI n’est pas connecté',
    );
  }

  async read(link: { url: string }, settings?: IntegrationSettings): Promise<LinkReading> {
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
    const token = await this.accounts.envOf(settings?.githubAccount ?? null);
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

async function atlassian(path: string, access: { baseUrl: string; email: string; token: string }): Promise<Json> {
  const response = await fetch(`${access.baseUrl}${path}`, {
    headers: {
      accept: 'application/json',
      authorization: `Basic ${Buffer.from([access.email, access.token].join(':')).toString('base64')}`,
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (response.status === 401 || response.status === 403) throw new Error('Jeton refusé ou expiré');
  if (!response.ok) throw new Error(`Le service a répondu ${response.status}`);
  return (await response.json()) as Json;
}

/** Jira : titre, état et responsable d'un ticket. */
export const jiraReader: LinkReader = {
  async read(link, settings: IntegrationSettings) {
    if (!settings.jira) throw new Error('Jira n’est pas configuré');
    const key = /\/browse\/([A-Z][A-Z0-9]+-\d+)/.exec(link.url)?.[1];
    if (!key) throw new Error('Ticket Jira non reconnu');
    const body = await atlassian(`/rest/api/3/issue/${key}?fields=summary,status,assignee`, settings.jira);
    const fields = body.fields;
    return {
      title: `${key} · ${text(nested(fields, 'summary')) ?? ''}`,
      state: text(nested(nested(fields, 'status'), 'name')),
      person: text(nested(nested(fields, 'assignee'), 'displayName')),
    };
  },
};

/** Confluence : titre et version d'une page. */
export const confluenceReader: LinkReader = {
  async read(link, settings: IntegrationSettings) {
    if (!settings.confluence) throw new Error('Confluence n’est pas configuré');
    const id = /\/pages\/(\d+)/.exec(link.url)?.[1];
    if (!id) throw new Error('Page Confluence non reconnue');
    const base = settings.confluence.baseUrl.replace(/\/wiki$/, '');
    const body = await atlassian(`/wiki/rest/api/content/${id}?expand=version`, {
      ...settings.confluence,
      baseUrl: base,
    });
    const version = nested(body.version, 'number');
    return { title: text(body.title) ?? id, state: typeof version === 'number' ? `v${version}` : null, person: null };
  },
};

/** Toute autre adresse : le seul titre de sa page, sans état ni auteur (CA-CONT-32). */
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
export const scriptedReaders: Record<'confluence' | 'github' | 'jira' | 'page', LinkReader> & GithubCheck = {
  status: () => Promise.resolve(null),
  github: {
    read: (link) =>
      Promise.resolve({
        title: `Lecture de ${link.url.split('/').slice(-2).join(' ')}`,
        state: 'Ouverte',
        person: 'alex',
      }),
  },
  jira: {
    read: (_link, settings) =>
      settings.jira?.token === 'expiré'
        ? Promise.reject(new Error('Jeton refusé ou expiré'))
        : Promise.resolve({ title: 'TTS-142 · Prononciation des sigles', state: 'En cours', person: 'Alex M.' }),
  },
  confluence: { read: () => Promise.resolve({ title: 'Lexique de prononciation', state: 'v12', person: null }) },
  page: { read: (link) => Promise.resolve({ title: `Page ${new URL(link.url).host}`, state: null, person: null }) },
};
