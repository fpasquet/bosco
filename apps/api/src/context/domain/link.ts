/**
 * Service d'un lien (RF-CONT-04) : GitHub lu par son intégration, Jira et Confluence reconnus à leur adresse sans être
 * lus (l'agent les lit lui-même, RF-CONT-14), ou la seule page pour une adresse inconnue.
 */
export type LinkService = 'confluence' | 'decision' | 'github' | 'jira' | 'page';

export interface Recognized {
  /** « Pull request », « Ticket », « Commit », « Page », « Décision » */
  kind: string;
  service: LinkService;
}

const GITHUB = /^https:\/\/github\.com\/[^/]+\/[^/]+\/(pull|issues|commit|tree)\/[^/?#]+/;
const GITHUB_KINDS: Record<string, string> = {
  pull: 'Pull request',
  issues: 'Ticket',
  commit: 'Commit',
  tree: 'Branche',
};

function hostOf(url: string): null | string {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return null;
  }
}

// Jira et Confluence d'Atlassian : un site *.atlassian.net, sans réglage
const ATLASSIAN = /^[a-z0-9-]+\.atlassian\.net$/;
const JIRA_KEY = /\/browse\/([A-Z][A-Z0-9]+-\d+)/;

/** Le service d'une adresse collée, reconnu avant l'ajout (CA-CONT-34) ; toute adresse est acceptée (CA-CONT-35). */
export function recognize(url: string): Recognized {
  const trimmed = url.trim();
  if (/^DEC-\d+$/i.test(trimmed) || /\/context\/decisions\/\d+/.test(trimmed))
    return { service: 'decision', kind: 'Décision' };
  const github = GITHUB.exec(trimmed);
  if (github) return { service: 'github', kind: GITHUB_KINDS[github[1] ?? ''] ?? 'Lien' };
  const host = hostOf(trimmed);
  if (host && ATLASSIAN.test(host) && new URL(trimmed).pathname.startsWith('/wiki/'))
    return { service: 'confluence', kind: 'Page' };
  if (host && ATLASSIAN.test(host) && JIRA_KEY.test(trimmed)) return { service: 'jira', kind: 'Ticket' };
  return { service: 'page', kind: 'Page' };
}

/**
 * Ce que Bosco garde d'un lien Jira ou Confluence, tiré de sa seule adresse (CA-CONT-90) : la clé du ticket, ou le
 * titre d'une page quand l'adresse le contient (…/pages/123/Lexique+de+prononciation), sinon l'adresse.
 */
export function readingFromAddress(service: 'confluence' | 'jira', url: string): LinkReading {
  const empty = { state: null, person: null };
  if (service === 'jira') return { title: JIRA_KEY.exec(url)?.[1] ?? url, ...empty };
  const slug = /\/pages\/\d+\/([^/?#]+)/.exec(url)?.[1];
  if (!slug) return { title: url, ...empty };
  try {
    return { title: decodeURIComponent(slug.replaceAll('+', ' ')), ...empty };
  } catch {
    return { title: url, ...empty };
  }
}

/** Ce que Bosco a lu d'un lien : titre, état, auteur ou responsable (CA-CONT-36). */
export interface LinkReading {
  person: null | string;
  state: null | string;
  title: string;
}

export interface LinkSnapshot extends Recognized, LinkReading {
  /** Cause de la dernière lecture en échec : le lien garde ses dernières informations (« Non rafraîchi ») */
  error: null | string;
  id: number;
  readAt: Date | null;
  taskId: number;
  url: string;
}

/** Numéro d'une décision Bosco dans une adresse (« DEC-3 », « …/context/decisions/3 »). */
export function decisionIdOf(url: string): null | number {
  const match = /DEC-(\d+)$/i.exec(url.trim()) ?? /\/context\/decisions\/(\d+)/.exec(url);
  return match ? Number(match[1]) : null;
}
