import type { CostReportDto, HistoryDayDto, SessionStateDto } from '@bosco/domain';

/** Filtres de l'historique, partagés par la liste et les coûts (E3a, E3b). */
export interface HistoryFilters {
  /** Jours en arrière ; null : tout l'historique */
  days: null | number;
  profile: null | string;
  query: string;
  repository: null | string;
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
  if (filters.repository) params.set('repo', filters.repository);
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

export const costsQuery = (filters: HistoryFilters) => ({
  queryKey: ['history-costs', filters],
  queryFn: (): Promise<CostReportDto> => read<CostReportDto>(`/api/history/costs${searchOf(filters)}`),
});
