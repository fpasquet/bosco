import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_STEPS } from '../../fixtures';
import { SubagentWork } from './subagent-work';

const subagent = STORY_STEPS.subagent.subagent;

const meta = {
  title: 'Features/Sessions/SubagentWork',
  component: SubagentWork,
  args: {
    agentType: subagent.agentType,
    live: false,
    model: subagent.model,
    parts: subagent.parts,
    partial: false,
    prompt: subagent.prompt,
    result: subagent.result,
  },
  decorators: [
    (Story) => (
      <div className="max-w-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SubagentWork>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Finished: Story = {};

export const Running: Story = {
  args: { live: true, parts: [...subagent.parts.slice(0, 1), STORY_STEPS.running], result: null },
};
