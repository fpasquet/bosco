import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_CHANGES, STORY_REVIEW_TASK, STORY_TASKS } from '../../fixtures';
import { TaskReview } from './task-review';

const meta = {
  title: 'Features/Tasks/TaskReview',
  component: TaskReview,
  parameters: { layout: 'padded', nextjs: { appDirectory: true } },
  args: {
    task: STORY_REVIEW_TASK,
    changes: STORY_CHANGES,
    followers: STORY_TASKS.filter((task) => task.id === 13),
    busy: false,
    onCopy: fn(),
    onReject: fn(),
    onValidate: fn(),
  },
} satisfies Meta<typeof TaskReview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ToReview: Story = {};

export const Phone: Story = { globals: { viewport: { value: 'mobile1' } } };
