import type { GroupsDto } from '@bosco/domain';

/** Groupes de projets, lus pour la barre latérale (même clé que la page des projets, qui les change). */
export const sidebarGroupsQuery = {
  queryKey: ['groups'],
  queryFn: async () => {
    const response = await fetch('/api/groups');
    if (!response.ok) throw new Error(`GET /api/groups answered ${response.status}`);
    const { groups } = (await response.json()) as GroupsDto;
    return groups;
  },
};
