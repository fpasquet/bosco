import type { NotificationDto } from '@bosco/domain';

export type NotificationKind = NotificationDto['kind'];

/** Ce qui attend une réponse : ces notifications restent en tête et en message bref jusqu'à ce qu'on les ouvre. */
export const ASKING: readonly NotificationKind[] = ['permission', 'question', 'turn-question'];

const LABELS: Record<NotificationKind, string> = {
  ended: 'Session terminée',
  failed: 'En échec',
  'long-turn': 'Fin de tour',
  permission: 'Autorisation',
  question: 'Question de l’agent',
  review: 'À relire',
  'turn-question': 'Question de fin de tour',
};

/** Type en tête d'une notification (« Fin de tour · 12 min »). */
export function kindLabel(notification: Pick<NotificationDto, 'kind' | 'turnMinutes'>): string {
  const label = LABELS[notification.kind];
  return notification.kind === 'long-turn' && notification.turnMinutes !== null
    ? `${label} · ${notification.turnMinutes} min`
    : label;
}

/** Où mène une notification : la tâche, ou la session. */
export function hrefOf(notification: Pick<NotificationDto, 'sessionId' | 'taskId'>): string {
  if (notification.taskId !== null) return `/tasks/${notification.taskId}`;
  return notification.sessionId ? `/sessions/${encodeURIComponent(notification.sessionId)}` : '/';
}

/** « À traiter » : ce qui attend encore une réponse ou une relecture. */
export function toHandle(notifications: readonly NotificationDto[]): NotificationDto[] {
  return notifications.filter(
    ({ kind, settled }) => settled === null && (ASKING.includes(kind) || kind === 'review' || kind === 'failed'),
  );
}

function dayLabel(day: number, today: number, at: string): string {
  if (day === today) return 'Aujourd’hui';
  if (day === today - 86_400_000) return 'Hier';
  return new Date(at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Notifications rangées par jour : « Aujourd'hui », « Hier », puis la date. */
export function byDay(
  notifications: readonly NotificationDto[],
  now: Date,
): { label: string; notifications: NotificationDto[] }[] {
  const dayOf = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const today = dayOf(now);
  const groups = new Map<string, NotificationDto[]>();
  for (const notification of notifications) {
    const day = dayOf(new Date(notification.at));
    const label = dayLabel(day, today, notification.at);
    groups.set(label, [...(groups.get(label) ?? []), notification]);
  }
  return [...groups.entries()].map(([label, grouped]) => ({ label, notifications: grouped }));
}

/** Heure d'une notification : « 15:13 » aujourd'hui, « hier 11:52 », sinon la date. */
export function timeOf(at: string, now: Date): string {
  const date = new Date(at);
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (date.toDateString() === now.toDateString()) return time;
  const yesterday = new Date(now.getTime() - 86_400_000);
  if (date.toDateString() === yesterday.toDateString()) return `hier ${time}`;
  return `${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${time}`;
}
