import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SessionStateBadge } from './session-state-badge';

const meta = {
  title: 'Features/Sessions/SessionStateBadge',
  component: SessionStateBadge,
  args: { state: 'running' },
} satisfies Meta<typeof SessionStateBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = {};

export const Inactive: Story = { args: { state: 'inactive' } };

export const Ended: Story = { args: { state: 'ended' } };
