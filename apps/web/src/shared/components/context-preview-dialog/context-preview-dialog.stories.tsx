import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import type { ContextPreviewDto } from '@bosco/domain';
import { ContextPreviewDialog } from './context-preview-dialog';

const at = new Date('2026-11-06T14:00:00').toISOString();

const PREVIEW: ContextPreviewDto = {
  text: [
    '# Contexte du projet api-tarifs',
    '',
    '## Instructions communes (Tous les projets)',
    '- Messages de commit en anglais, au format Conventional Commits.',
    '- Node 22 au minimum.',
    '',
    '## Instructions du groupe Club des Trois Lacs',
    '- Les textes lus par les joueurs sont en français.',
    '',
    '## Décisions du projet (elles l’emportent sur les instructions ci-dessus)',
    '- DEC-1 Tarifs calculés par l’API, jamais par les sites',
    '  Tarifs calculés par l’API, jamais par les sites.',
    '',
    '## Place dans l’architecture',
    'Appelle : Service de paiement, Stockage des grilles',
  ].join('\n'),
  tokens: 1240,
  at: new Date('2026-11-06T15:14:00').toISOString(),
  absent: {
    proposed: [
      {
        id: 6,
        state: 'proposed',
        target: { kind: 'project', name: 'api-tarifs' },
        fromTask: null,
        reason: null,
        replacedBy: null,
        specifies: [],
        versions: [
          {
            title: 'Normaliser les fuseaux horaires avant le calcul du tarif',
            context: 'Les créneaux arrivent en heure locale.',
            decision: 'Convertir en UTC avant le calcul.',
            consequences: null,
            alternatives: null,
            at,
            author: 'une session',
            note: 'Proposition',
          },
        ],
      },
    ],
  },
};

const meta = {
  title: 'Shared/ContextPreviewDialog',
  component: ContextPreviewDialog,
  parameters: { layout: 'fullscreen' },
  args: { open: true, preview: PREVIEW, project: 'api-tarifs', onClose: fn(), onCopy: fn() },
} satisfies Meta<typeof ContextPreviewDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Le texte transmis à un agent d'api-tarifs, avec la décision proposée qui n'y figure pas. */
export const Default: Story = {};

/** Pendant le calcul du texte. */
export const Loading: Story = { args: { preview: undefined } };
