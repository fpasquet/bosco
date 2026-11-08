// Notifications locales du téléphone (CA-APPS-06, CA-APPS-08) : l'interface de Bosco, dans la vue web, les transmet à
// l'application ; rien ne passe par un service de push.
import * as Notifications from 'expo-notifications';

export const CHANNEL = 'bosco';

/** Message de la vue web : une notification de Bosco, ou l'ouverture des réglages de l'application. */
export type BridgeMessage =
  { body: string; path: string; title: string; type: 'notification'; urgent: boolean } | { type: 'app-settings' };

export function parseBridgeMessage(data: string): BridgeMessage | null {
  try {
    const message = JSON.parse(data) as Partial<BridgeMessage>;
    if (message.type === 'app-settings') return { type: 'app-settings' };
    if (message.type === 'notification' && typeof message.title === 'string' && typeof message.path === 'string')
      return {
        type: 'notification',
        title: message.title,
        body: typeof message.body === 'string' ? message.body : '',
        path: message.path,
        urgent: message.urgent === true,
      };
  } catch {
    // message d'une autre origine
  }
  return null;
}

export async function setupNotifications(vibrate: boolean): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: () =>
      Promise.resolve({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Bosco',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: vibrate ? [0, 250, 150, 250] : null,
  });
  await Notifications.requestPermissionsAsync();
}

export async function notify(message: Extract<BridgeMessage, { type: 'notification' }>): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title: message.title, body: message.body, data: { path: message.path } },
    trigger: { channelId: CHANNEL },
  });
}
