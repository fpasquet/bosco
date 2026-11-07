import type { ContextLink } from '../domain/context-text.ts';
import { DomainError } from '../../shared/domain/domain-error.ts';
import {
  type IntegrationHosts,
  type LinkReading,
  type LinkService,
  type LinkSnapshot,
  recognize,
  type Recognized,
} from '../domain/link.ts';

export interface LinkRepository {
  all(): Promise<LinkSnapshot[]>;
  nextId(): Promise<number>;
  remove(id: number): Promise<void>;
  save(link: LinkSnapshot): Promise<void>;
}

/** Accès d'une intégration Atlassian : adresse du site, compte et jeton d'API, gardés dans Bosco (RF-CONT-05). */
export interface AtlassianAccess {
  baseUrl: string;
  email: string;
  token: string;
}

export interface IntegrationSettings {
  confluence: AtlassianAccess | null;
  jira: AtlassianAccess | null;
}

export interface IntegrationStore {
  load(): Promise<IntegrationSettings>;
  save(settings: IntegrationSettings): Promise<void>;
}

/** Lit un lien de son service ; échoue avec une cause lisible (« Jeton refusé »). */
export interface LinkReader {
  read(link: Recognized & { url: string }, settings: IntegrationSettings): Promise<LinkReading>;
}

/** GitHub se lit avec GitHub CLI du poste : null s'il est connecté, sinon la raison. */
export interface GithubCheck {
  status(): Promise<null | string>;
}

export class InvalidLink extends DomainError {
  constructor(message: string) {
    super('invalidLink', message);
  }
}

export type IntegrationName = 'confluence' | 'github' | 'jira';

export interface IntegrationView {
  /** Adresse du site, ou « github.com » */
  address: null | string;
  checkedAt: Date | null;
  error: null | string;
  /** Depuis quand la lecture échoue : les liens gardent leurs dernières informations */
  failingSince: Date | null;
  links: number;
  name: IntegrationName;
  state: 'connected' | 'error' | 'unconfigured';
}

function stateOf(configured: boolean, error: null | string): IntegrationView['state'] {
  if (!configured) return 'unconfigured';
  return error ? 'error' : 'connected';
}

/** Relecture des liens à cet intervalle (E10a). */
export const REFRESH_MS = 60 * 60 * 1000;

/**
 * Liens des tâches (E10a, E10b) : une adresse collée est reconnue, lue par son intégration, relue toutes les heures et
 * transmise à l'agent par son titre, son état et son adresse ; les accès restent dans Bosco.
 */
export class LinksService {
  private readonly health = new Map<
    IntegrationName,
    { checkedAt: Date; error: null | string; failingSince: Date | null }
  >();
  private lastRefresh: Date | null = null;

  constructor(
    private readonly links: LinkRepository,
    private readonly store: IntegrationStore,
    private readonly readers: Record<LinkService, LinkReader>,
    private readonly github: GithubCheck,
    private readonly clock: { now(): Date },
  ) {}

  async recognize(url: string): Promise<Recognized> {
    const settings = await this.store.load();
    return recognize(url, this.hostsOf(settings));
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
    const recognized = await this.recognize(trimmed);
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
    const settings = await this.store.load();
    const read = await this.read(link, settings);
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
    const settings = await this.store.load();
    const links = await this.links.all();
    for (const link of links) {
      const read = await this.read(link, settings);
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
    const [settings, links] = await Promise.all([this.store.load(), this.links.all()]);
    const view = (name: IntegrationName, address: null | string, configured: boolean): IntegrationView => {
      const health = this.health.get(name);
      return {
        name,
        address,
        links: links.filter((link) => link.service === name).length,
        state: stateOf(configured, health?.error ?? null),
        checkedAt: health?.checkedAt ?? null,
        error: health?.error ?? null,
        failingSince: health?.failingSince ?? null,
      };
    };
    if (!this.health.has('github')) await this.checkGithub();
    return {
      integrations: [
        view('github', 'github.com', this.health.get('github')?.error !== 'GitHub CLI n’est pas installé sur le poste'),
        view('jira', settings.jira?.baseUrl ?? null, settings.jira !== null),
        view('confluence', settings.confluence?.baseUrl ?? null, settings.confluence !== null),
      ],
      lastRefresh: this.lastRefresh,
      nextRefresh: this.lastRefresh && new Date(this.lastRefresh.getTime() + REFRESH_MS),
    };
  }

  /** Accès Jira ou Confluence ; un jeton vide garde celui déjà enregistré (renouveler, ou changer l'adresse). */
  async configure(name: 'confluence' | 'jira', access: AtlassianAccess | null): Promise<void> {
    const settings = await this.store.load();
    if (access === null) settings[name] = null;
    else {
      const token = access.token.trim() || settings[name]?.token || '';
      if (!/^https:\/\/\S+$/.test(access.baseUrl.trim())) throw new InvalidLink('Une adresse https:// du site.');
      if (!access.email.trim() || !token) throw new InvalidLink('Le compte et le jeton d’API sont nécessaires.');
      settings[name] = { baseUrl: access.baseUrl.trim().replace(/\/$/, ''), email: access.email.trim(), token };
    }
    await this.store.save(settings);
    this.health.delete(name);
  }

  private async read(link: LinkSnapshot, settings: IntegrationSettings): Promise<LinkSnapshot> {
    const reader = this.readers[link.service];
    const name = link.service === 'page' || link.service === 'decision' ? null : link.service;
    try {
      const reading = await reader.read(link, settings);
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

  private hostsOf(settings: IntegrationSettings): IntegrationHosts {
    return { jira: settings.jira?.baseUrl ?? null, confluence: settings.confluence?.baseUrl ?? null };
  }
}
