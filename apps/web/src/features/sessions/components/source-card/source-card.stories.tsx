import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { SourceCard } from './source-card';

const meta = {
  title: 'Features/Sessions/SourceCard',
  component: SourceCard,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <ul className="rounded-card border border-line bg-surface">
        <Story />
      </ul>
    ),
  ],
  args: {
    label: 'perso',
    path: '~/.claude-perso',
    liveTracking: true,
    lastSignalAt: new Date(Date.now() - 40_000),
    now: new Date(),
    onOpenLiveTracking: fn(),
  },
} satisfies Meta<typeof SourceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Installed: Story = {};

export const NotInstalled: Story = {
  args: { label: 'pro', path: '~/.claude', liveTracking: false, lastSignalAt: null },
};
