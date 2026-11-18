import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { ManagedSourceCard, SourceCard } from './source-card';

const meta = {
  title: 'Features/Sessions/SourceCard',
  component: SourceCard,
  parameters: { layout: 'padded', nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <ul className="rounded-card border border-line bg-surface">
        <Story />
      </ul>
    ),
  ],
  args: {
    label: 'perso',
    manageHref: '/settings/sources/perso',
    path: '~/.claude-perso',
    liveTracking: true,
    lastSignalAt: new Date(Date.now() - 40_000),
    now: new Date(),
    onOpenLiveTracking: fn(),
    onWatchedChange: fn(),
    watched: true,
  },
} satisfies Meta<typeof SourceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Installed: Story = {};

/** Sur le poste, le menu ⋯ propose « Retirer la source ». */
export const WithMenu: Story = { args: { onRemove: fn() } };

export const NotInstalled: Story = {
  args: { label: 'pro', path: '~/.claude', liveTracking: false, lastSignalAt: null },
};

export const Paused: Story = { args: { watched: false, liveTracking: false, lastSignalAt: null } };

/** La source « Bacs à sable », tenue par Bosco : ni interrupteur, ni « Gérer », ni suivi en direct ou canal. */
export const Sandboxes: Story = {
  render: () => (
    <ManagedSourceCard path="~/.local/share/bosco/sandboxes/profile" activity="1 bac à sable · dernier tour à 15:12" />
  ),
};

/** Sur le téléphone : l'interrupteur montre l'état sans le changer. */
export const ReadOnly: Story = { args: { readOnly: true } };

/** Suivi installé par une autre version de Bosco : la source passe « À mettre à jour ». */
export const Outdated: Story = { args: { liveTrackingOutdated: true } };

/** Format des sessions changé par Claude Code : la source passe « À mettre à jour », ses nouvelles sessions ne se lisent plus. */
export const Unreadable: Story = { args: { unreadable: true } };
