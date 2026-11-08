import type { RightsReader } from './ports.ts';
import { DomainError } from '../../shared/domain/domain-error.ts';
import {
  DEFAULT_RIGHTS,
  effectiveRights,
  isTool,
  MODELS,
  overreach,
  type RepositoryRights,
  type RightsField,
  type RightsOrigin,
} from '../domain/rights.ts';

export interface RightsStore {
  general(): Promise<null | Partial<RepositoryRights>>;
  repository(name: string): Promise<Partial<RepositoryRights>>;
  saveGeneral(rights: RepositoryRights): Promise<void>;
  saveRepository(name: string, rights: Partial<RepositoryRights>): Promise<void>;
}

export class InvalidRights extends DomainError {
  constructor(message: string) {
    super('invalid_rights', message);
  }
}

/** Un changement : une valeur, ou null pour revenir au général (dépôt seulement). */
export type RightsChanges = { [Field in RightsField]?: null | RepositoryRights[Field] };

export interface RightsView {
  effective: RepositoryRights;
  general: RepositoryRights;
  origins: Record<RightsField, RightsOrigin>;
  /** Valeurs propres au dépôt ; null pour les réglages généraux */
  repository: null | Partial<RepositoryRights>;
}

const PULL_REQUEST_MODES = ['always', 'ask', 'never'];

const integer = (value: unknown, min: number, max: number) =>
  Number.isInteger(value) && Number(value) >= min && Number(value) <= max;
const toolList = (value: unknown) =>
  Array.isArray(value) && value.every((tool) => typeof tool === 'string' && isTool(tool));

/** Contrôle de chaque valeur, quel que soit le niveau : null si elle convient, sinon le message. */
const CHECKS: Record<RightsField, (value: unknown) => null | string> = {
  concurrency: (value) => (integer(value, 1, 8) ? null : 'Entre 1 et 8 agents en même temps.'),
  deniedTools: (value) => (toolList(value) ? null : 'Un outil par ligne, avec sa règle : Bash(curl:*) ou Read(.env*).'),
  maxBudgetUsd: (value) =>
    typeof value === 'number' && value > 0 && value <= 100 ? null : 'Un budget entre 0,01 et 100 $.',
  maxTurns: (value) => (integer(value, 1, 500) ? null : 'Entre 1 et 500 tours.'),
  model: (value) => ((MODELS as readonly unknown[]).includes(value) ? null : 'Un modèle de la liste.'),
  pullRequest: (value) =>
    PULL_REQUEST_MODES.includes(String(value)) ? null : 'Jamais, Demander à chaque fois ou Toujours.',
  tools: (value) =>
    toolList(value) && (value as string[]).length > 0 ? null : 'Au moins un outil, avec sa règle éventuelle.',
};

function invalid(field: RightsField, value: unknown): null | string {
  return CHECKS[field](value);
}

/** Droits des agents (E8a) : réglages généraux, valeurs propres à un dépôt, et droits effectifs. */
export class RightsService implements RightsReader {
  constructor(private readonly store: RightsStore) {}

  async general(): Promise<RepositoryRights> {
    const stored = await this.store.general();
    return { ...DEFAULT_RIGHTS, ...stored };
  }

  async rightsOf(repository: string): Promise<RepositoryRights> {
    const view = await this.view(repository);
    return view.effective;
  }

  async view(repository: null | string): Promise<RightsView> {
    const general = await this.general();
    if (repository === null) return { general, repository: null, ...this.effectiveOf(general, {}) };
    const own = await this.store.repository(repository);
    return { general, repository: own, ...this.effectiveOf(general, own) };
  }

  async updateGeneral(changes: RightsChanges): Promise<RightsView> {
    const next = { ...(await this.general()) };
    for (const [field, value] of Object.entries(changes) as [RightsField, unknown][]) {
      if (value === null) throw new InvalidRights('Les réglages généraux n’ont pas de valeur à reprendre.');
      const error = invalid(field, value);
      if (error) throw new InvalidRights(error);
      (next as Record<RightsField, unknown>)[field] = value;
    }
    await this.store.saveGeneral(next);
    return this.view(null);
  }

  async updateRepository(repository: string, changes: RightsChanges): Promise<RightsView> {
    const general = await this.general();
    const next: Record<string, unknown> = { ...(await this.store.repository(repository)) };
    for (const [field, value] of Object.entries(changes) as [RightsField, unknown][]) {
      if (value === null) {
        delete next[field];
        continue;
      }
      const error = invalid(field, value);
      if (error) throw new InvalidRights(error);
      next[field] = value;
    }
    const tooMuch = overreach(general, next);
    if (tooMuch) throw new InvalidRights(tooMuch);
    await this.store.saveRepository(repository, next);
    return this.view(repository);
  }

  private effectiveOf(general: RepositoryRights, own: Partial<RepositoryRights>) {
    const { origins, rights } = effectiveRights(general, own);
    return { effective: rights, origins };
  }
}
