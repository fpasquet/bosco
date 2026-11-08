import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_TASKS } from '../../fixtures';
import { chainOf } from '../../lib/tasks';
import { TaskChain } from './task-chain';

const meta = {
  title: 'Features/Tasks/TaskChain',
  component: TaskChain,
  parameters: { layout: 'padded' },
  args: { tasks: chainOf(STORY_TASKS) },
} satisfies Meta<typeof TaskChain>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Chain: Story = {};
