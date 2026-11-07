import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_REVIEW_TASK, STORY_TASKS } from '../../fixtures';
import { RejectDialog } from './reject-dialog';

const meta = {
  title: 'Features/Tasks/RejectDialog',
  component: RejectDialog,
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    task: STORY_REVIEW_TASK,
    followers: STORY_TASKS.filter((task) => task.id === 13 || task.id === 15),
    busy: false,
    onCancel: fn(),
    onReject: fn(),
  },
} satisfies Meta<typeof RejectDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithFollowers: Story = {};
