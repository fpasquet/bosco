// Menu de la barre système (E17a, CA-APPS-02), décrit sans Electron : le processus principal le traduit en menu natif.
import type { SessionDto } from '@bosco/domain';
import { displayVersion } from './update.ts';

export type TrayAction =
  | { kind: 'autostart' }
  | { kind: 'new-session' }
  | { kind: 'open'; path: string }
  | { kind: 'pause' }
  | { kind: 'quit' }
  | { kind: 'relaunch' };

export type TrayItem =
  | { action: TrayAction; checked?: boolean; label: string; type: 'checkbox' | 'normal' }
  | { label: string; type: 'header' }
  | { type: 'separator' };

/** Ce qu'attend une session, sur une ligne : la commande à autoriser, la question, ou la fin du tour. */
function waitingLine(session: SessionDto): string {
  const title = session.title ?? `Session ${session.id.slice(0, 8)}`;
  const { waiting } = session;
  if (waiting?.kind === 'permission') return `${title} · ${[waiting.tool, waiting.detail].filter(Boolean).join(' ')}`;
  if (waiting?.kind === 'question') return `${title} · question de l’agent`;
  return `${title} · tour terminé`;
}

/** Sessions qui t'attendent, la plus ancienne attente d'abord, comme le bandeau T'attend. */
export function waitingSessions(sessions: Iterable<SessionDto>): SessionDto[] {
  return [...sessions]
    .filter((session) => session.state === 'waiting')
    .toSorted((a, b) => (a.waiting?.since ?? '').localeCompare(b.waiting?.since ?? ''));
}

export function trayMenu(
  waiting: SessionDto[],
  options: { autostart: boolean; paused: boolean; update?: null | string },
): TrayItem[] {
  const count = waiting.length;
  const header = `Bosco · ${waitingCount(count)}`;
  // Une mise à jour installée passe en tête du menu, jusqu'à la relance (CA-APPS-10)
  const update: TrayItem[] = options.update
    ? [
        {
          type: 'normal',
          label: `Relancer Bosco · version ${displayVersion(options.update)} installée`,
          action: { kind: 'relaunch' },
        },
        { type: 'separator' },
      ]
    : [];
  return [
    ...update,
    { type: 'header', label: header },
    ...waiting.map((session): TrayItem => ({
      type: 'normal',
      label: waitingLine(session),
      action: { kind: 'open', path: `/sessions/${session.id}` },
    })),
    { type: 'separator' },
    { type: 'normal', label: 'Ouvrir Bosco', action: { kind: 'open', path: '/' } },
    { type: 'normal', label: 'Nouvelle session', action: { kind: 'new-session' } },
    { type: 'checkbox', label: 'Suspendre les notifications 1 h', checked: options.paused, action: { kind: 'pause' } },
    { type: 'separator' },
    { type: 'checkbox', label: 'Lancer au démarrage', checked: options.autostart, action: { kind: 'autostart' } },
    { type: 'normal', label: 'Quitter Bosco', action: { kind: 'quit' } },
  ];
}

/** Ce qui t'attend, en mots : « 2 sessions t'attendent ». */
function waitingCount(count: number): string {
  if (count === 0) return 'rien ne t’attend';
  return count > 1 ? `${count} sessions t’attendent` : '1 session t’attend';
}

/** Infobulle de l'icône : le nombre de sessions qui t'attendent. */
export function trayTooltip(count: number): string {
  return count === 0 ? 'Bosco' : `Bosco · ${waitingCount(count)}`;
}
