'use client';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { LiveEventDto } from '@bosco/domain';
import { postToAndroidApp } from '@/shared/hooks/use-android-app';
import { useNotices } from '@/shared/hooks/use-notices';
import { reportPresence } from '../api/notifications';
import { ASKING, hrefOf, kindLabel } from '../lib/notifications';

/** L'onglet redit qu'il est au premier plan à cet intervalle (moins que le délai de l'API, 30 s). */
const PRESENCE_MS = 15_000;

function foreground(): boolean {
  return document.visibilityState === 'visible' && document.hasFocus();
}

/**
 * Notifications en direct (E15) : le centre se relit à chaque notification, une notification qui arrive pendant que
 * l'onglet est au premier plan s'affiche en message bref, et l'onglet dit au service s'il est devant toi.
 */
export function useNotificationsLive(): void {
  const client = useQueryClient();
  const router = useRouter();
  const push = useNotices((state) => state.push);
  useEffect(() => {
    const source = new EventSource('/api/events');
    const refresh = () => void client.invalidateQueries({ queryKey: ['notifications'] });
    source.addEventListener('notifications.changed', refresh);
    source.addEventListener('notification.created', (message: MessageEvent<string>) => {
      refresh();
      const event = JSON.parse(message.data) as Extract<LiveEventDto, { type: 'notification.created' }>['data'];
      const { notification } = event;
      const asking = ASKING.includes(notification.kind);
      // Dans l'application Android, la notification part au téléphone, sans service de push (CA-APPS-06)
      const subject = notification.place ?? notification.title;
      const sent = postToAndroidApp({
        type: 'notification',
        title: `${kindLabel(notification)} · ${subject}`,
        body: [notification.place ? notification.title : null, notification.excerpt].filter(Boolean).join('\n'),
        path: hrefOf(notification),
        urgent: asking,
      });
      if (sent || !event.inApp) return;
      push(
        `${kindLabel(notification)} · ${notification.title}`,
        asking ? 'warning' : 'info',
        { label: 'Ouvrir', run: () => router.push(hrefOf(notification)) },
        { line: notification.excerpt ?? undefined, persistent: asking },
      );
    });
    return () => source.close();
  }, [client, push, router]);
  useEffect(() => {
    const report = () => reportPresence(foreground());
    report();
    const timer = setInterval(() => {
      if (foreground()) report();
    }, PRESENCE_MS);
    window.addEventListener('focus', report);
    window.addEventListener('blur', report);
    document.addEventListener('visibilitychange', report);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', report);
      window.removeEventListener('blur', report);
      document.removeEventListener('visibilitychange', report);
    };
  }, []);
}
