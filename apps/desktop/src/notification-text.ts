// Texte d'une notification native de l'application du poste (CA-APPS-03) : le même que celui de notify-send (E15b),
// en texte simple, le type et le dépôt en titre, la session en première ligne.
import type { NotificationDto } from '@bosco/domain';

const KIND_LABELS: Record<NotificationDto['kind'], string> = {
  ended: 'Session terminée',
  failed: 'En échec',
  'long-turn': 'Fin de tour',
  permission: 'Autorisation',
  question: 'Question de l’agent',
  review: 'À relire',
  'turn-question': 'Question',
};

const SUBJECT_MAX = 60;

function shortTitle(title: string): string {
  if (title.length <= SUBJECT_MAX) return title;
  const cut = title.slice(0, SUBJECT_MAX - 1);
  const space = cut.lastIndexOf(' ');
  return `${space > 0 ? cut.slice(0, space) : cut}…`;
}

export function nativeText(notification: NotificationDto): { body: string; title: string } {
  const label =
    notification.kind === 'long-turn' && notification.turnMinutes !== null
      ? `${KIND_LABELS['long-turn']} · ${notification.turnMinutes} min`
      : KIND_LABELS[notification.kind];
  const subject = shortTitle(notification.title);
  const excerpt = notification.excerpt ?? '';
  if (!notification.place) return { title: `${label} · ${subject}`, body: excerpt };
  return { title: `${label} · ${notification.place}`, body: [subject, excerpt].filter(Boolean).join('\n') };
}

/** Adresse que la notification ouvre dans la fenêtre : la tâche, la session, ou la vue d'ensemble. */
export function pathOf(notification: NotificationDto): string {
  if (notification.taskId !== null) return `/tasks/${notification.taskId}`;
  return notification.sessionId ? `/sessions/${notification.sessionId}` : '/';
}
