import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { ProfileSettingsView } from './profile-settings-view';

const meta = {
  title: 'Features/Sessions/ProfileSettingsView',
  component: ProfileSettingsView,
  parameters: { layout: 'padded', nextjs: { appDirectory: true } },
  args: {
    busy: false,
    onRemoveToken: fn(),
    onSave: fn(),
    onUseToken: fn(),
    path: '~/.claude',
    tokenPath: null,
    // Profil pro du fil rouge : « Demander » réglé ici, modèle et effort du profil Claude Code
    settings: {
      access: { kind: 'login', problem: null, tokenFile: null },
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
        tokenFile: null,
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

/** Un profil lancé avec un jeton longue durée, déclaré par son fichier : la ligne du compte dit « Jeton longue durée ». */
export const LongLivedToken: Story = {
  args: {
    path: '~/.claude-ultra',
    tokenPath: '~/.secrets/claude-ultra.token',
    settings: {
      ...meta.args.settings,
      access: { kind: 'token', problem: null, tokenFile: '/home/camille/.secrets/claude-ultra.token' },
      account: null,
      isDefault: false,
      source: { ...meta.args.settings.source, id: 'ultra', label: 'ultra', path: '/home/camille/.claude-ultra' },
    },
  },
};

/** Sans connexion ni jeton : « Aucun accès », avec les deux voies. */
export const NoAccess: Story = {
  args: {
    settings: {
      ...meta.args.settings,
      access: { kind: 'none', problem: null, tokenFile: null },
      account: null,
      isDefault: false,
    },
  },
};

/** Le fichier du jeton déclaré ne se lit plus : la raison s'affiche sous l'accès. */
export const UnreadableToken: Story = {
  args: {
    tokenPath: '~/.secrets/claude-ultra.token',
    settings: {
      ...meta.args.settings,
      access: {
        kind: 'none',
        problem: 'Le fichier du jeton est introuvable.',
        tokenFile: '/home/camille/.secrets/claude-ultra.token',
      },
      account: null,
      isDefault: false,
    },
  },
};

/** Sur le téléphone, écran poussé en lecture seule. */
export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };
