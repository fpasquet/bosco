import { describe, expect, it } from 'vitest';
// Ce que l'application ne montre pas à l'œil : le menu de la barre système suit les sessions qui t'attendent (E17a).
import type { SessionDto } from '@bosco/domain';
import { trayMenu, trayTooltip, waitingSessions } from './tray-menu.ts';

function session(id: string, state: SessionDto['state'], waiting: SessionDto['waiting'], title: string): SessionDto {
  return { id, state, waiting, title } as SessionDto;
}

const permission = session(
  'c41e9a07',
  'waiting',
  { kind: 'permission', tool: 'Bash', detail: 'npm run db:migrate', requestId: 'r1', since: '2026-11-06T15:13:00Z' },
  'Specs du tableau de bord Bosco',
);
const turn = session(
  'a3f2c901',
  'waiting',
  { kind: 'turn', message: 'Veux-tu que je lance les tests ?', since: '2026-11-06T15:08:00Z' },
  'Digest quotidien de la veille média',
);
const running = session('5b2d81e4', 'running', null, 'Corriger l’indexation des PDF');

describe('trayMenu', () => {
  it('lists the sessions that wait, the oldest first, each opening its session (CA-APPS-02)', () => {
    const waiting = waitingSessions([permission, running, turn]);
    const items = trayMenu(waiting, { autostart: true, paused: false });
    expect(items.slice(0, 3)).toEqual([
      { type: 'header', label: 'Bosco · 2 sessions t’attendent' },
      {
        type: 'normal',
        label: 'Digest quotidien de la veille média · tour terminé',
        action: { kind: 'open', path: '/sessions/a3f2c901' },
      },
      {
        type: 'normal',
        label: 'Specs du tableau de bord Bosco · Bash npm run db:migrate',
        action: { kind: 'open', path: '/sessions/c41e9a07' },
      },
    ]);
    expect(
      items
        .filter((item) => item.type !== 'separator')
        .map((item) => item.label)
        .slice(3),
    ).toEqual([
      'Ouvrir Bosco',
      'Nouvelle session',
      'Suspendre les notifications 1 h',
      'Lancer au démarrage',
      'Quitter Bosco',
    ]);
  });

  it('says when nothing waits', () => {
    expect([trayMenu([], { autostart: false, paused: false })[0], trayTooltip(0), trayTooltip(1)]).toEqual([
      { type: 'header', label: 'Bosco · rien ne t’attend' },
      'Bosco',
      'Bosco · 1 session t’attend',
    ]);
  });
});
