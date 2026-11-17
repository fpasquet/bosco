// Contexte du fil rouge des specs (lot 3), pour les histoires.
import type { ContextDto, ContextPreviewDto, DecisionDto } from '@bosco/domain';

const at = (day: string) => new Date(`2026-${day}T14:00:00`).toISOString();

function decision(
  id: number,
  title: string,
  overrides: Partial<DecisionDto> = {},
  body = { context: 'Contexte de la décision.', decision: `${title}.` },
): DecisionDto {
  return {
    id,
    state: 'accepted',
    target: { kind: 'project', name: 'api-voix' },
    fromTask: null,
    reason: null,
    replacedBy: null,
    specifies: [],
    versions: [
      { title, ...body, consequences: null, alternatives: null, at: at('10-12'), author: 'toi', note: 'Création' },
    ],
    ...overrides,
  };
}

export const STORY_PROPOSED = decision(
  6,
  'Normaliser les sigles avec points avant la recherche dans le lexique',
  { state: 'proposed', fromTask: 12, specifies: [3] },
  {
    context: 'La variante « S.N.C.F. » n’est pas trouvée dans le lexique ; les sigles arrivent avec ou sans points.',
    decision: 'Retirer les points des sigles avant la recherche, garder l’écriture d’origine dans le texte prononcé.',
  },
);

export const STORY_DEC3: DecisionDto = {
  ...decision(3, 'Prononcer les sigles lettre par lettre, sauf exceptions du lexique'),
  versions: [
    {
      title: 'Prononcer les sigles lettre par lettre',
      context: 'Prononcés comme des mots, les sigles donnaient des lectures erronées.',
      decision: 'Prononcer les sigles lettre par lettre.',
      consequences: null,
      alternatives: null,
      at: at('10-12'),
      author: 'toi',
      note: 'Création',
    },
    {
      title: 'Prononcer les sigles lettre par lettre, sauf exceptions du lexique',
      context: 'Prononcés comme des mots, les sigles donnaient des lectures erronées : « SNCF » était lu « sncf ».',
      decision: 'Prononcer les sigles lettre par lettre. Les exceptions sont listées dans le lexique de prononciation.',
      consequences: 'Un sigle qui se prononce comme un mot demande une entrée dans le lexique.',
      alternatives: null,
      at: at('11-03'),
      author: 'toi',
      note: 'Ajout des exceptions du lexique',
    },
  ],
};

export const STORY_CONTEXT: ContextDto = {
  project: 'api-voix',
  decisions: [
    decision(1, 'Synthèse vocale par un service externe'),
    decision(2, 'Lexique de prononciation versionné dans le projet'),
    STORY_DEC3,
    decision(5, 'Garder Jest pour les tests'),
  ],
  proposed: [STORY_PROPOSED],
  groups: [
    {
      id: 1,
      name: 'Tous les projets',
      system: true,
      instructions: 'Messages de commit en anglais, au format Conventional Commits.\nNode 22 au minimum.',
    },
    { id: 2, name: 'Médias', system: false, instructions: 'Les textes lus sont en français.' },
    { id: 3, name: 'Node.js', system: false, instructions: 'Tests avec Vitest.\nJournaux au format JSON.' },
  ],
  architecture: { calls: ['Service de synthèse', 'Stockage audio'], calledBy: ['veille-presse', 'site-articles'] },
};

export const STORY_PREVIEW: ContextPreviewDto = {
  text: [
    '# Contexte du projet api-voix',
    '',
    '## Instructions communes (Tous les projets)',
    '- Messages de commit en anglais, au format Conventional Commits.',
    '- Node 22 au minimum.',
    '',
    '## Instructions du groupe Node.js',
    '- Tests avec Vitest.',
    '',
    '## Décisions du projet (elles l’emportent sur les instructions ci-dessus)',
    '- DEC-1 Synthèse vocale par un service externe',
    '  Synthèse vocale par un service externe.',
  ].join('\n'),
  tokens: 1240,
  at: new Date('2026-11-06T15:14:00').toISOString(),
  absent: { proposed: [STORY_PROPOSED] },
};
