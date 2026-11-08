/** Droits d'un dépôt pour le worker (E8a) : ils plafonnent les garde-fous de ses tâches (RF-TACH-05). */
export interface RepositoryRights {
  /** Agents au travail en même temps dans ce dépôt */
  concurrency: number;
  maxBudgetUsd: number;
  maxTurns: number;
  model: string;
  tools: string[];
}

/** Réglages généraux, appliqués tant qu'un dépôt n'a pas ses propres droits (E5a, annotation 4). */
export const DEFAULT_RIGHTS: RepositoryRights = {
  concurrency: 1,
  maxBudgetUsd: 2,
  maxTurns: 30,
  model: 'claude-sonnet-5-5',
  tools: ['Read', 'Write', 'Edit', 'Grep', 'Glob', 'Bash'],
};
