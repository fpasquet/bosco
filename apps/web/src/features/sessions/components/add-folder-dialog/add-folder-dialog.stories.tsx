import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { AddFolderDialog } from './add-folder-dialog';

const meta = {
  title: 'Features/Sessions/AddFolderDialog',
  component: AddFolderDialog,
  parameters: { docs: { story: { inline: false, height: '420px' } } },
  args: { open: true, busy: false, serverError: null, onCancel: fn(), onSubmit: fn() },
} satisfies Meta<typeof AddFolderDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Le dossier n'est pas un profil de Claude Code : le refus s'affiche sous le champ. */
export const NotAProfile: Story = {
  args: { serverError: 'Ce dossier n’est pas un dossier de configuration de Claude Code.' },
};
