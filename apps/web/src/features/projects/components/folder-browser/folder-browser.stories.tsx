import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { wwwListing } from '../../fixtures';
import { FolderBrowser } from './folder-browser';

const meta = {
  title: 'Features/Projects/FolderBrowser',
  component: FolderBrowser,
  parameters: { docs: { story: { inline: false, height: '640px' } } },
  args: {
    busy: false,
    chosen: [],
    error: null,
    group: null,
    groups: [
      { id: 2, name: 'Club des Trois Lacs' },
      { id: 3, name: 'Gîtes du Haut-Vallon' },
    ],
    listing: wwwListing,
    onCancel: fn(),
    onCheck: fn(),
    onGroupChange: fn(),
    onOpen: fn(),
    onSubmit: fn(),
    onToggle: fn(),
    open: true,
  },
} satisfies Meta<typeof FolderBrowser>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Dossier ~/www ouvert : les dépôts déjà ajoutés grisés, une suggestion, deux dépôts git à cocher d'un coup. */
export const Default: Story = {};

/** Deux dossiers cochés, dont un sans git : il tournera seulement sur le poste. */
export const Chosen: Story = {
  args: {
    chosen: [
      { git: true, name: 'essais-css', path: `${wwwListing.path}/essais-css` },
      { git: false, name: 'archives', path: `${wwwListing.path}/archives` },
    ],
  },
};

/** Lecture du dossier en cours. */
export const Loading: Story = { args: { listing: null } };

/** Bosco refuse l'ajout : le dossier n'existe plus. */
export const Refused: Story = {
  args: {
    chosen: [{ git: true, name: 'site-tournois', path: `${wwwListing.path}/site-tournois` }],
    error: 'No folder /home/camille/www/site-tournois',
  },
};

/** Ouvert depuis les réglages du groupe Club des Trois Lacs : le groupe est choisi d'avance. */
export const FromGroup: Story = { args: { group: 2 } };
