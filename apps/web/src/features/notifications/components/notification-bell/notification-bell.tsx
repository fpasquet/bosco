'use client';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useIsPhone } from '@/shared/hooks/use-is-phone';
import { notificationsQuery } from '../../api/notifications';
import { useNotificationsDrawer } from '../../hooks/use-drawer';

/**
 * Cloche des notifications, dans la coquille (E15a) : le nombre de non lues ; elle ouvre le tiroir sur ordinateur et
 * l'écran des notifications sur le téléphone.
 */
export function NotificationBell() {
  const router = useRouter();
  const phone = useIsPhone();
  const setOpen = useNotificationsDrawer((state) => state.setOpen);
  const { data } = useQuery(notificationsQuery);
  const unread = data?.unread ?? 0;
  return (
    <button
      type="button"
      aria-label={unread > 0 ? `Notifications : ${unread} non lues` : 'Notifications'}
      className="relative grid size-8 place-items-center rounded-control text-nav-muted hover:bg-nav-active hover:text-nav-ink"
      onClick={() => (phone ? router.push('/notifications') : setOpen(true))}
    >
      <Bell aria-hidden className="size-4" />
      {unread > 0 && (
        <span
          aria-hidden
          className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-xs leading-none font-semibold text-on-primary"
        >
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  );
}
