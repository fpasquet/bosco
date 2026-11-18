import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { ProjectSettings } from './project-settings';

const NOW = new Date('2026-11-06T15:13:00Z');
const minutesAgo = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString();

const meta = {
  title: 'Features/Sessions/ProjectSettings',
  component: ProjectSettings,
  parameters: { layout: 'padded' },
  args: {
    busy: false,
    error: null,
    now: NOW,
    onChange: fn(),
    data: {
      home: '/home/dev',
      outside: 4,
      settings: {
        attachWorktrees: true,
        excluded: ['/tmp', '~/www/archives'],
        gitOnly: true,
        hidden: ['/home/dev/www/rules-sandbox'],
        roots: ['~/www'],
      },
      projects: [
        { git: true, hidden: false, lastActivityAt: minutesAgo(3), name: 'labo-ia', root: '/home/dev/www/labo-ia' },
        {
          git: true,
          hidden: false,
          lastActivityAt: minutesAgo(60),
          name: 'outils-node',
          root: '/home/dev/www/outils-node',
        },
        {
          git: true,
          hidden: false,
          lastActivityAt: minutesAgo(1500),
          name: 'api-voix',
          root: '/home/dev/www/api-voix',
        },
        {
          git: true,
          hidden: true,
          lastActivityAt: minutesAgo(9 * 1440),
          name: 'rules-sandbox',
          root: '/home/dev/www/rules-sandbox',
        },
      ],
    },
  },
} satisfies Meta<typeof ProjectSettings>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Dossiers de projets, dossiers exclus et un projet masqué (E4d). */
export const Settled: Story = {};

/** Premier lancement : réglages par défaut, rien encore trouvé. */
export const Defaults: Story = {
  args: {
    data: {
      home: '/home/dev',
      outside: 0,
      projects: [],
      settings: { attachWorktrees: true, excluded: ['/tmp'], gitOnly: true, hidden: [], roots: [] },
    },
  },
};

/** Un chemin relatif refusé par Bosco. */
export const Refused: Story = {
  args: { error: '« www » n’est pas un chemin absolu : écris-le comme dans le terminal (~/www).' },
};
