import type { GroupDto } from '@bosco/domain';

/** Un groupe et ses projets, pour réunir leurs sessions dans sa page. */
export const groupQuery = (id: number) => ({
  queryKey: ['groups', id],
  queryFn: async (): Promise<GroupDto> => {
    const response = await fetch(`/api/groups/${id}`);
    if (!response.ok) throw new Error(`GET /api/groups/${id} answered ${response.status}`);
    return (await response.json()) as GroupDto;
  },
});
