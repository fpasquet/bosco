import { describe, expect, it } from 'vitest';
// Ce que l'application ne montre pas à l'œil : la notification native reprend le texte de notify-send (CA-APPS-03).
import type { NotificationDto } from '@bosco/domain';
import { nativeText, pathOf } from './notification-text.ts';

const base: NotificationDto = {
  at: '2026-11-06T15:13:00Z',
  excerpt: 'Bash · npm run db:migrate',
  id: 6,
  kind: 'permission',
  place: 'labo-ia',
  readAt: null,
  sessionId: 'c41e9a07',
  settled: null,
  taskId: null,
  title: 'Specs du tableau de bord Bosco',
  turnMinutes: null,
};

describe('nativeText', () => {
  it('titles with the kind and the repository, the session on the first line', () => {
    expect(nativeText(base)).toEqual({
      title: 'Autorisation · labo-ia',
      body: 'Specs du tableau de bord Bosco\nBash · npm run db:migrate',
    });
  });

  it('tells the length of a turn, and opens the task of a worker notification', () => {
    const turn = { ...base, kind: 'long-turn' as const, place: null, turnMinutes: 12, excerpt: null };
    expect(nativeText(turn)).toEqual({ title: 'Fin de tour · 12 min · Specs du tableau de bord Bosco', body: '' });
    expect([pathOf(base), pathOf({ ...base, taskId: 12 })]).toEqual(['/sessions/c41e9a07', '/tasks/12']);
  });
});
