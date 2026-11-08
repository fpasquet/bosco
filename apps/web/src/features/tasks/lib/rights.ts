import type { PullRequestModeDto, RightsFieldDto, RightsValuesDto } from '@bosco/domain';
import { usd } from './tasks';

const TOOL_LABELS: Record<string, string> = {
  Bash: 'Bash',
  Edit: 'Modifier',
  Glob: 'Chercher des fichiers',
  Grep: 'Chercher',
  Read: 'Lire',
  Write: 'Écrire',
};

/** « Lire », « Bash (npm test) », « Lire (.env*) » */
export function toolLabel(tool: string): string {
  const open = tool.indexOf('(');
  const base = open === -1 ? tool : tool.slice(0, open);
  const rule = open === -1 ? '' : ` ${tool.slice(open)}`;
  return `${TOOL_LABELS[base] ?? base}${rule}`;
}

/** « claude-sonnet-5-5 » → « Sonnet 5.5 » */
export function modelLabel(model: string): string {
  const match = /^claude-([a-z]+)-(\d+)-(\d+)$/.exec(model);
  if (!match) return model;
  const [, family = '', major, minor] = match;
  return `${family.charAt(0).toUpperCase()}${family.slice(1)} ${major}.${minor}`;
}

export const PULL_REQUEST_LABELS: Record<PullRequestModeDto, string> = {
  never: 'Jamais',
  ask: 'Demander à chaque fois',
  always: 'Toujours',
};

export const RIGHTS_LABELS: Record<RightsFieldDto, string> = {
  tools: 'Outils permis',
  deniedTools: 'Outils interdits',
  maxTurns: 'Tours au plus',
  maxBudgetUsd: 'Budget au plus',
  model: 'Modèle',
  concurrency: 'Agents en même temps',
  pullRequest: 'PR brouillon à la validation',
};

/** Ordre des lignes de l'écran des droits (E8a). */
export const RIGHTS_FIELDS = Object.keys(RIGHTS_LABELS) as RightsFieldDto[];

/** Une valeur, telle qu'elle se lit dans le tableau. */
export function rightsValue<Field extends RightsFieldDto>(field: Field, value: RightsValuesDto[Field]): string {
  switch (field) {
    case 'tools':
    case 'deniedTools': {
      const list = value as string[];
      return list.length > 0 ? list.map(toolLabel).join(', ') : 'aucun';
    }
    case 'maxBudgetUsd':
      return usd(value as number);
    case 'model':
      return modelLabel(value as string);
    case 'pullRequest':
      return PULL_REQUEST_LABELS[value as PullRequestModeDto];
    default:
      return String(value);
  }
}
