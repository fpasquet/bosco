import { describe, expect, it } from 'vitest';
// Placement des sorties refusées dans le fil : l'heure exacte de chaque refus face aux parties d'un tour, que les
// scénarios ne règlent pas à la seconde.
import type { ConversationPartDto, ConversationTurnDto } from '@bosco/domain';
import { groupRefusals, placeRefusals, splitAtRefusals } from './refusals';

const at = (clock: string) => `2026-11-06T${clock}:00.000Z`;
const text = (clock: string, value: string): ConversationPartDto => ({ at: at(clock), kind: 'text', text: value });
const turn = (id: string, role: 'assistant' | 'user', clock: string, parts: ConversationPartDto[] = []) =>
  ({ at: at(clock), id, parts, role }) satisfies ConversationTurnDto;

describe('refusals in the feed', () => {
  const turns = [
    turn('ask', 'user', '15:04'),
    turn('answer', 'assistant', '15:05', [text('15:05', 'Modifie src/config/schema.ts'), text('15:10', 'pnpm test')]),
    turn('again', 'user', '15:20'),
    turn('second', 'assistant', '15:21'),
  ];

  it('CA-SESS-108 · groups the refusals of a host within a turn, at the time of the first', () => {
    const { byTurn, rest } = placeRefusals(turns, [
      { at: at('15:09'), host: 'raw.githubusercontent.com' },
      { at: at('15:08'), host: 'raw.githubusercontent.com' },
      { at: at('15:22'), host: 'raw.githubusercontent.com' },
    ]);
    expect(byTurn.get('answer')).toEqual([{ at: at('15:08'), count: 2, host: 'raw.githubusercontent.com' }]);
    expect(byTurn.get('second')).toEqual([{ at: at('15:22'), count: 1, host: 'raw.githubusercontent.com' }]);
    expect(rest).toEqual([]);
  });

  it('gives a refusal between a request and its answer to the answer, and keeps the others apart', () => {
    const { byTurn, rest } = placeRefusals(turns, [
      { at: at('15:20'), host: 'pypi.org' },
      { at: at('15:00'), host: 'example.org' },
    ]);
    expect(byTurn.get('second')?.map(({ host }) => host)).toEqual(['pypi.org']);
    expect(placeRefusals([], [{ at: at('15:00'), host: 'pypi.org' }]).rest).toHaveLength(1);
    expect(byTurn.get('answer')).toBeUndefined();
    expect(rest.map(({ host }) => host)).toEqual(['example.org']);
  });

  it('cuts the parts of a turn where the agent tried to go out', () => {
    const parts = turns[1]?.parts ?? [];
    const line = groupRefusals([{ at: at('15:08'), host: 'raw.githubusercontent.com' }])[0];
    if (!line) throw new Error('no line');
    expect(splitAtRefusals(parts, [line]).map((segment) => [segment.parts.length, segment.refusal?.host])).toEqual([
      [1, 'raw.githubusercontent.com'],
      [1, undefined],
    ]);
    expect(splitAtRefusals(parts, [])).toEqual([{ parts, refusal: null }]);
  });
});
