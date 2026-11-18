import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { FullAccessDialog } from './full-access-dialog';

const meta = {
  title: 'Features/Sessions/FullAccessDialog',
  component: FullAccessDialog,
  parameters: { docs: { story: { inline: false } } },
  args: { open: true, project: 'api-tarifs', onCancel: fn(), onConfirm: fn(), onSandbox: fn() },
} satisfies Meta<typeof FullAccessDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Nouvelle session sur le poste : le bac à sable est proposé. */
export const Default: Story = {};

/** Depuis la barre d'outils d'une session : pas de bac à sable à proposer. */
export const FromSession: Story = { args: { onSandbox: undefined } };

/** Sur le téléphone, une feuille du bas, « Donner l'accès complet » en tête. */
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };
