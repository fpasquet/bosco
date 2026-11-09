'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { NotificationDto } from '@bosco/domain';
import { useNotices } from '@/shared/hooks/use-notices';
import type { NotificationFilter } from '../components/notification-list';
import { answerFromNotification, markRead, notificationsQuery } from '../api/notifications';
import { hrefOf } from '../lib/notifications';

/** Centre de notifications (E15a) : la liste, le filtre, ouvrir (et marquer lue), répondre, tout marquer comme lu. */
export function useNotificationCenter(onLeave: () => void = () => undefined) {
  const client = useQueryClient();
  const router = useRouter();
  const notify = useNotices((state) => state.push);
  const { data } = useQuery(notificationsQuery);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const refresh = () => client.invalidateQueries({ queryKey: ['notifications'] });
  const read = useMutation({ mutationFn: markRead, onSuccess: refresh });
  const answer = useMutation({
    mutationFn: ({ allow, notification }: { allow: boolean; notification: NotificationDto }) =>
      answerFromNotification(notification.sessionId ?? '', allow),
    onSuccess: async (answered, { allow, notification }) => {
      if (answered) notify(`${allow ? 'Autorisé' : 'Refusé'} · ${notification.title}`, allow ? 'success' : 'info');
      else notify(`Répondu dans le terminal · ${notification.title}`, 'info');
      await refresh();
    },
  });
  return {
    busy: answer.isPending || read.isPending,
    filter,
    notifications: data?.notifications ?? null,
    unread: data?.unread ?? 0,
    setFilter,
    readAll: () => read.mutate(null),
    open: (notification: NotificationDto) => {
      if (notification.readAt === null) read.mutate(notification.id);
      onLeave();
      router.push(hrefOf(notification));
    },
    answer: (notification: NotificationDto, allow: boolean) => {
      if (notification.readAt === null) read.mutate(notification.id);
      answer.mutate({ allow, notification });
    },
  };
}
