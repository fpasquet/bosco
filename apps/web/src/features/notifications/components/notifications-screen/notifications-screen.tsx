'use client';
import { SectionSkeleton } from '@/shared/components/section-skeleton';
import { useNow } from '@/shared/hooks/use-now';
import { Button } from '@/shared/ui/button';
import { useNotificationCenter } from '../../hooks/use-notification-center';
import { NotificationList } from '../notification-list';

/** Notifications sur le téléphone (E15a mobile) : écran poussé depuis la cloche, mêmes filtres et réponses. */
export function NotificationsScreen() {
  const center = useNotificationCenter();
  const now = useNow(60_000);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2 md:px-8 md:pt-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Notifications</h1>
        <Button
          variant="ghost"
          size="xs"
          className="ml-auto text-primary"
          disabled={center.unread === 0}
          onClick={center.readAll}
        >
          Tout lire
        </Button>
      </div>
      {center.notifications ? (
        <NotificationList
          notifications={center.notifications}
          filter={center.filter}
          now={now}
          busy={center.busy}
          onFilter={center.setFilter}
          onOpen={center.open}
          onAnswer={center.answer}
        />
      ) : (
        <SectionSkeleton rows={4} />
      )}
    </div>
  );
}
