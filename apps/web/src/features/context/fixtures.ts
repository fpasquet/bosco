// Contexte du fil rouge des specs (lot 3), pour les histoires.
import type { ContextDto, DecisionDto } from '@bosco/domain';

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
    target: { kind: 'project', name: 'api-tarifs' },
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

const proposedText = {
  title: 'Normaliser les fuseaux horaires avant le calcul du tarif',
  context:
    'Un créneau réservé à 23:30 depuis un autre fuseau tombait le lendemain et prenait le tarif du jour suivant.',
  decision: 'Ramener chaque créneau au fuseau du club avant de chercher son tarif dans la grille.',
  consequences: null,
  alternatives: null,
};

/** Proposée par l'agent de la session « Monter TypeScript en version 6 », en bac à sable. */
export const STORY_PROPOSED = decision(6, proposedText.title, {
  state: 'proposed',
  specifies: [3],
  versions: [
    {
      ...proposedText,
      at: at('10-12'),
      author: 'l’agent de la session « Monter TypeScript en version 6 »',
      note: 'Proposition',
      session: { id: 'b7e2c914', title: 'Monter TypeScript en version 6' },
    },
  ],
});

export const STORY_DEC3: DecisionDto = {
  ...decision(3, 'Arrondir les prix au centime supérieur, sauf exceptions des grilles'),
  versions: [
    {
      title: 'Arrondir les prix au centime supérieur',
      context: 'Les remises en pourcentage donnaient des prix à plus de deux décimales.',
      decision: 'Arrondir chaque prix au centime supérieur.',
      consequences: null,
      alternatives: null,
      at: at('10-12'),
      author: 'toi',
      note: 'Création',
    },
    {
      title: 'Arrondir les prix au centime supérieur, sauf exceptions des grilles',
      context: 'Les remises en pourcentage donnaient des prix à plus de deux décimales : 12,345 € au lieu de 12,35 €.',
      decision: 'Arrondir chaque prix au centime supérieur. Les exceptions sont listées dans les grilles de tarifs.',
      consequences: 'Un tarif arrondi autrement demande une exception dans sa grille.',
      alternatives: null,
      at: at('11-03'),
      author: 'toi',
      note: 'Ajout des exceptions des grilles',
    },
  ],
};

export const STORY_CONTEXT: ContextDto = {
  project: 'api-tarifs',
  decisions: [
    decision(1, 'Tarifs calculés par l’API, jamais par les sites'),
    decision(2, 'Grilles de tarifs versionnées dans le dépôt'),
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
    {
      id: 2,
      name: 'Club des Trois Lacs',
      system: false,
      instructions: 'Les textes lus par les joueurs sont en français.',
    },
    { id: 3, name: 'Node.js', system: false, instructions: 'Tests avec Vitest.\nJournaux au format JSON.' },
  ],
  architecture: { calls: ['Service de paiement', 'Stockage des grilles'], calledBy: ['creneaux', 'site-clubs'] },
};
