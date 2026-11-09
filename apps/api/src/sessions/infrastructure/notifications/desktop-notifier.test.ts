// Ce que les scénarios ne voient pas : la forme du texte d'une notification du bureau.
import { describe, expect, it } from 'vitest';
import { desktopText } from './desktop-notifier.ts';

const base = {
  at: new Date(),
  excerpt: 'Veux-tu que je lance les tests ?',
  id: 1,
  place: 'reservations',
  readAt: null,
  sessionId: 'a',
  settled: null,
  taskId: null,
  turnMinutes: null,
};

describe('desktopText', () => {
  it('titles with the kind and the repository, the session in bold above the excerpt (CA-SESS-85)', () => {
    const title = 'Sans rien lire ni modifier, réponds en une phrase : dis que le travail <a> repris';
    expect(desktopText({ ...base, kind: 'turn-question', title })).toEqual({
      title: 'Question · reservations',
      body: '<b>Sans rien lire ni modifier, réponds en une phrase : dis…</b>\nVeux-tu que je lance les tests ?',
    });
  });

  it('tells the length of a turn, and falls back on the session without a repository (CA-SESS-85)', () => {
    const turn = desktopText({
      ...base,
      kind: 'long-turn',
      place: null,
      title: 'Corriger l’indexation',
      turnMinutes: 12,
    });
    expect(turn).toEqual({
      title: 'Fin de tour · 12 min · Corriger l’indexation',
      body: 'Veux-tu que je lance les tests ?',
    });
  });

  it('escapes the markup of the excerpt', () => {
    expect(desktopText({ ...base, excerpt: 'a < b & c', kind: 'ended', title: 'T' }).body).toBe(
      '<b>T</b>\na &lt; b &amp; c',
    );
  });
});
