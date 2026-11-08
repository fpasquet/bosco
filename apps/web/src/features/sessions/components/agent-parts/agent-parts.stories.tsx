import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { STORY_CONVERSATION } from '../../fixtures';
import { AgentParts } from './agent-parts';

const meta = {
  title: 'Features/Sessions/AgentParts',
  component: AgentParts,
  args: { current: true, live: true, parts: STORY_CONVERSATION.turns[1]?.parts ?? [] },
  decorators: [
    (Story) => (
      <div className="flex max-w-2xl flex-col gap-2.5">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AgentParts>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Working: Story = {};
