import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { ProjectSettingsView } from './project-settings-view';

const NOW = new Date('2026-11-17T15:00:00');

const meta = {
  title: 'Features/Projects/Pages/ProjectSettingsView',
  component: ProjectSettingsView,
  parameters: { layout: 'padded' },
  args: {
    busy: false,
    now: NOW,
    domainError: null,
    startBranchError: null,
    project: {
      defaults: { effort: 'high', model: 'claude-sonnet-5-5', permissionMode: null, profile: null },
      id: 2,
      name: 'maison',
      path: '~/www/maison',
      git: true,
      monorepo: false,
      branch: 'develop',
      pinned: true,
      place: 'sandbox',
      startBranch: null,
      domains: ['paiement.exemple.dev', 'grilles.exemple.dev'],
      sessions: 38,
      running: 0,
      lastSessionAt: new Date('2026-11-17T14:59:55').toISOString(),
    },
    groups: [
      {
        id: 2,
        name: 'Perso',
        description: null,
        instructions: '',
        defaults: { effort: null, model: null, permissionMode: null, profile: null },
        sidebar: true,
        system: false,
        projects: [
          { id: 3, name: 'site-perso' },
          { id: 2, name: 'maison' },
        ],
      },
    ],
    onAddToGroup: fn(),
    onNewGroup: fn(),
    onAddDomain: fn(),
    onDefaults: fn(),
    onPlace: fn(),
    profiles: [
      { label: 'pro', path: '/home/camille/.claude' },
      { label: 'perso', path: '/home/camille/.claude-perso' },
    ],
    inherited: {
      effort: { value: 'high', origin: { level: 'project', name: 'maison' } },
      model: { value: 'claude-sonnet-5-5', origin: { level: 'project', name: 'maison' } },
      permissionMode: { value: 'ask', origin: { level: 'profile', name: 'pro' } },
      profile: { value: '/home/camille/.claude', origin: { level: 'defaultProfile' } },
    },
    onRemoveDomain: fn(),
    onRemove: fn(),
    onStartBranch: fn(),
  },
} satisfies Meta<typeof ProjectSettingsView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Un dossier sans git : le bac à sable est grisé, avec sa raison. */
export const WithoutGit: Story = {
  args: {
    project: {
      defaults: { effort: null, model: null, permissionMode: null, profile: null },
      id: 4,
      name: 'notes-clubs',
      path: '~/notes-clubs',
      git: false,
      monorepo: false,
      branch: null,
      pinned: false,
      place: null,
      startBranch: null,
      domains: [],
      sessions: 1,
      running: 0,
      lastSessionAt: null,
    },
  },
};

/** Une branche de départ refusée par Bosco, sous son champ. */
export const BranchRefused: Story = { args: { startBranchError: 'Ce nom de branche n’est pas valable pour git.' } };

export const Mobile: Story = { globals: { viewport: { value: 'mobile1' } } };

/** Un domaine refusé par Bosco, sous son champ. */
export const DomainRefused: Story = {
  args: { domainError: 'Un nom de domaine seul, sans protocole ni chemin : pypi.org ou *.github.com.' },
};
