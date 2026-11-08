'use client';
import { useIsPhone } from '@/shared/hooks/use-is-phone';
import { useNow } from '@/shared/hooks/use-now';
import { useNotificationsDrawer } from '../../hooks/use-drawer';
import { useNotificationCenter } from '../../hooks/use-notification-center';
import { useNotificationsLive } from '../../hooks/use-notifications-live';
import { NotificationsDrawer } from '../notifications-drawer';

/**
 * Monté une fois par l'application (E15) : notifications en direct, présence de l'onglet, et le tiroir des
 * notifications que les cloches ouvrent sur ordinateur.
 */
export function NotificationsLive() {
  useNotificationsLive();
  const phone = useIsPhone();
  const { open, setOpen } = useNotificationsDrawer();
  const center = useNotificationCenter(() => setOpen(false));
  const now = useNow(60_000);
  if (phone) return null;
  return (
    <NotificationsDrawer
      open={open}
      unread={center.unread}
      notifications={center.notifications ?? []}
      filter={center.filter}
      now={now}
      busy={center.busy}
      onClose={() => setOpen(false)}
      onReadAll={center.readAll}
      onFilter={center.setFilter}
      onOpen={center.open}
      onAnswer={center.answer}
    />
  );
}
