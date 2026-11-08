import type { DecisionSnapshot } from './decision.ts';
import { type SocleSnapshot, soclesOf } from './socle.ts';

/** Ce que le dépôt appelle et qui l'appelle, pour mesurer l'effet d'un changement ailleurs (E9a, annotation 4). */
export interface Architecture {
  calledBy: string[];
  calls: string[];
}

/** Lien d'une tâche transmis à l'agent : titre, nature et état, jamais le contenu ni les accès (CA-CONT-38). */
export interface ContextLink {
  kind: string;
  state: null | string;
  title: string;
}

export interface RepositoryContext {
  architecture: Architecture;
  /** Décisions acceptées du dépôt */
  decisions: DecisionSnapshot[];
  /** Décisions des socles écartées par une exception du dépôt */
  excluded: DecisionSnapshot[];
  proposed: DecisionSnapshot[];
  socles: { decisions: DecisionSnapshot[]; socle: SocleSnapshot }[];
}

function title(decision: DecisionSnapshot): string {
  return decision.versions.at(-1)?.title ?? '';
}

/** Le contexte d'un dépôt : ce qui est transmis, ce qui attend, ce qui est écarté (RF-CONT-01 à 03). */
export function contextOf(
  repository: string,
  decisions: readonly DecisionSnapshot[],
  socles: readonly SocleSnapshot[],
  architecture: Architecture,
): RepositoryContext {
  const own = decisions.filter(
    (decision) => decision.target.kind === 'repository' && decision.target.name === repository,
  );
  const accepted = own.filter((decision) => decision.state === 'accepted');
  const exceptions = new Set(accepted.map((decision) => decision.exceptionTo).filter((id) => id !== null));
  const applied = soclesOf(repository, socles).map((socle) => ({
    socle,
    decisions: decisions.filter(
      (decision) =>
        decision.target.kind === 'socle' && decision.target.id === socle.id && decision.state === 'accepted',
    ),
  }));
  return {
    decisions: accepted,
    proposed: own.filter((decision) => decision.state === 'proposed'),
    excluded: applied.flatMap(({ decisions: list }) => list.filter((decision) => exceptions.has(decision.id))),
    socles: applied.map(({ decisions: list, socle }) => ({
      socle,
      decisions: list.filter((decision) => !exceptions.has(decision.id)),
    })),
    architecture,
  };
}

/** Une décision dans le texte transmis : son titre, puis ce qui est décidé, sur une ligne. */
function decisionLines(decision: DecisionSnapshot, prefix: string, suffix = ''): string[] {
  const body = decision.versions.at(-1)?.decision.replaceAll('\n', ' ') ?? '';
  return [`- ${prefix}${title(decision)}${suffix}`, `  ${body}`];
}

function ownSection(context: RepositoryContext): string[] {
  if (context.decisions.length === 0) return [];
  return [
    '',
    '## Décisions du dépôt',
    ...context.decisions.flatMap((decision) => {
      const exception = context.excluded.find((excluded) => excluded.id === decision.exceptionTo);
      const suffix = exception ? ` (fait exception à « ${title(exception)} »)` : '';
      return decisionLines(decision, `DEC-${decision.id} `, suffix);
    }),
  ];
}

function soclesSection(context: RepositoryContext): string[] {
  const socles = context.socles.filter(({ decisions }) => decisions.length > 0);
  if (socles.length === 0) return [];
  return [
    '',
    '## Socles',
    ...socles.flatMap(({ decisions, socle }) => [
      socle.name,
      ...decisions.flatMap((decision) => decisionLines(decision, '')),
    ]),
  ];
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
    ...links.map((link) => `- ${[link.title, link.kind, link.state].filter(Boolean).join(' · ')}`),
  ];
}

/** Texte exact que lit l'agent au lancement (E9f) : décisions acceptées, socles, architecture, liens de la tâche. */
export function contextText(
  repository: string,
  context: RepositoryContext,
  links: readonly ContextLink[] = [],
): string {
  return [
    `# Contexte du dépôt ${repository}`,
    ...ownSection(context),
    ...soclesSection(context),
    ...architectureSection(context.architecture),
    ...linksSection(links),
  ].join('\n');
}

/** Estimation grossière : un token pour quatre caractères (E9f, annotation 3). */
export function tokensOf(text: string): number {
  return Math.ceil(text.length / 4);
}
