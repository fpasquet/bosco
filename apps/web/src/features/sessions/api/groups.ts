import type { GroupDto, GroupsDto } from '@bosco/domain';

/** Un groupe et ses projets, pour réunir leurs sessions dans sa page. */
export const groupQuery = (id: number) => ({
  queryKey: ['groups', id],
  queryFn: async (): Promise<GroupDto> => {
    const response = await fetch(`/api/groups/${id}`);
    if (!response.ok) throw new Error(`GET /api/groups/${id} answered ${response.status}`);
    return (await response.json()) as GroupDto;
  },
});

/** Tous les groupes, « Tous les projets » compris : la nouvelle session les propose avant les projets (E16a). */
export const groupsQuery = {
  queryKey: ['groups'],
  queryFn: async (): Promise<GroupDto[]> => {
    const response = await fetch('/api/groups');
    if (!response.ok) throw new Error(`GET /api/groups answered ${response.status}`);
    const body = (await response.json()) as GroupsDto;
    return body.groups;
  },
};
