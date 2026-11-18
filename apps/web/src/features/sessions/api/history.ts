import type { HistoryDayDto, SessionStateDto } from '@bosco/domain';

/** Filtres de l'historique (E3a), qui se cumulent. */
export interface HistoryFilters {
  /** Jours en arrière ; null : tout l'historique */
  days: null | number;
  /** Groupe : les sessions de tous ses projets */
  group: null | number;
  profile: null | string;
  query: string;
  project: null | string;
  state: null | SessionStateDto;
}

function startOf(days: number): string {
  const start = new Date();
  start.setDate(start.getDate() - days + 1);
  return start.toLocaleDateString('sv');
}

function searchOf(filters: HistoryFilters): string {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set('q', filters.query.trim());
  if (filters.days) params.set('from', startOf(filters.days));
  if (filters.project) params.set('project', filters.project);
  if (filters.group) params.set('group', String(filters.group));
  if (filters.profile) params.set('source', filters.profile);
  if (filters.state) params.set('state', filters.state);
  const search = params.toString();
  return search ? `?${search}` : '';
}

async function read<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`GET ${path} answered ${response.status}`);
  return (await response.json()) as T;
}

export const historyQuery = (filters: HistoryFilters) => ({
  queryKey: ['history', filters],
  queryFn: async (): Promise<HistoryDayDto[]> =>
    (await read<{ days: HistoryDayDto[] }>(`/api/history${searchOf(filters)}`)).days,
});
