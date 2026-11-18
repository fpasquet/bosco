import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { STORY_RUNNING } from '../../fixtures';
import { SessionSide } from './session-side';

const meta = {
  title: 'Features/Sessions/SessionSide',
  component: SessionSide,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  args: { session: STORY_RUNNING, now: new Date(), resume: null, onCopy: fn() },
} satisfies Meta<typeof SessionSide>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Running: Story = {};

export const Closed: Story = {
  args: {
    session: { ...STORY_RUNNING, state: 'ended' },
    resume: 'claude --resume 5e0a91c3-6b1d-4c3a-9f27-41a8d3e0c5b2',
  },
};

/** Des sous-agents ont travaillé pour la session : leur part est comprise dans le coût, et dite à part. */
export const WithSubagents: Story = {
  args: {
    session: {
      ...STORY_RUNNING,
      state: 'ended',
      cost: { unpriced: false, usd: 14.62 },
      subagents: { tokens: 31_400_000, usd: 9.87 },
    },
    resume: 'claude --resume 5e0a91c3-6b1d-4c3a-9f27-41a8d3e0c5b2',
  },
};
