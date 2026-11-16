import type { ContextLink } from '../domain/context-text.ts';
import { DomainError } from '../../shared/domain/domain-error.ts';
import {
  type LinkReading,
  type LinkService,
  type LinkSnapshot,
  readingFromAddress,
  recognize,
  type Recognized,
} from '../domain/link.ts';

export interface LinkRepository {
  all(): Promise<LinkSnapshot[]>;
  nextId(): Promise<number>;
  remove(id: number): Promise<void>;
  save(link: LinkSnapshot): Promise<void>;
}

export interface ReadOptions {
  /** Compte GitHub du dépôt de la tâche (E8a) ; null : le compte actif de gh */
  githubAccount: null | string;
}

/** Lit un lien de son service ; échoue avec une cause lisible (« GitHub CLI n'est pas connecté »). */
export interface LinkReader {
  read(link: Recognized & { url: string }, options: ReadOptions): Promise<LinkReading>;
}

/** Services dont Bosco lit les liens ; Jira et Confluence se tirent de l'adresse (CA-CONT-90). */
export type ReadService = Exclude<LinkService, 'confluence' | 'jira'>;

/** GitHub se lit avec GitHub CLI du poste : null s'il est connecté, sinon la raison. */
export interface GithubCheck {
  status(): Promise<null | string>;
}

export class InvalidLink extends DomainError {
  constructor(message: string) {
    super('invalidLink', message);
  }
}

/** GitHub, que Bosco lit ; Atlassian (Jira et Confluence), que lisent les agents (CA-CONT-88) */
export type IntegrationName = 'atlassian' | 'github';

export interface IntegrationView {
  /** « github.com », ou le motif des sites Atlassian */
  address: null | string;
  checkedAt: Date | null;
  error: null | string;
  /** Depuis quand la lecture échoue : les liens gardent leurs dernières informations */
  failingSince: Date | null;
  links: number;
  name: IntegrationName;
  /** agents : Bosco ne lit pas ce service, les agents du worker le lisent eux-mêmes (RF-CONT-14) */
  state: 'agents' | 'connected' | 'error' | 'unconfigured';
}

function stateOf(configured: boolean, error: null | string): IntegrationView['state'] {
  if (!configured) return 'unconfigured';
  return error ? 'error' : 'connected';
}

/** Relecture des liens à cet intervalle (E10a). */
export const REFRESH_MS = 60 * 60 * 1000;

/**
 * Liens des tâches (E10a, E10b) : une adresse collée est reconnue, lue par son intégration (GitHub) ou tirée de son
 * adresse (Jira, Confluence), relue toutes les heures et transmise à l'agent par son titre, son état et son adresse ;
 * les accès restent dans Bosco.
 */
export class LinksService {
  private readonly health = new Map<
    IntegrationName,
    { checkedAt: Date; error: null | string; failingSince: Date | null }
  >();
  private lastRefresh: Date | null = null;

  /** Compte GitHub du dépôt d'une tâche, donné par le contexte des tâches (E8a) */
  private githubAccountOf: (taskId: number) => Promise<null | string> = () => Promise.resolve(null);

  constructor(
    private readonly links: LinkRepository,
    private readonly readers: Record<ReadService, LinkReader>,
    private readonly github: GithubCheck,
    private readonly clock: { now(): Date },
  ) {}

  recognize(url: string): Recognized {
    return recognize(url);
  }

  async forTask(taskId: number): Promise<LinkSnapshot[]> {
    const all = await this.links.all();
    return all.filter((link) => link.taskId === taskId);
  }

  /** Ce que reçoit l'agent avec sa consigne : titre, état et adresse, jamais le contenu ni les accès (CA-CONT-38). */
  async contextLinks(taskId: number): Promise<ContextLink[]> {
    const links = await this.forTask(taskId);
    return links.map(({ kind, state, title, url }) => ({ title, kind, state, url }));
  }

  async add(taskId: number, url: string): Promise<LinkSnapshot> {
    const trimmed = url.trim();
    if (!/^https?:\/\/\S+$/.test(trimmed) && !/^DEC-\d+$/i.test(trimmed))
      throw new InvalidLink('Colle une adresse complète (https://…) ou le numéro d’une décision (DEC-3).');
    const existing = await this.forTask(taskId);
    if (existing.some((link) => link.url === trimmed)) throw new InvalidLink('Ce lien est déjà sur la tâche.');
    const recognized = this.recognize(trimmed);
    const id = await this.links.nextId();
    const link: LinkSnapshot = {
      id,
      taskId,
      url: trimmed,
      ...recognized,
      title: trimmed,
      state: null,
      person: null,
      readAt: null,
      error: null,
    };
    const read = await this.read(link);
    await this.links.save(read);
    return read;
  }

  /** Retirer un lien ne le supprime que de cette tâche (E10b, annotation 5). */
  async remove(taskId: number, id: number): Promise<void> {
    const links = await this.forTask(taskId);
    if (links.some((link) => link.id === id)) await this.links.remove(id);
  }

  /** Toutes les heures, ou « Rafraîchir maintenant » : un lien illisible garde ses dernières informations. */
  async refreshAll(): Promise<void> {
    const links = await this.links.all();
    for (const link of links) {
      const read = await this.read(link);
      await this.links.save(read);
    }
    this.lastRefresh = this.clock.now();
    await this.checkGithub();
  }

  async integrations(): Promise<{
    integrations: IntegrationView[];
    lastRefresh: Date | null;
    nextRefresh: Date | null;
  }> {
    const links = await this.links.all();
    if (!this.health.has('github')) await this.checkGithub();
    const github = this.health.get('github');
    const installed = github?.error !== 'GitHub CLI n’est pas installé sur le poste';
    return {
      integrations: [
        {
          name: 'github',
          address: 'github.com',
          links: links.filter((link) => link.service === 'github').length,
          state: stateOf(installed, github?.error ?? null),
          checkedAt: github?.checkedAt ?? null,
          error: github?.error ?? null,
          failingSince: github?.failingSince ?? null,
        },
        {
          name: 'atlassian',
          address: '*.atlassian.net',
          links: links.filter((link) => link.service === 'jira' || link.service === 'confluence').length,
          state: 'agents',
          checkedAt: null,
          error: null,
          failingSince: null,
        },
      ],
      lastRefresh: this.lastRefresh,
      nextRefresh: this.lastRefresh && new Date(this.lastRefresh.getTime() + REFRESH_MS),
    };
  }

  /** Les liens GitHub d'une tâche se lisent avec le compte de son dépôt (E8a). */
  useGithubAccounts(githubAccountOf: (taskId: number) => Promise<null | string>): void {
    this.githubAccountOf = githubAccountOf;
  }

  private async read(link: LinkSnapshot): Promise<LinkSnapshot> {
    // Jira et Confluence ne sont pas lus par Bosco : l'agent les lit lui-même (RF-CONT-14)
    if (link.service === 'jira' || link.service === 'confluence')
      return { ...link, ...readingFromAddress(link.service, link.url), readAt: this.clock.now(), error: null };
    const reader = this.readers[link.service];
    const name = link.service === 'github' ? 'github' : null;
    try {
      const githubAccount = link.service === 'github' ? await this.githubAccountOf(link.taskId) : null;
      const reading = await reader.read(link, { githubAccount });
      if (name) this.health.set(name, { checkedAt: this.clock.now(), error: null, failingSince: null });
      return { ...link, ...reading, readAt: this.clock.now(), error: null };
    } catch (error) {
      const cause = error instanceof Error ? error.message : String(error);
      if (name) {
        const failingSince = this.health.get(name)?.failingSince ?? link.readAt ?? this.clock.now();
        this.health.set(name, { checkedAt: this.clock.now(), error: cause, failingSince });
      }
      return { ...link, error: cause };
    }
  }

  private async checkGithub(): Promise<void> {
    const error = await this.github.status();
    const known = this.health.get('github');
    this.health.set('github', {
      checkedAt: this.clock.now(),
      error,
      failingSince: error ? (known?.failingSince ?? this.clock.now()) : null,
    });
  }
}
