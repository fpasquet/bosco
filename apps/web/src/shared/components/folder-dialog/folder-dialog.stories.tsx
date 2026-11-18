import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { Button } from '@/shared/ui/button';
import { FolderDialog } from './folder-dialog';

const HOME = '/home/camille';

const meta = {
  title: 'Shared/FolderDialog',
  component: FolderDialog,
  parameters: { docs: { story: { inline: false, height: '560px' } } },
  args: {
    title: 'Ajouter des projets',
    open: true,
    onCancel: fn(),
    onOpen: fn(),
    listing: {
      crumbs: [
        { name: '~', path: HOME },
        { name: 'www', path: `${HOME}/www` },
      ],
      folders: ['api-tarifs', 'creneaux', 'site-clubs'].map((name) => ({
        added: name === 'api-tarifs',
        git: true,
        name,
        path: `${HOME}/www/${name}`,
        suggestion: false,
      })),
      home: HOME,
      parent: HOME,
      path: `${HOME}/www`,
    },
    dimmed: (folder) => folder.added,
    renderFolder: (folder) => <span className="min-w-0 flex-1 truncate font-mono text-sm">{folder.name}</span>,
    footer: <Button className="ml-auto">Ajouter</Button>,
  },
} satisfies Meta<typeof FolderDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Dossier ~/www ouvert : chaque dossier s'ouvre, le dossier parent est ~. */
export const Default: Story = {};

/** Lecture du dossier en cours. */
export const Loading: Story = { args: { listing: null } };
