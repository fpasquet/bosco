// Ce que les scénarios ne voient pas : l'ordre exact du texte transmis, les groupes sans instructions, un projet
// sans groupe, et le texte d'une session à plusieurs projets coupé à 10 000 caractères.
import { describe, expect, it } from 'vitest';
import { CONTEXT_LIMIT, contextOf, contextText, type GroupInstructions, sessionContextText } from './context-text.ts';
import { Decision, type DecisionText } from './decision.ts';

const at = new Date('2026-11-06T14:00:00');
const text = (title: string): DecisionText => ({
  title,
  context: 'Parce que.',
  decision: `${title}.`,
  consequences: null,
  alternatives: null,
});

const GROUPS: GroupInstructions[] = [
  {
    id: 1,
    name: 'Tous les projets',
    system: true,
    instructions: 'Messages de commit en anglais.\n\nNode 22 au minimum.',
  },
  { id: 2, name: 'Club des Trois Lacs', system: false, instructions: '- Les tickets se citent par leur clé.' },
  { id: 3, name: 'Perso', system: false, instructions: '  ' },
];

describe('context', () => {
  const jest = Decision.write(3, { kind: 'project', name: 'api-tarifs' }, text('Garder Jest'), { accept: true, at });
  const elsewhere = Decision.write(5, { kind: 'project', name: 'creneaux' }, text('Fastify'), { accept: true, at });
  const proposed = Decision.propose(4, 'api-tarifs', text('Normaliser les fuseaux horaires'), null, at);
  const decisions = [jest, elsewhere, proposed].map((decision) => decision.toSnapshot());

  it('CA-CONT-101 · sends every instruction, then the decisions of the project, announced as prevailing', () => {
    const context = contextOf('api-tarifs', decisions, GROUPS, { calls: ['Service de paiement'], calledBy: [] });
    expect(context.proposed.map(({ id }) => id)).toEqual([4]);
    expect(contextText('api-tarifs', context)).toBe(
      [
        '# Contexte du projet api-tarifs',
        '',
        '## Instructions communes (Tous les projets)',
        '- Messages de commit en anglais.',
        '- Node 22 au minimum.',
        '',
        '## Instructions du groupe Club des Trois Lacs',
        '- Les tickets se citent par leur clé.',
        '',
        '## Décisions du projet (elles l’emportent sur les instructions ci-dessus)',
        '- DEC-3 Garder Jest',
        '  Garder Jest.',
        '',
        '## Place dans l’architecture',
        'Appelle : Service de paiement',
      ].join('\n'),
    );
  });

  it('sends the decisions alone, without anything to prevail over, when no group has instructions', () => {
    const context = contextOf('creneaux', decisions, [{ ...GROUPS[0]!, instructions: '' }], {
      calls: [],
      calledBy: [],
    });
    expect(contextText('creneaux', context)).toBe(
      '# Contexte du projet creneaux\n\n## Décisions du projet\n- DEC-5 Fastify\n  Fastify.',
    );
  });

  it('keeps every version, and asks for a note to change an accepted decision', () => {
    const decision = Decision.write(5, { kind: 'project', name: 'site-perso' }, text('Cache audio'), {
      accept: true,
      at,
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

describe('sessionContextText', () => {
  it('CA-CONT-107 · cuts the context read by a session at 10 000 characters, and says so', () => {
    const sent = sessionContextText([
      { project: 'api-tarifs', text: `# Contexte du projet api-tarifs\n${'x'.repeat(CONTEXT_LIMIT)}` },
    ]);
    expect(sent).toHaveLength(CONTEXT_LIMIT);
    expect(sent.startsWith('# Contexte du projet api-tarifs')).toBe(true);
    expect(sent.endsWith('[Contexte coupé : 10 000 caractères au plus.]')).toBe(true);
    expect(sessionContextText([{ project: 'api-tarifs', text: 'court' }])).toBe('court');
  });

  it('CA-CONT-105 · gives one block per project, the principal first, and stays under 10 000 characters', () => {
    const blocks = [
      { project: 'api-tarifs', text: '# Contexte du projet api-tarifs' },
      { project: 'site-clubs', text: `# Contexte du projet site-clubs\n${'x'.repeat(CONTEXT_LIMIT)}` },
    ];
    const sent = sessionContextText(blocks);
    expect(
      sent.startsWith('Session sur 2 projets : api-tarifs (projet principal, dossier de travail), puis site-clubs.'),
    ).toBe(true);
    expect(sent.indexOf('api-tarifs\n') < sent.indexOf('# Contexte du projet site-clubs')).toBe(true);
    expect(sent).toHaveLength(CONTEXT_LIMIT);
    expect(sent.endsWith('[Contexte coupé : 10 000 caractères au plus.]')).toBe(true);
    expect(sessionContextText([blocks[0] ?? { project: '', text: '' }])).toBe('# Contexte du projet api-tarifs');
  });
});
