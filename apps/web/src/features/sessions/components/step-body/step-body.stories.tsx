import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import type { StepBody as StepBodyView } from '../../lib/conversation';
import { STORY_STEPS } from '../../fixtures';
import { stepView } from '../../lib/conversation';
import { StepBody } from './step-body';

const bodyOf = (step: (typeof STORY_STEPS)[keyof typeof STORY_STEPS]): StepBodyView =>
  stepView(step, true).body ?? { command: '', kind: 'terminal', output: '' };

const meta = {
  title: 'Features/Sessions/StepBody',
  component: StepBody,
  args: { live: true, body: bodyOf(STORY_STEPS.terminal) },
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StepBody>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Terminal: Story = {};
export const TestResults: Story = { args: { body: bodyOf(STORY_STEPS.tests) } };
export const StackTrace: Story = { args: { body: bodyOf(STORY_STEPS.stack) } };
export const Diff: Story = { args: { body: bodyOf(STORY_STEPS.edit) } };
export const File: Story = { args: { body: bodyOf(STORY_STEPS.read) } };
export const Plan: Story = { args: { body: bodyOf(STORY_STEPS.plan) } };
export const Subagent: Story = { args: { body: bodyOf(STORY_STEPS.subagent) } };
export const SearchResults: Story = { args: { body: bodyOf(STORY_STEPS.search) } };
