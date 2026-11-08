import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_STEPS } from '../../fixtures';
import { StepGroup } from './step-group';

const meta = {
  title: 'Features/Sessions/StepGroup',
  component: StepGroup,
  args: { current: false, live: false, steps: [STORY_STEPS.read, STORY_STEPS.grep] },
} satisfies Meta<typeof StepGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FewSteps: Story = {};

export const Task: Story = {
  args: { steps: [STORY_STEPS.read, STORY_STEPS.grep, STORY_STEPS.edit, STORY_STEPS.terminal, STORY_STEPS.tests] },
};

export const CurrentTask: Story = {
  args: {
    current: true,
    live: true,
    steps: [STORY_STEPS.read, STORY_STEPS.edit, STORY_STEPS.terminal, STORY_STEPS.running],
  },
};
