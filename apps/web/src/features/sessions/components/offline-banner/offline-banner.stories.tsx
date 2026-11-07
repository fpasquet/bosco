import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { OfflineBanner } from './offline-banner';

const ago = (seconds: number) => new Date(Date.now() - seconds * 1000).toISOString();

const meta = {
  title: 'Features/Sessions/OfflineBanner',
  component: OfflineBanner,
  parameters: { layout: 'padded' },
  args: {
    now: new Date(),
    offlineSince: ago(40),
    lastDataAt: ago(42),
    nextRetryAt: new Date(Date.now() + 3000).toISOString(),
    onRetry: fn(),
  },
} satisfies Meta<typeof OfflineBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unreachable: Story = {};
