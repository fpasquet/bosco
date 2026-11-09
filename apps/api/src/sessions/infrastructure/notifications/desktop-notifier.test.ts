// Ce que les scénarios ne voient pas : le titre d'une notification du bureau tient sur une ligne.
import { describe, expect, it } from 'vitest';
import { desktopText } from './desktop-notifier.ts';

const base = {
  at: new Date(),
  excerpt: 'Tests verts.',
  id: 1,
  readAt: null,
  sessionId: 'a',
  settled: null,
  taskId: null,
};

describe('desktopText', () => {
  it('cuts a long title to one line, and tells the length of a turn (CA-SESS-85)', () => {
    const long = desktopText({ ...base, kind: 'turn-question', title: 'x'.repeat(80), turnMinutes: null });
    const turn = desktopText({ ...base, kind: 'long-turn', title: 'Corriger l’indexation', turnMinutes: 12 });
    expect([long.title.length, turn.title]).toEqual([71, 'Fin de tour · 12 min · Corriger l’indexation']);
  });
});
