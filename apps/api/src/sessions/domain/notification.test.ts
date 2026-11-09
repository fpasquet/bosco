// Ce que les scénarios ne voient pas : chaque règle qui décide d'une notification (E15b).
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NOTIFICATIONS,
  endsWithQuestion,
  messageExcerpt,
  notificationOf,
  plainText,
  shortTitle,
} from './notification.ts';

describe('endsWithQuestion', () => {
  it('reads a final question mark, after quotes, emphasis or a closing parenthesis', () => {
    expect(
      [
        'Le digest est généré. Veux-tu que je lance les tests ?',
        'Je lance les tests ? »',
        'On garde Jest (ou Vitest ?)',
        '**Je fusionne ?**',
        'Tests verts. Pourquoi pas ? Je continue.',
        null,
      ].map(endsWithQuestion),
    ).toEqual([true, true, true, true, false, false]);
  });
});

describe('notificationOf', () => {
  const turn = (message: null | string, minutes: null | number) => ({ kind: 'turn' as const, message, minutes });

  it('notifies what waits for an answer and the work done, as set by default (CA-SESS-83)', () => {
    expect(
      (['permission', 'question', 'review', 'failed', 'ended'] as const).map((kind) =>
        notificationOf({ kind }, DEFAULT_NOTIFICATIONS),
      ),
    ).toEqual(['permission', 'question', 'review', 'failed', null]);
  });

  it('tells a turn ending on a question from a long or quick turn (CA-SESS-84)', () => {
    expect(notificationOf(turn('Veux-tu que je lance les tests ?', 0), DEFAULT_NOTIFICATIONS)).toBe('turn-question');
    expect(notificationOf(turn('Tests verts.', 1), DEFAULT_NOTIFICATIONS)).toBeNull();
    expect(notificationOf(turn('Tests verts.', 2), DEFAULT_NOTIFICATIONS)).toBe('long-turn');
    // Durée inconnue (Bosco redémarré pendant le tour) : on prévient plutôt que de taire
    expect(notificationOf(turn('Tests verts.', null), DEFAULT_NOTIFICATIONS)).toBe('long-turn');
    expect(notificationOf(turn('Tests verts.', 0), { ...DEFAULT_NOTIFICATIONS, turn: 'always' })).toBe('long-turn');
    expect(notificationOf(turn('Tests verts.', 60), { ...DEFAULT_NOTIFICATIONS, turn: 'never' })).toBeNull();
    expect(notificationOf(turn('Je lance ?', 0), { ...DEFAULT_NOTIFICATIONS, turnQuestion: false })).toBeNull();
  });
});

describe('messageExcerpt', () => {
  it('keeps the last whole sentences, a clause after a semicolon starting with a capital (CA-SESS-85)', () => {
    const message =
      'Sans rien lire ni modifier : le fichier `0001_init.sql` crée les tables. La migration suivante semble plutôt concerner un tarif horaire des salles (`0002_room_hourly_rate.sql`) ; veux-tu que je lance les tests (`make check` et `make test-db`) pour vérifier où en est le travail ?';
    expect(messageExcerpt(message)).toBe(
      'Veux-tu que je lance les tests (make check et make test-db) pour vérifier où en est le travail ?',
    );
  });

  it('keeps a short message whole, and the end of a single long sentence from a word', () => {
    const long = `Je ${'relis '.repeat(40)}le lexique`;
    const excerpt = messageExcerpt(long) ?? '';
    expect([messageExcerpt('Tests **verts**.'), excerpt.startsWith('…relis'), excerpt.length <= 180]).toEqual([
      'Tests verts.',
      true,
      true,
    ]);
  });
});

describe('plainText', () => {
  it('drops the Markdown, keeps the underscores of a file name', () => {
    expect(plainText('## Bilan\n- **fait** : `room_rate.sql`, [docs](https://x.dev)\n> *noté*')).toBe(
      'Bilan fait : room_rate.sql, docs noté',
    );
  });
});

describe('shortTitle', () => {
  it('cuts at the end of a word', () => {
    expect([shortTitle('Corriger l’indexation des PDF', 60), shortTitle('Corriger l’indexation des PDF', 20)]).toEqual([
      'Corriger l’indexation des PDF',
      'Corriger…',
    ]);
  });
});
