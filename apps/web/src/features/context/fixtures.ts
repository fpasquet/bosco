// Contexte du fil rouge des specs (lot 3), pour les histoires.
import type { ContextDto, ContextPreviewDto, DecisionDto, SocleDto } from '@bosco/domain';

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
    target: { kind: 'repository', name: 'api-voix' },
    exceptionTo: null,
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

export const STORY_VITEST = decision(10, 'Tests avec Vitest', { target: { kind: 'socle', id: 2 } });

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
  repository: 'api-voix',
  decisions: [
    decision(1, 'Synthèse vocale par un service externe'),
    decision(2, 'Lexique de prononciation versionné dans le dépôt'),
    STORY_DEC3,
    decision(5, 'Garder Jest pour les tests', { exceptionTo: 10 }),
  ],
  proposed: [STORY_PROPOSED],
  excluded: [STORY_VITEST],
  socles: [
    {
      socle: { id: 1, name: 'Socle commun', scope: 'global' },
      decisions: [
        decision(8, 'Messages de commit en anglais, au format Conventional Commits', {
          target: { kind: 'socle', id: 1 },
        }),
        decision(9, 'Node 22 au minimum', { target: { kind: 'socle', id: 1 } }),
      ],
    },
    {
      socle: { id: 2, name: 'Socle Node.js', scope: 'shared' },
      decisions: [decision(11, 'Journaux au format JSON', { target: { kind: 'socle', id: 2 } })],
    },
  ],
  architecture: { calls: ['Service de synthèse', 'Stockage audio'], calledBy: ['veille-presse', 'site-articles'] },
};

export const STORY_PREVIEW: ContextPreviewDto = {
  text: '# Contexte du dépôt api-voix\n\n## Décisions du dépôt\n- DEC-1 Synthèse vocale par un service externe\n  Synthèse vocale par un service externe.\n\n## Socles\nSocle commun\n- Node 22 au minimum\n  Node 22 au minimum.',
  tokens: 1240,
  at: new Date('2026-11-06T15:14:00').toISOString(),
  absent: { proposed: [STORY_PROPOSED], excluded: [STORY_VITEST] },
};

export const STORY_SOCLES: SocleDto[] = [
  {
    id: 1,
    name: 'Socle commun',
    scope: 'global',
    inherits: null,
    repositories: [],
    applied: ['api-voix', 'api-signets', 'api-liens', 'labo-ia', 'site-articles'],
    decisions: STORY_CONTEXT.socles[0]!.decisions,
    exceptions: [],
  },
  {
    id: 2,
    name: 'Socle Node.js',
    scope: 'shared',
    inherits: null,
    repositories: ['api-voix', 'api-signets', 'api-liens', 'labo-ia'],
    applied: ['api-voix', 'api-signets', 'api-liens', 'labo-ia'],
    decisions: [STORY_VITEST, ...STORY_CONTEXT.socles[1]!.decisions],
    exceptions: [{ repository: 'api-voix', decision: STORY_CONTEXT.decisions[3]!, replaces: STORY_VITEST }],
  },
];
