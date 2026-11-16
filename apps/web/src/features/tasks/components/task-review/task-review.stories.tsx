import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_CHANGES, STORY_REVIEW_TASK, STORY_TASKS } from '../../fixtures';
import { DiffView } from '../diff-view';
import { TaskThreadPanel } from '../task-thread-panel';
import { TaskReview } from './task-review';

const meta = {
  title: 'Features/Tasks/TaskReview',
  component: TaskReview,
  parameters: { layout: 'padded', nextjs: { appDirectory: true } },
  args: {
    task: STORY_REVIEW_TASK,
    panel: (
      <TaskThreadPanel
        task={STORY_REVIEW_TASK}
        thread={<p className="text-muted">Fil de l’agent de T-12.</p>}
        changes={<DiffView changes={STORY_CHANGES} />}
      />
    ),
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

export const MySession: Story = {
  args: {
    task: {
      ...STORY_REVIEW_TASK,
      mode: 'session',
      outcome: { ...STORY_REVIEW_TASK.outcome, base: null, branch: null, from: null },
    },
  },
};
