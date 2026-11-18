import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { TokenFileDialog } from './token-file-dialog';

const HOME = '/home/camille';

const meta = {
  title: 'Features/Sessions/TokenFileDialog',
  component: TokenFileDialog,
  parameters: { docs: { story: { inline: false, height: '560px' } } },
  args: {
    open: true,
    busy: false,
    serverError: null,
    onCancel: fn(),
    onOpen: fn(),
    onSubmit: fn(),
    listing: {
      crumbs: [
        { name: '~', path: HOME },
        { name: '.secrets', path: `${HOME}/.secrets` },
      ],
      files: ['claude-ultra.token', 'notes.txt'].map((name) => ({ name, path: `${HOME}/.secrets/${name}` })),
      folders: [{ added: false, git: false, name: 'archive', path: `${HOME}/.secrets/archive`, suggestion: false }],
      home: HOME,
      parent: HOME,
      path: `${HOME}/.secrets`,
    },
  },
} satisfies Meta<typeof TokenFileDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Un dossier ouvert : ses dossiers, puis ses fichiers, cachés compris ; on choisit le fichier du jeton. */
export const Default: Story = {};

/** Le fichier choisi ne contient rien : le refus s'affiche sous la liste. */
export const EmptyFile: Story = { args: { serverError: 'Le fichier du jeton est vide.' } };
