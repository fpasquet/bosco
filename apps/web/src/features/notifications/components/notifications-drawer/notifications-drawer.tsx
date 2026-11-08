'use client';
import { Settings, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import type { NotificationDto } from '@bosco/domain';
import { Button } from '@/shared/ui/button';
import { type NotificationFilter, NotificationList } from '../notification-list';

export interface NotificationsDrawerProps {
  busy: boolean;
  filter: NotificationFilter;
  notifications: NotificationDto[];
  now: Date;
  onAnswer: (notification: NotificationDto, allow: boolean) => void;
  onClose: () => void;
  onFilter: (filter: NotificationFilter) => void;
  onOpen: (notification: NotificationDto) => void;
  onReadAll: () => void;
  open: boolean;
  unread: number;
}

/**
 * Tiroir des notifications (E15a) : à droite, sur toute la hauteur, au-dessus de l'écran en cours. La croix, Échap
 * ou un clic à côté le referment.
 */
export function NotificationsDrawer({ onClose, onReadAll, open, unread, ...list }: NotificationsDrawerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (open && element && !element.open) element.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      aria-labelledby="notifications-title"
      className="modal items-stretch justify-items-end transition-none"
      onClose={onClose}
    >
      <div className="modal-box flex h-dvh max-h-dvh w-full max-w-md scale-100 flex-col rounded-none p-0 transition-none">
        <div className="flex items-center gap-2 border-b border-line p-4">
          <h2 id="notifications-title" className="font-display text-lg font-semibold">
            Notifications
          </h2>
          {unread > 0 && (
            <span className="badge badge-sm badge-primary">{unread > 1 ? `${unread} non lues` : '1 non lue'}</span>
          )}
          <Button
            variant="ghost"
            size="xs"
            className="ml-auto text-primary"
            disabled={unread === 0}
            onClick={onReadAll}
          >
            Tout marquer comme lu
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Fermer les notifications" onClick={onClose}>
            <X aria-hidden className="size-4" />
          </Button>
        </div>
        <NotificationList {...list} />
        <div className="flex items-center border-t border-line px-4 py-3 text-xs">
          <span className="text-muted">Gardées 7 jours</span>
          <Link
            href="/settings/notifications"
            className="ml-auto inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
            onClick={onClose}
          >
            <Settings aria-hidden className="size-3.5" />
            Réglages des notifications
          </Link>
        </div>
      </div>
      {/* Un clic à côté du tiroir le referme */}
      <form method="dialog" className="modal-backdrop">
        <button type="submit">Fermer</button>
      </form>
    </dialog>
  );
}
