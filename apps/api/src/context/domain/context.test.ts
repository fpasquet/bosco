// Ce que les scénarios ne voient pas : l'empilement des socles, les exceptions et le texte transmis (RF-CONT-01 à 03).
import { describe, expect, it } from 'vitest';
import { contextOf, contextText } from './context-text.ts';
import { Decision, type DecisionText } from './decision.ts';
import { checkInheritance, type SocleSnapshot } from './socle.ts';

const at = new Date('2026-11-06T14:00:00');
const text = (title: string): DecisionText => ({
  title,
  context: 'Parce que.',
  decision: `${title}.`,
  consequences: null,
  alternatives: null,
});

const SOCLES: SocleSnapshot[] = [
  { id: 1, name: 'Socle commun', scope: 'global', inherits: null, repositories: [] },
  { id: 2, name: 'Socle Node.js', scope: 'shared', inherits: null, repositories: ['api-voix'] },
];

describe('context', () => {
  const vitest = Decision.write(1, { kind: 'socle', id: 2 }, text('Tests avec Vitest'), {
    accept: true,
    at,
    exceptionTo: null,
  });
  const commits = Decision.write(2, { kind: 'socle', id: 1 }, text('Commits en anglais'), {
    accept: true,
    at,
    exceptionTo: null,
  });
  const jest = Decision.write(3, { kind: 'repository', name: 'api-voix' }, text('Garder Jest'), {
    accept: true,
    at,
    exceptionTo: 1,
  });
  const proposed = Decision.propose(4, 'api-voix', text('Normaliser les sigles'), 12, at);
  const decisions = [vitest, commits, jest, proposed].map((decision) => decision.toSnapshot());

  it('stacks the socles, leaves out the excepted decision and what is only proposed', () => {
    const context = contextOf('api-voix', decisions, SOCLES, { calls: ['Stockage audio'], calledBy: [] });
    expect(context.excluded.map(({ id }) => id)).toEqual([1]);
    expect(context.proposed.map(({ id }) => id)).toEqual([4]);
    const textSent = contextText('api-voix', context);
    expect(textSent).toContain('DEC-3 Garder Jest (fait exception à « Tests avec Vitest »)');
    expect(textSent).toContain('Socle commun\n- Commits en anglais');
    expect(textSent).not.toContain('Normaliser les sigles');
    expect(textSent).not.toContain('- Tests avec Vitest');
  });

  it('applies a global socle to every repository, a shared one only to its repositories', () => {
    const elsewhere = contextOf('site-articles', decisions, SOCLES, { calls: [], calledBy: [] });
    expect(elsewhere.socles.map(({ socle }) => socle.name)).toEqual(['Socle commun']);
  });

  it('refuses a socle that inherits from itself, even indirectly', () => {
    const socles = [...SOCLES, { id: 3, name: 'NestJS', scope: 'shared' as const, inherits: 2, repositories: [] }];
    expect(() => checkInheritance(2, 3, socles)).toThrow('Un socle ne peut pas hériter de lui-même');
  });

  it('keeps every version, and asks for a note to change an accepted decision', () => {
    const decision = Decision.write(5, { kind: 'repository', name: 'api-voix' }, text('Cache audio'), {
      accept: true,
      at,
      exceptionTo: null,
    });
    expect(() => decision.edit(text('Cache audio 30 jours'), ' ', at)).toThrow('Écris une note');
    decision.edit(text('Cache audio 30 jours'), 'Durée précisée', at);
    expect(decision.toSnapshot().versions.map(({ title }) => title)).toEqual(['Cache audio', 'Cache audio 30 jours']);
  });
});

describe('parseProposal', () => {
  it('reads a decision proposed in a file by an agent, or nothing when a section is missing', async () => {
    const { parseProposal } = await import('./proposal.ts');
    const proposal = parseProposal(
      '# Normaliser les sigles\n\n## Contexte\nLes sigles arrivent avec des points.\n\n## Décision\nRetirer les points avant la recherche.\n',
    );
    expect(proposal).toMatchObject({
      title: 'Normaliser les sigles',
      decision: 'Retirer les points avant la recherche.',
    });
    expect(parseProposal('# Sans décision\n\n## Contexte\nRien.')).toBeNull();
  });
});
