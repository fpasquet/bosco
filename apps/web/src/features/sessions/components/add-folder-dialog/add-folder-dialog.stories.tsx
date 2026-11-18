import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { AddFolderDialog } from './add-folder-dialog';

const HOME = '/home/camille';

const meta = {
  title: 'Features/Sessions/AddFolderDialog',
  component: AddFolderDialog,
  parameters: { docs: { story: { inline: false, height: '560px' } } },
  args: {
    open: true,
    busy: false,
    serverError: null,
    onCancel: fn(),
    onOpen: fn(),
    onSubmit: fn(),
    listing: {
      crumbs: [{ name: '~', path: HOME }],
      folders: ['.claude', '.claude-perso', '.config', 'Documents', 'www'].map((name) => ({
        added: false,
        git: false,
        name,
        path: `${HOME}/${name}`,
        suggestion: false,
      })),
      home: HOME,
      parent: null,
      path: HOME,
    },
  },
} satisfies Meta<typeof AddFolderDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Le dossier personnel ouvert, dossiers cachés compris : les profils sont souvent ~/.claude-*. */
export const Default: Story = {};

/** Lecture du dossier en cours. */
export const Loading: Story = { args: { listing: null } };

/** Le dossier n'est pas un profil de Claude Code : le refus s'affiche sous la liste. */
export const NotAProfile: Story = {
  args: { serverError: 'Ce dossier n’est pas un dossier de configuration de Claude Code.' },
};
