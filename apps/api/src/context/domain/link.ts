/** Service d'un lien : lu par son intégration, ou la seule page pour une adresse inconnue (RF-CONT-04). */
export type LinkService = 'confluence' | 'decision' | 'github' | 'jira' | 'page';

export interface Recognized {
  /** « Pull request », « Ticket », « Commit », « Page », « Décision » */
  kind: string;
  service: LinkService;
}

/** Adresses des intégrations configurées, pour reconnaître leurs liens. */
export interface IntegrationHosts {
  confluence: null | string;
  jira: null | string;
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

/** Le service d'une adresse collée, reconnu avant l'ajout (CA-CONT-34) ; toute adresse est acceptée (CA-CONT-35). */
export function recognize(url: string, hosts: IntegrationHosts): Recognized {
  const trimmed = url.trim();
  if (/^DEC-\d+$/i.test(trimmed) || /\/context\/decisions\/\d+/.test(trimmed))
    return { service: 'decision', kind: 'Décision' };
  const github = GITHUB.exec(trimmed);
  if (github) return { service: 'github', kind: GITHUB_KINDS[github[1] ?? ''] ?? 'Lien' };
  const host = hostOf(trimmed);
  if (host && hosts.confluence && host === hostOf(hosts.confluence) && trimmed.includes('/wiki/'))
    return { service: 'confluence', kind: 'Page' };
  if (host && hosts.jira && host === hostOf(hosts.jira) && /\/browse\/[A-Z][A-Z0-9]+-\d+/.test(trimmed))
    return { service: 'jira', kind: 'Ticket' };
  return { service: 'page', kind: 'Page' };
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
