// Lecture de Jira et Confluence par l'agent du worker (RF-CONT-14) : par le connecteur Atlassian du compte claude.ai
// de l'abonnement de la tâche, en lecture seule. Les noms d'outils sont ceux que Claude Code donne aux connecteurs.

/** Préfixe des outils du connecteur Atlassian de claude.ai (« claude.ai Atlassian ») */
const PREFIX = 'mcp__claude_ai_Atlassian__';

/** Seuls outils permis à l'agent : tout autre outil de ce connecteur, et tout autre connecteur, lui est refusé. */
export const ATLASSIAN_READ_TOOLS = [
  'getJiraIssue',
  'getJiraIssueRemoteIssueLinks',
  'searchJiraIssuesUsingJql',
  'getConfluencePage',
  'getConfluencePageDescendants',
  'searchConfluenceUsingCql',
  'getAccessibleAtlassianResources',
].map((name) => `${PREFIX}${name}`);

/** Domaine par lequel Claude Code joint les connecteurs de claude.ai : autorisé tant que la lecture est activée. */
export const CONNECTORS_DOMAIN = 'mcp-proxy.anthropic.com';

/** Le connecteur est branché quand ses outils figurent parmi ceux que l'agent a au démarrage. */
export function hasAtlassianConnector(tools: readonly string[]): boolean {
  return tools.includes(`${PREFIX}getJiraIssue`);
}

/** Ligne du journal d'une lecture (CA-CONT-94) : l'événement, et ce qui a été lu. */
export interface ConnectorRead {
  detail: string;
  event: 'Lu dans Confluence' | 'Lu dans Jira';
}

const MAX_QUERY = 160;

function field(input: unknown, key: string): null | string {
  if (typeof input !== 'object' || input === null) return null;
  const value = (input as Record<string, unknown>)[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function query(value: null | string): string {
  const text = (value ?? '').replaceAll(/\s+/g, ' ');
  return text.length > MAX_QUERY ? `${text.slice(0, MAX_QUERY - 1)}…` : text;
}

/** Ce qu'un appel d'outil de lecture a lu ; null pour un autre outil, ou la liste des sites (rien de lu). */
export function connectorReadOf(tool: string, input: unknown): ConnectorRead | null {
  if (!tool.startsWith(PREFIX)) return null;
  const name = tool.slice(PREFIX.length);
  const issue = field(input, 'issueIdOrKey') ?? '?';
  const page = field(input, 'pageId') ?? '?';
  switch (name) {
    case 'getJiraIssue':
      return { event: 'Lu dans Jira', detail: issue };
    case 'getJiraIssueRemoteIssueLinks':
      return { event: 'Lu dans Jira', detail: `liens de ${issue}` };
    case 'searchJiraIssuesUsingJql':
      return { event: 'Lu dans Jira', detail: `recherche ${query(field(input, 'jql'))}` };
    case 'getConfluencePage':
      return { event: 'Lu dans Confluence', detail: `page ${page}` };
    case 'getConfluencePageDescendants':
      return { event: 'Lu dans Confluence', detail: `sous-pages de la page ${page}` };
    case 'searchConfluenceUsingCql':
      return { event: 'Lu dans Confluence', detail: `recherche ${query(field(input, 'cql'))}` };
    default:
      return null;
  }
}
