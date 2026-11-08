'use client';
import type { NotificationDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { byDay, toHandle } from '../../lib/notifications';
import { NotificationItem } from './notification-item';

export type NotificationFilter = 'all' | 'to-handle';

export interface NotificationListProps {
  busy: boolean;
  filter: NotificationFilter;
  notifications: NotificationDto[];
  now: Date;
  onAnswer: (notification: NotificationDto, allow: boolean) => void;
  onFilter: (filter: NotificationFilter) => void;
  onOpen: (notification: NotificationDto) => void;
}

/** Notifications rangées par jour, filtrées « À traiter » ou « Toutes » (E15a). */
export function NotificationList({
  busy,
  filter,
  notifications,
  now,
  onAnswer,
  onFilter,
  onOpen,
}: NotificationListProps) {
  const waiting = toHandle(notifications);
  const shown = filter === 'to-handle' ? waiting : notifications;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        role="tablist"
        aria-label="Filtrer les notifications"
        className="flex gap-1 border-b border-line px-3 py-2 text-xs"
      >
        {(
          [
            ['to-handle', `À traiter · ${waiting.length}`],
            ['all', 'Toutes'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filter === value}
            className={cn(
              'rounded-control px-2.5 py-1',
              filter === value ? 'bg-surface-alt font-medium' : 'text-muted hover:text-ink',
            )}
            onClick={() => onFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {shown.length === 0 && (
          <p className="px-4 py-6 text-center text-muted">
            {filter === 'to-handle'
              ? 'Rien à traiter : aucune question ne t’attend.'
              : 'Aucune notification ces 7 derniers jours.'}
          </p>
        )}
        {byDay(shown, now).map(({ label, notifications: grouped }) => (
          <section key={label} aria-label={label}>
            <h3 className="px-4 pt-3 text-xs font-semibold tracking-wider text-muted uppercase">{label}</h3>
            <ul className="divide-y divide-line">
              {grouped.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  now={now}
                  busy={busy}
                  onOpen={() => onOpen(notification)}
                  onAnswer={(allow) => onAnswer(notification, allow)}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
