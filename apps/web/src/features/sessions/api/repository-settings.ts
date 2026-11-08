import type { DiscoverySettingsDto, RepositorySettingsDto } from '@bosco/domain';

/** Réglages › Dépôts (E4d) : réglages, dépôts trouvés et sessions hors dépôt git. */
export const repositorySettingsQuery = {
  queryKey: ['settings', 'repositories'],
  queryFn: async (): Promise<RepositorySettingsDto> => {
    const response = await fetch('/api/settings/repositories');
    if (!response.ok) throw new Error(`GET /api/settings/repositories answered ${response.status}`);
    return (await response.json()) as RepositorySettingsDto;
  },
};

/** Réglage refusé par Bosco (chemin relatif), avec son message. */
export class RepositorySettingRefused extends Error {}

export async function updateRepositorySettings(changes: Partial<DiscoverySettingsDto>): Promise<void> {
  const response = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ repositories: changes }),
  });
  if (response.status === 400) {
    const { message } = (await response.json()) as { message?: string };
    throw new RepositorySettingRefused(message ?? 'Ce réglage n’est pas valable.');
  }
  if (!response.ok) throw new Error(`PUT /api/settings answered ${response.status}`);
}
