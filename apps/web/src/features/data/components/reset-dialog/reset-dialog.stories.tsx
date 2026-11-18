import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { ResetDialog } from './reset-dialog';

const meta = {
  title: 'Features/Data/ResetDialog',
  component: ResetDialog,
  parameters: { layout: 'fullscreen' },
  args: {
    busy: false,
    onCancel: fn(),
    onConfirm: fn(),
    open: true,
    reset: {
      branches: ['bosco/s-bloc-tarifs'],
      groups: 4,
      profiles: ['pro', 'perso'],
      projects: 15,
      sessions: 214,
      sources: 3,
    },
  },
} satisfies Meta<typeof ResetDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Deux profils à nettoyer et une branche de bac à sable pas encore récupérée. */
export const Default: Story = {};

/** Rien d'installé dans les profils, aucune branche à perdre. */
export const NothingToLose: Story = {
  args: { reset: { branches: [], groups: 0, profiles: [], projects: 2, sessions: 1, sources: 1 } },
};
