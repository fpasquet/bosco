import type { DecisionSnapshot } from './decision.ts';

/** Ce que le projet appelle et qui l'appelle, pour mesurer l'effet d'un changement ailleurs. */
export interface Architecture {
  calledBy: string[];
  calls: string[];
}

/** Lien d'une tâche transmis à l'agent : titre, nature et état, jamais le contenu ni les accès. */
export interface ContextLink {
  kind: string;
  state: null | string;
  title: string;
  url: string;
}

/** Instructions d'un groupe du projet ; system : « Tous les projets », qui contient tous les projets. */
export interface GroupInstructions {
  id: number;
  instructions: string;
  name: string;
  system: boolean;
}

export interface ProjectContext {
  architecture: Architecture;
  /** Décisions acceptées du projet, qui l'emportent sur les instructions des groupes */
  decisions: DecisionSnapshot[];
  /** « Tous les projets » d'abord, puis chacun des groupes du projet */
  groups: GroupInstructions[];
  proposed: DecisionSnapshot[];
}

function title(decision: DecisionSnapshot): string {
  return decision.versions.at(-1)?.title ?? '';
}

/** Le contexte d'un projet : les instructions de ses groupes, ses décisions transmises et celles qui attendent. */
export function contextOf(
  project: string,
  decisions: readonly DecisionSnapshot[],
  groups: readonly GroupInstructions[],
  architecture: Architecture,
): ProjectContext {
  const own = decisions.filter((decision) => decision.target.name === project);
  return {
    decisions: own.filter((decision) => decision.state === 'accepted'),
    proposed: own.filter((decision) => decision.state === 'proposed'),
    groups: [...groups],
    architecture,
  };
}

/** Une consigne par ligne non vide, en liste. */
function instructionLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => (line.startsWith('- ') ? line : `- ${line}`));
}

function groupsSection(groups: readonly GroupInstructions[]): string[] {
  return groups.flatMap((group) => {
    const lines = instructionLines(group.instructions);
    if (lines.length === 0) return [];
    const heading = group.system
      ? `## Instructions communes (${group.name})`
      : `## Instructions du groupe ${group.name}`;
    return ['', heading, ...lines];
  });
}

/** Une décision dans le texte transmis : son titre, puis ce qui est décidé, sur une ligne. */
function decisionLines(decision: DecisionSnapshot): string[] {
  const body = decision.versions.at(-1)?.decision.replaceAll('\n', ' ') ?? '';
  return [`- DEC-${decision.id} ${title(decision)}`, `  ${body}`];
}

/** Les décisions du projet viennent après les instructions et l'emportent : le texte le dit à l'agent. */
function decisionsSection(context: ProjectContext, afterInstructions: boolean): string[] {
  if (context.decisions.length === 0) return [];
  const heading = afterInstructions
    ? '## Décisions du projet (elles l’emportent sur les instructions ci-dessus)'
    : '## Décisions du projet';
  return ['', heading, ...context.decisions.flatMap(decisionLines)];
}

function architectureSection({ calledBy, calls }: Architecture): string[] {
  if (calls.length === 0 && calledBy.length === 0) return [];
  return [
    '',
    '## Place dans l’architecture',
    ...(calls.length > 0 ? [`Appelle : ${calls.join(', ')}`] : []),
    ...(calledBy.length > 0 ? [`Appelée par : ${calledBy.join(', ')}`] : []),
  ];
}

function linksSection(links: readonly ContextLink[]): string[] {
  if (links.length === 0) return [];
  return [
    '',
    '## Liens de la tâche',
    ...links.map((link) => `- ${[link.title, link.kind, link.state].filter(Boolean).join(' · ')} · ${link.url}`),
  ];
}

/**
 * Texte exact que lit l'agent au lancement : les instructions de « Tous les projets », puis de chacun des groupes du
 * projet, ses décisions acceptées, qui l'emportent, sa place dans l'architecture et les liens de la tâche.
 */
export function contextText(project: string, context: ProjectContext, links: readonly ContextLink[] = []): string {
  const instructions = groupsSection(context.groups);
  return [
    `# Contexte du projet ${project}`,
    ...instructions,
    ...decisionsSection(context, instructions.length > 0),
    ...architectureSection(context.architecture),
    ...linksSection(links),
  ].join('\n');
}

/** Texte transmis à une session interactive, au plus. */
export const CONTEXT_LIMIT = 10_000;

const CUT = '\n\n[Contexte coupé : 10 000 caractères au plus.]';

/**
 * Texte transmis à une session : un bloc par projet, le projet principal d'abord, annoncés en tête quand il y en a
 * plusieurs, coupé à 10 000 caractères.
 */
export function sessionContextText(blocks: readonly { project: string; text: string }[]): string {
  const [principal, ...others] = blocks;
  const heading =
    principal && others.length > 0
      ? [
          `Session sur ${blocks.length} projets : ${principal.project} (projet principal, dossier de travail), puis ${others.map(({ project }) => project).join(', ')}.`,
        ]
      : [];
  const text = [...heading, ...blocks.map((block) => block.text)].join('\n\n');
  return text.length <= CONTEXT_LIMIT ? text : `${text.slice(0, CONTEXT_LIMIT - CUT.length)}${CUT}`;
}

/** Estimation grossière : un token pour quatre caractères. */
export function tokensOf(text: string): number {
  return Math.ceil(text.length / 4);
}
