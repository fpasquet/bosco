// Ce que les scénarios ne voient pas : le choix entre notification du bureau et message bref, et la priorité.
import { describe, expect, it } from 'vitest';
import type { NotificationRecord } from '../domain/notification.ts';
import { DEFAULT_NOTIFICATIONS } from '../domain/notification.ts';
import { NotificationService } from './notification.service.ts';

function service(options: { app?: boolean; desktop?: boolean; foreground?: boolean; inApp?: boolean } = {}) {
  const stored: NotificationRecord[] = [];
  const shown: { url: string; urgent: boolean }[] = [];
  const told: boolean[] = [];
  const notifications = new NotificationService(
    {
      add: (notification) => {
        const record = { ...notification, id: stored.length + 1 };
        stored.push(record);
        return Promise.resolve(record);
      },
      list: () => Promise.resolve(stored),
      markRead: () => Promise.resolve(),
      purge: () => Promise.resolve(),
      settle: () => Promise.resolve(0),
    },
    {
      desktopNotifications: () => options.desktop ?? true,
      notifications: () => ({ ...DEFAULT_NOTIFICATIONS, inAppWhenForeground: options.inApp ?? true }),
    },
    { show: (_notification, shownOptions) => void shown.push(shownOptions) },
    { appAttached: () => options.app ?? false, foreground: () => options.foreground ?? false },
    { changed: () => undefined, notified: (_notification, inApp) => void told.push(inApp) },
    { now: () => new Date('2026-11-06T15:13:00Z') },
    'http://127.0.0.1:4880',
  );
  return { notifications, shown, stored, told };
}

const session = {
  place: null,
  sessionId: 'c41e9a07',
  taskId: null,
  title: 'Specs du tableau de bord Bosco',
  excerpt: null,
};

describe('NotificationService', () => {
  it('shows a question on the desktop, urgent, opening its session (CA-SESS-85)', async () => {
    const { notifications, shown, told } = service();
    await notifications.notify({ kind: 'permission' }, session);
    await notifications.notify({ kind: 'review' }, { ...session, sessionId: null, taskId: 12 });
    expect(shown).toEqual([
      { url: 'http://127.0.0.1:4880/sessions/c41e9a07', urgent: true },
      { url: 'http://127.0.0.1:4880/tasks/12', urgent: false },
    ]);
    expect(told).toEqual([false, false]);
  });

  it('keeps it in Bosco when Bosco is in front, and stores it even without the desktop (CA-SESS-86)', async () => {
    const front = service({ foreground: true });
    await front.notifications.notify({ kind: 'permission' }, session);
    expect([front.shown.length, front.told]).toEqual([0, [true]]);
    const quiet = service({ desktop: false });
    await quiet.notifications.notify({ kind: 'permission' }, session);
    expect([quiet.shown.length, quiet.stored.length]).toEqual([0, 1]);
    const noToast = service({ foreground: true, inApp: false });
    await noToast.notifications.notify({ kind: 'permission' }, session);
    expect(noToast.shown).toHaveLength(1);
  });

  it('leaves the desktop notification to the desktop application when it is there (CA-APPS-03)', async () => {
    const { notifications, shown, told } = service({ app: true });
    await notifications.notify({ kind: 'permission' }, { ...session, excerpt: 'Bash · npm run db:migrate' });
    expect([shown.length, told]).toEqual([0, [false]]);
  });

  it('stores nothing for what the settings leave out', async () => {
    const { notifications, stored } = service();
    const none = await notifications.notify({ kind: 'turn', message: 'Tests verts.', minutes: 1 }, session);
    expect([none, stored.length]).toEqual([null, 0]);
  });
});
