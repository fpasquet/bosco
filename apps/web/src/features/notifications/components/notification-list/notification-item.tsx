'use client';
import { CircleCheck, CircleX, Flag, Hand, ListChecks, LogOut, MessageCircleQuestion } from 'lucide-react';
import type { NotificationDto } from '@bosco/domain';
import { cn } from '@/lib/cn';
import { Button } from '@/shared/ui/button';
import { kindLabel, timeOf } from '../../lib/notifications';

const LOOKS: Record<NotificationDto['kind'], { icon: typeof Hand; tone: string }> = {
  ended: { icon: LogOut, tone: 'bg-surface-alt text-muted' },
  failed: { icon: CircleX, tone: 'bg-danger-soft text-danger' },
  'long-turn': { icon: Flag, tone: 'bg-surface-alt text-muted' },
  permission: { icon: Hand, tone: 'bg-warning-soft text-warning' },
  question: { icon: ListChecks, tone: 'bg-warning-soft text-warning' },
  review: { icon: CircleCheck, tone: 'bg-primary-soft text-primary' },
  'turn-question': { icon: MessageCircleQuestion, tone: 'bg-warning-soft text-warning' },
};

export interface NotificationItemProps {
  busy: boolean;
  notification: NotificationDto;
  now: Date;
  onAnswer: (allow: boolean) => void;
  onOpen: () => void;
}

/**
 * Une notification (E15a) : son type, la session ou la tâche, un extrait et l'heure ; une autorisation encore en
 * attente se répond ici, le reste s'ouvre d'un clic. Une notification traitée le dit.
 */
export function NotificationItem({ busy, notification, now, onAnswer, onOpen }: NotificationItemProps) {
  const { icon: Icon, tone } = LOOKS[notification.kind];
  const unread = notification.readAt === null;
  const answerable = notification.kind === 'permission' && notification.settled === null && notification.sessionId;
  return (
    <li className={cn('relative flex gap-3 px-4 py-3', unread && 'bg-primary-soft/40')}>
      <span
        aria-hidden
        className={cn('mt-1.5 size-2 shrink-0 rounded-full', unread ? 'bg-primary' : 'bg-transparent')}
      />
      <span aria-hidden className={cn('grid size-8 shrink-0 place-items-center rounded-full', tone)}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-muted">{kindLabel(notification)}</span>
          {unread && <span className="sr-only">(non lue)</span>}
          <span className="ml-auto shrink-0 font-mono text-xs text-muted">{timeOf(notification.at, now)}</span>
        </p>
        <button type="button" className="block w-full truncate text-left font-medium hover:underline" onClick={onOpen}>
          {notification.title}
        </button>
        {(notification.excerpt || notification.settled) && (
          <p className="truncate text-xs text-muted">
            {[notification.excerpt, notification.settled?.toLowerCase()].filter(Boolean).join(' · ')}
          </p>
        )}
        {answerable && (
          <div className="mt-2 flex gap-2">
            <Button size="sm" disabled={busy} onClick={() => onAnswer(true)}>
              Autoriser
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onAnswer(false)}>
              Refuser
            </Button>
            <Button size="sm" variant="ghost" className="text-muted" onClick={onOpen}>
              Ouvrir
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}
