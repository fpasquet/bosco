import type { DiscoverySettingsDto, ProjectSettingsDto } from '@bosco/domain';

/** Réglages › Projets (E4d) : réglages, projets trouvés et sessions hors projet. */
export const projectSettingsQuery = {
  queryKey: ['settings', 'projects'],
  queryFn: async (): Promise<ProjectSettingsDto> => {
    const response = await fetch('/api/settings/projects');
    if (!response.ok) throw new Error(`GET /api/settings/projects answered ${response.status}`);
    return (await response.json()) as ProjectSettingsDto;
  },
};

/** Réglage refusé par Bosco (chemin relatif), avec son message. */
export class ProjectSettingRefused extends Error {}

export async function updateProjectSettings(changes: Partial<DiscoverySettingsDto>): Promise<void> {
  const response = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ projects: changes }),
  });
  if (response.status === 400) {
    const { message } = (await response.json()) as { message?: string };
    throw new ProjectSettingRefused(message ?? 'Ce réglage n’est pas valable.');
  }
  if (!response.ok) throw new Error(`PUT /api/settings answered ${response.status}`);
}
