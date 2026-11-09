import type { NotificationDto, SessionDetailDto } from '@bosco/domain';

/** Centre de notifications (E15a) : 7 jours, les plus récentes d'abord, et le nombre de non lues. */
export const notificationsQuery = {
  queryKey: ['notifications'],
  queryFn: async (): Promise<{ notifications: NotificationDto[]; unread: number }> => {
    const response = await fetch('/api/notifications');
    if (!response.ok) throw new Error(`GET /api/notifications answered ${response.status}`);
    return (await response.json()) as { notifications: NotificationDto[]; unread: number };
  },
};

/** Une notification ouverte, ou toutes (null) : « Tout marquer comme lu ». */
export async function markRead(id: null | number): Promise<void> {
  const response = await fetch('/api/notifications/read', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) throw new Error(`POST /api/notifications/read answered ${response.status}`);
}

/**
 * Réponse à une autorisation depuis une notification : la demande en cours de la session, puis la réponse. false
 * quand il n'y a plus de demande ou que le terminal a répondu le premier.
 */
export async function answerFromNotification(sessionId: string, allow: boolean): Promise<boolean> {
  const detail = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}`);
  if (!detail.ok) return false;
  const { session } = (await detail.json()) as SessionDetailDto;
  if (session.waiting?.kind !== 'permission') return false;
  const response = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}/permission`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(
      allow
        ? { behavior: 'allow', requestId: session.waiting.requestId }
        : { behavior: 'deny', reason: null, requestId: session.waiting.requestId },
    ),
  });
  return response.ok;
}

/** L'onglet du poste se dit au premier plan, ou ne l'est plus (E15b) ; le téléphone, refusé, n'en dit rien. */
export function reportPresence(foreground: boolean): void {
  void fetch('/api/presence', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ foreground }),
    keepalive: true,
  }).catch(() => undefined);
}
