import type { SessionDto } from '@bosco/domain';

const WEEKDAY = new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'short', weekday: 'long' });

/** « Aujourd'hui », « Hier », ou « mardi 4 nov. » pour un jour AAAA-MM-JJ. */
export function dayTitle(date: string, now: Date): string {
  const today = now.toLocaleDateString('sv');
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toLocaleDateString('sv');
  if (date === today) return 'Aujourd’hui';
  if (date === yesterday) return 'Hier';
  const label = WEEKDAY.format(new Date(`${date}T12:00:00`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** « labo-ia · packages/rag », « labo-ia · racine du projet » */
export function whereOf(session: SessionDto): string {
  if (!session.project) return session.projectPath ?? 'Hors projet';
  return `${session.project.name} · ${session.project.folder || 'racine du projet'}`;
}
