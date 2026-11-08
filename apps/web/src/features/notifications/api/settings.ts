/** Ce qui mérite une notification, type par type (E15b). */
export interface NotificationSettingsDto {
  ended: boolean;
  failed: boolean;
  inAppWhenForeground: boolean;
  longTurnMinutes: number;
  permission: boolean;
  question: boolean;
  review: boolean;
  turn: 'always' | 'long' | 'never';
  turnQuestion: boolean;
}

interface SettingsDto {
  desktopNotifications: boolean;
  notifications: NotificationSettingsDto;
}

export const notificationSettingsQuery = {
  queryKey: ['settings'],
  queryFn: async (): Promise<SettingsDto> => {
    const response = await fetch('/api/settings');
    if (!response.ok) throw new Error(`GET /api/settings answered ${response.status}`);
    return (await response.json()) as SettingsDto;
  },
};

export async function updateNotificationSettings(changes: {
  desktopNotifications?: boolean;
  notifications?: Partial<NotificationSettingsDto>;
}): Promise<SettingsDto> {
  const response = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(changes),
  });
  if (!response.ok) throw new Error(`PUT /api/settings answered ${response.status}`);
  return (await response.json()) as SettingsDto;
}
