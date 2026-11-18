// Notifications locales du téléphone : l'interface de Bosco, dans la vue web, les transmet à
// l'application ; rien ne passe par un service de push.
import * as Notifications from 'expo-notifications';
import type { BridgeMessage } from './bridge';

export const CHANNEL = 'bosco';

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
