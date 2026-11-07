import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_TASKS } from '../../fixtures';
import { sortTasks } from '../../lib/tasks';
import { TaskList } from './task-list';

const meta = {
  title: 'Features/Tasks/TaskList',
  component: TaskList,
  parameters: { layout: 'padded' },
  args: { tasks: sortTasks(STORY_TASKS.filter((task) => task.state !== 'failed')) },
} satisfies Meta<typeof TaskList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {};
export const Empty: Story = { args: { tasks: [] } };
