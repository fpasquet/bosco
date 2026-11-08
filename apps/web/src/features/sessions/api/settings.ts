/** Réglages des sources (E4a). */
export interface SettingsDto {
  desktopNotifications: boolean;
  inactivityMinutes: number;
}

export const settingsQuery = {
  queryKey: ['settings'],
  queryFn: async (): Promise<SettingsDto> => {
    const response = await fetch('/api/settings');
    if (!response.ok) throw new Error(`GET /api/settings answered ${response.status}`);
    return (await response.json()) as SettingsDto;
  },
};

export async function updateSettings(changes: Partial<SettingsDto>): Promise<SettingsDto> {
  const response = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(changes),
  });
  if (!response.ok) throw new Error(`PUT /api/settings answered ${response.status}`);
  return (await response.json()) as SettingsDto;
}
