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

export class InvalidLink extends DomainError {
  constructor(message: string) {
    super('invalidLink', message);
  }
}

/** Relecture des liens à cet intervalle (E10b). */
export const REFRESH_MS = 60 * 60 * 1000;

/**
 * Liens des tâches (E10b) : une adresse collée est reconnue, lue par son intégration (GitHub) ou tirée de son
 * adresse (Jira, Confluence), relue toutes les heures et transmise à l'agent par son titre, son état et son adresse ;
 * les accès restent dans Bosco.
 */
export class LinksService {
  /** Compte GitHub du dépôt d'une tâche, donné par le contexte des tâches (E8a) */
  private githubAccountOf: (taskId: number) => Promise<null | string> = () => Promise.resolve(null);

  constructor(
    private readonly links: LinkRepository,
    private readonly readers: Record<ReadService, LinkReader>,
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

  /** Toutes les heures : un lien illisible garde ses dernières informations, avec la cause (CA-CONT-97). */
  async refreshAll(): Promise<void> {
    const links = await this.links.all();
    for (const link of links) {
      const read = await this.read(link);
      await this.links.save(read);
    }
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
    try {
      const githubAccount = link.service === 'github' ? await this.githubAccountOf(link.taskId) : null;
      const reading = await reader.read(link, { githubAccount });
      return { ...link, ...reading, readAt: this.clock.now(), error: null };
    } catch (error) {
      return { ...link, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
