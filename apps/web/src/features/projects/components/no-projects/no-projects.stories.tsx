import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { firstSuggestions } from '../../fixtures';
import { NoProjects } from './no-projects';

const meta = {
  title: 'Features/Projects/NoProjects',
  component: NoProjects,
  parameters: { layout: 'padded' },
  args: { busy: false, home: '/home/camille', onAdd: fn(), onBrowse: fn(), suggestions: firstSuggestions },
} satisfies Meta<typeof NoProjects>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Aucun projet : les dépôts git récents sont cochés d'office, le dossier sans git jamais. */
export const Default: Story = {};

/** Aucune session encore lue : rien à proposer. */
export const Empty: Story = { args: { suggestions: [] } };

/** Sur le téléphone, les suggestions se lisent sans case. */
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };
