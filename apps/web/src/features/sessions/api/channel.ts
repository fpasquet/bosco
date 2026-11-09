import type { ChannelProfileDto } from '@bosco/domain';

/** Canal de Bosco dans les profils surveillés (E4f) : installé ou non, et la commande de lancement. */
export const channelProfilesQuery = {
  queryKey: ['channel', 'profiles'],
  queryFn: async (): Promise<ChannelProfileDto[]> => {
    const response = await fetch('/api/channel/profiles');
    if (!response.ok) throw new Error(`GET /api/channel/profiles answered ${response.status}`);
    const body = (await response.json()) as { profiles: ChannelProfileDto[] };
    return body.profiles;
  },
};

export async function installChannel(path: string): Promise<void> {
  const response = await fetch('/api/channel/profiles', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path }),
  });
  if (!response.ok) throw new Error('Le canal de Bosco ne s’est pas installé.');
}

export async function uninstallChannel(path: string): Promise<void> {
  const response = await fetch(`/api/channel/profiles?path=${encodeURIComponent(path)}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Le canal de Bosco ne s’est pas retiré.');
}
