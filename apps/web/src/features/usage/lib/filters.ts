/** Période de la page Usage : 7, 30 ou 90 jours jusqu'à aujourd'hui, ou depuis le début de l'historique conservé. */
export type UsagePeriod = '7' | '30' | '90' | 'all';

/** Filtres de la page Usage : ils valent pour toute la page, sauf le quota, et vivent dans l'adresse. */
export interface UsageFilters {
  model: null | string;
  period: UsagePeriod;
  profile: null | string;
  /** Projet ou groupe : un seul à la fois */
  scope: null | { id: number; kind: 'group' | 'project' };
}

export const DEFAULT_FILTERS: UsageFilters = { model: null, period: '30', profile: null, scope: null };

export const PERIODS: readonly { label: string; short: string; value: UsagePeriod }[] = [
  { value: '7', label: '7 j', short: '7 j' },
  { value: '30', label: '30 j', short: '30 j' },
  { value: '90', label: '90 j', short: '90 j' },
  { value: 'all', label: 'Depuis le début', short: 'Tout' },
];

function positive(value: null | string): null | number {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

/** Un projet l'emporte sur un groupe, comme dans l'API. */
function scopeOf(project: null | number, group: null | number): UsageFilters['scope'] {
  if (project) return { kind: 'project', id: project };
  return group ? { kind: 'group', id: group } : null;
}

/** Filtres lus dans l'adresse (`?period=7&group=2`) ; une valeur inconnue reprend sa valeur par défaut. */
export function filtersOf(params: URLSearchParams): UsageFilters {
  const period = params.get('period');
  const project = positive(params.get('project'));
  const group = positive(params.get('group'));
  return {
    period: PERIODS.some(({ value }) => value === period) ? (period as UsagePeriod) : DEFAULT_FILTERS.period,
    profile: params.get('profile') || null,
    scope: scopeOf(project, group),
    model: params.get('model') || null,
  };
}

/** Adresse des filtres : seules les valeurs qui diffèrent du défaut y figurent. */
export function searchOf(filters: UsageFilters): string {
  const params = new URLSearchParams();
  if (filters.period !== DEFAULT_FILTERS.period) params.set('period', filters.period);
  if (filters.profile) params.set('profile', filters.profile);
  if (filters.scope) params.set(filters.scope.kind, String(filters.scope.id));
  if (filters.model) params.set('model', filters.model);
  const search = params.toString();
  return search ? `?${search}` : '';
}

/** Paramètres de l'API : la période est toujours dite. */
export function apiSearchOf(filters: UsageFilters): string {
  const params = new URLSearchParams(searchOf(filters));
  params.set('period', filters.period);
  return `?${params.toString()}`;
}

export function isDefault(filters: UsageFilters): boolean {
  return searchOf(filters) === '';
}
