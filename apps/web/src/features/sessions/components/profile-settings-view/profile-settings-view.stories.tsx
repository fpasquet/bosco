import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { ProfileSettingsView } from './profile-settings-view';

const meta = {
  title: 'Features/Sessions/ProfileSettingsView',
  component: ProfileSettingsView,
  parameters: { layout: 'padded', nextjs: { appDirectory: true } },
  args: {
    busy: false,
    onSave: fn(),
    path: '~/.claude',
    // Profil pro du fil rouge : « Demander » réglé ici, modèle et effort du profil Claude Code
    settings: {
      account: 'camille@exemple.dev',
      claude: { effort: 'medium', model: 'claude-sonnet-5-5', permissionMode: null },
      defaults: { effort: null, model: null, permissionMode: 'ask' },
      isDefault: true,
      source: {
        id: 'pro',
        label: 'pro',
        liveTracking: true,
        managed: false,
        path: '/home/camille/.claude',
        watched: true,
      },
      usedBy: {
        groups: [
          { id: 2, name: 'Club des Trois Lacs' },
          { id: 3, name: 'Gîtes du Haut-Vallon' },
        ],
        openSessions: 4,
      },
    },
  },
} satisfies Meta<typeof ProfileSettingsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Sans réglage dans Bosco : tout vient du profil Claude Code. */
export const FromClaudeCode: Story = {
  args: {
    settings: {
      ...meta.args.settings,
      defaults: { effort: null, model: null, permissionMode: null },
      isDefault: false,
      usedBy: { groups: [], openSessions: 0 },
    },
  },
};

/** Sur le téléphone, écran poussé en lecture seule. */
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };
