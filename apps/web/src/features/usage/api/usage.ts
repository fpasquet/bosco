import type { GroupsDto, ProjectsDto, QuotaDto, SourcesDto, UsageReportDto } from '@bosco/domain';
import { apiSearchOf, type UsageFilters } from '../lib/filters';

async function read<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`GET ${path} answered ${response.status}`);
  return (await response.json()) as T;
}

/** Usage des sessions pour les filtres de la page. */
export const usageQuery = (filters: UsageFilters) => ({
  queryKey: ['usage', filters],
  queryFn: () => read<UsageReportDto>(`/api/usage${apiSearchOf(filters)}`),
});

/** Quota de chaque abonnement et ses seuils : il ne se filtre pas. */
export const quotaQuery = { queryKey: ['quota'], queryFn: () => read<QuotaDto>('/api/quota') };

/** Profils surveillés, que propose le filtre de profil. */
export const profilesQuery = { queryKey: ['sources'], queryFn: () => read<SourcesDto>('/api/sources') };

/** Projets et groupes, que propose le filtre « projet ou groupe ». */
export const projectsQuery = { queryKey: ['projects', 'overview'], queryFn: () => read<ProjectsDto>('/api/projects') };

export const groupsQuery = {
  queryKey: ['groups'],
  queryFn: async () => {
    const { groups } = await read<GroupsDto>('/api/groups');
    return groups;
  },
};
