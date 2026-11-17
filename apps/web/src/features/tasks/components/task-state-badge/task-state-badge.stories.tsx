import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TaskStateBadge } from './task-state-badge';

const meta = {
  title: 'Features/Tasks/TaskStateBadge',
  component: TaskStateBadge,
  args: { state: 'to_review' },
} satisfies Meta<typeof TaskStateBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ToReview: Story = {};
export const Blocked: Story = { args: { state: 'blocked' } };
export const Failed: Story = { args: { state: 'failed' } };
export const Cancelled: Story = { args: { state: 'cancelled' } };
