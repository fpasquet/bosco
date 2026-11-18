import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { DEFAULT_FILTERS } from '../../lib/filters';
import { UsageFilters } from './usage-filters';

const meta = {
  title: 'Features/Usage/UsageFilters',
  component: UsageFilters,
  parameters: { layout: 'padded' },
  args: {
    filters: DEFAULT_FILTERS,
    groups: [
      { id: 2, name: 'Club des Trois Lacs' },
      { id: 3, name: 'Gîtes du Haut-Vallon' },
      { id: 4, name: 'Perso' },
      { id: 5, name: 'Node.js' },
    ],
    projects: [
      { id: 1, name: 'api-tarifs' },
      { id: 2, name: 'creneaux' },
      { id: 3, name: 'site-clubs' },
    ],
    profiles: [
      { id: 'pro', label: 'pro' },
      { id: 'perso', label: 'perso' },
    ],
    models: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'],
    table: false,
    onChange: fn(),
    onTable: fn(),
  },
} satisfies Meta<typeof UsageFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 30 derniers jours, tous les profils, projets et modèles. */
export const Default: Story = {};

/** Filtrée sur un groupe : la puce se retire d'un clic, « Réinitialiser » remet tout par défaut (E23b). */
export const Group: Story = { args: { filters: { ...DEFAULT_FILTERS, period: '7', scope: { kind: 'group', id: 2 } } } };

export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };
