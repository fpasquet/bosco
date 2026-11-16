import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { SandboxCard } from './sandbox-card';

const meta = {
  title: 'Features/Sessions/SandboxCard',
  component: SandboxCard,
  parameters: { layout: 'padded' },
  args: {
    busy: false,
    onRemove: fn(),
    onRetrieve: fn(),
    onStop: fn(),
    sandbox: {
      branch: 'bosco/s-typescript-6',
      from: 'develop',
      removed: false,
      retrievedAt: null,
      state: 'running',
      stopsAt: '2026-11-06T15:42:00.000Z',
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SandboxCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = {};

export const Stopped: Story = {
  args: { sandbox: { ...meta.args.sandbox, state: 'stopped', retrievedAt: '2026-11-06T15:16:00.000Z' } },
};

export const Removed: Story = { args: { sandbox: { ...meta.args.sandbox, state: 'missing', removed: true } } };
