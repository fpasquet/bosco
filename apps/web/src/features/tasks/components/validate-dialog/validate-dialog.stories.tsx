import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_REVIEW, STORY_REVIEW_TASK, STORY_TASKS } from '../../fixtures';
import { ValidateDialog } from './validate-dialog';

const meta = {
  title: 'Features/Tasks/ValidateDialog',
  component: ValidateDialog,
  parameters: { layout: 'fullscreen' },
  args: {
    open: true,
    task: STORY_REVIEW_TASK,
    review: STORY_REVIEW,
    followers: STORY_TASKS.filter((task) => task.id === 13),
    busy: false,
    onCancel: fn(),
    onValidate: fn(),
  },
} satisfies Meta<typeof ValidateDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AskEachTime: Story = {};
