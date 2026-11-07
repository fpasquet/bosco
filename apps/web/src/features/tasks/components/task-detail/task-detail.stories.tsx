import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import type { TaskDto } from '@bosco/domain';
import { STORY_TASKS } from '../../fixtures';
import { TaskDetail } from './task-detail';

const byId = (id: number) => STORY_TASKS.find((task) => task.id === id) as TaskDto;

const meta = {
  title: 'Features/Tasks/TaskDetail',
  component: TaskDetail,
  parameters: { layout: 'padded', nextjs: { appDirectory: true } },
  args: { task: byId(13), failing: [byId(15)], busy: false, onCancel: fn(), onRelaunch: fn() },
} satisfies Meta<typeof TaskDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Blocked: Story = {};
export const FailedAndRelaunch: Story = { args: { task: byId(9), failing: [] } };
