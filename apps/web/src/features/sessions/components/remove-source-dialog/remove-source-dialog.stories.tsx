import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { RemoveSourceDialog } from './remove-source-dialog';

const meta = {
  title: 'Features/Sessions/RemoveSourceDialog',
  component: RemoveSourceDialog,
  parameters: { layout: 'fullscreen' },
  args: {
    busy: false,
    displayPath: '~/.claude-perso',
    onCancel: fn(),
    onConfirm: fn(),
    open: true,
    removal: {
      channel: false,
      defaultSubscription: false,
      groups: ['Perso'],
      label: 'perso',
      liveTracking: true,
      path: '/home/camille/.claude-perso',
      projects: [],
      running: 0,
      sessions: 45,
      subscription: 'pro',
    },
  },
} satisfies Meta<typeof RemoveSourceDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Un profil avec le suivi en direct, profil par défaut d'un groupe. */
export const Default: Story = {};

/** C'était l'abonnement par défaut : le profil surveillé suivant le devient. */
export const DefaultSubscription: Story = {
  args: {
    removal: {
      channel: true,
      defaultSubscription: true,
      groups: [],
      label: 'perso',
      liveTracking: true,
      path: '/home/camille/.claude-perso',
      projects: [],
      running: 0,
      sessions: 1,
      subscription: 'pro',
    },
  },
};

/** Un tour d'une session du profil tourne : le retrait attend. */
export const Running: Story = {
  args: {
    removal: {
      channel: false,
      defaultSubscription: false,
      groups: [],
      label: 'perso',
      liveTracking: false,
      path: '/home/camille/.claude-perso',
      projects: [],
      running: 1,
      sessions: 45,
      subscription: 'pro',
    },
  },
};
