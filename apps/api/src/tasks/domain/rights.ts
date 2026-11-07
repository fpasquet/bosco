/** PR en brouillon à la validation d'une tâche (E7c) : jamais, sur demande, ou toujours. */
export type PullRequestMode = 'always' | 'ask' | 'never';

/** Droits d'un dépôt pour le worker (E8a) : ils plafonnent les garde-fous de ses tâches (RF-TACH-05). */
export interface RepositoryRights {
  /** Agents au travail en même temps dans ce dépôt */
  concurrency: number;
  /** Outils interdits, passés à Claude Code : ceux du général et du dépôt s'additionnent */
  deniedTools: string[];
  maxBudgetUsd: number;
  maxTurns: number;
  model: string;
  pullRequest: PullRequestMode;
  tools: string[];
}

export type RightsField = keyof RepositoryRights;

/** Réglages généraux d'origine, appliqués tant qu'ils ne sont pas changés (E5a, annotation 4). */
export const DEFAULT_RIGHTS: RepositoryRights = {
  concurrency: 1,
  deniedTools: [],
  maxBudgetUsd: 2,
  maxTurns: 30,
  model: 'claude-sonnet-5-5',
  pullRequest: 'never',
  tools: ['Read', 'Write', 'Edit', 'Grep', 'Glob', 'Bash'],
};

/** Modèles proposés aux agents. */
export const MODELS = ['claude-sonnet-5-5', 'claude-opus-5-5', 'claude-haiku-5-5'] as const;

export type RightsOrigin = 'dépôt' | 'général' | 'général + dépôt';

/** Droits effectifs d'un dépôt, chacun avec son origine (E8a, colonne « Effectif »). */
export function effectiveRights(
  general: RepositoryRights,
  repository: Partial<RepositoryRights>,
): { origins: Record<RightsField, RightsOrigin>; rights: RepositoryRights } {
  const rights = { ...general, ...repository };
  // Des réglages généraux resserrés depuis valent aussi pour le dépôt
  rights.maxBudgetUsd = Math.min(rights.maxBudgetUsd, general.maxBudgetUsd);
  rights.maxTurns = Math.min(rights.maxTurns, general.maxTurns);
  rights.tools = rights.tools.filter((tool) => covers(general.tools, tool));
  const origins = Object.fromEntries(
    (Object.keys(general) as RightsField[]).map((field) => [field, field in repository ? 'dépôt' : 'général']),
  ) as Record<RightsField, RightsOrigin>;
  if (repository.deniedTools) {
    rights.deniedTools = [...new Set([...general.deniedTools, ...repository.deniedTools])];
    if (general.deniedTools.length > 0) origins.deniedTools = 'général + dépôt';
  }
  return { rights, origins };
}

/** « Bash(npm test) » est couvert par « Bash » ; un outil l'est par lui-même. */
function covers(allowed: readonly string[], tool: string): boolean {
  const open = tool.indexOf('(');
  const base = open === -1 ? tool : tool.slice(0, open);
  return allowed.includes(tool) || allowed.includes(base);
}

/** Un outil de Claude Code, avec sa règle éventuelle : « Read », « Bash(npm test) », « Read(.env*) ». */
export function isTool(value: string): boolean {
  return /^[A-Z][A-Za-z]+(\([^()\n]{1,200}\))?$/.test(value);
}

/**
 * Ce qu'un réglage du dépôt aurait de trop : un dépôt resserre le général, il ne le dépasse jamais (règle 5). Les
 * outils interdits s'ajoutent, ils ne resserrent rien.
 */
export function overreach(general: RepositoryRights, repository: Partial<RepositoryRights>): null | string {
  if (repository.maxBudgetUsd !== undefined && repository.maxBudgetUsd > general.maxBudgetUsd)
    return 'Le budget du dépôt ne dépasse pas celui des réglages généraux.';
  if (repository.maxTurns !== undefined && repository.maxTurns > general.maxTurns)
    return 'Le nombre de tours du dépôt ne dépasse pas celui des réglages généraux.';
  if (repository.tools?.some((tool) => !covers(general.tools, tool)))
    return 'Un outil permis au dépôt doit l’être dans les réglages généraux.';
  return null;
}
