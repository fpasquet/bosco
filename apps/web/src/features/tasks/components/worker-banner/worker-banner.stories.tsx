import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { WorkerBanner } from './worker-banner';

const meta = {
  title: 'Features/Tasks/WorkerBanner',
  component: WorkerBanner,
  parameters: { layout: 'padded' },
  args: { reason: 'Docker ne répond pas', busy: false, onRetry: fn() },
} satisfies Meta<typeof WorkerBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DockerDown: Story = {};
